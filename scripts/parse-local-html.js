/**
 * URL Extractor for Local HTML File
 * 
 * This script extracts URLs from the local copy of the AI for Education website
 * and formats them for inclusion in our studies.csv file.
 */

const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');
const csv = require('csv-parser');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

// Path to the local HTML file
const HTML_FILE_PATH = path.join('data', 'Studies Related to Generative AI in Education — AI for Education.html');

/**
 * Calculate string similarity between two strings
 * @param {string} a - First string
 * @param {string} b - Second string
 * @returns {number} - Similarity score between 0 and 1
 */
function calculateSimilarity(a, b) {
  const aLower = a.toLowerCase();
  const bLower = b.toLowerCase();
  
  // Simple includes check
  if (aLower.includes(bLower) || bLower.includes(aLower)) {
    return 0.8;
  }
  
  // Count matching words
  const aWords = aLower.split(/\s+/);
  const bWords = bLower.split(/\s+/);
  const matchingWords = aWords.filter(word => bWords.includes(word)).length;
  
  if (matchingWords > 0) {
    const matchRatio = matchingWords / Math.max(aWords.length, bWords.length);
    return 0.5 + (matchRatio * 0.5); // Scale to 0.5-1.0 range if there are matching words
  }
  
  return 0.0;
}

/**
 * Extract study links from the local HTML file
 * @returns {Promise<Array>} - Array of study title and URL objects
 */
async function extractStudyLinks() {
  console.log(`Reading local HTML file: ${HTML_FILE_PATH}`);
  
  try {
    // Check if file exists
    if (!fs.existsSync(HTML_FILE_PATH)) {
      throw new Error(`The file ${HTML_FILE_PATH} does not exist`);
    }
    
    // Read the HTML file
    const htmlContent = fs.readFileSync(HTML_FILE_PATH, 'utf-8');
    const $ = cheerio.load(htmlContent);
    const studyLinks = [];
    
    // First pass: Find all h4 tags which seem to be section headers
    $('h4').each((i, header) => {
      const category = $(header).text().trim();
      console.log(`\nProcessing category: ${category}`);
      
      // Find all paragraphs and elements after this header but before the next h4
      $(header).nextUntil('h4').each((j, element) => {
        // Look for study titles (usually in bold/strong tags)
        $(element).find('strong').each((k, titleElem) => {
          const title = $(titleElem).text().trim();
          
          // Skip empty titles or category headers
          if (!title || title.endsWith(':') || title === category || title.length < 5) {
            return;
          }
          
          // Try to find associated link - look at parent paragraph
          const parent = $(titleElem).parent();
          const links = parent.find('a');
          
          if (links.length > 0) {
            const url = $(links[0]).attr('href');
            console.log(`Found: ${title} -> ${url}`);
            
            studyLinks.push({
              title,
              url
            });
          }
        });
      });
    });
    
    // Second pass: Look for direct paragraphs with bold text and links
    $('p').each((i, paragraph) => {
      const strongTags = $(paragraph).find('strong');
      
      // Skip paragraphs without bold text
      if (strongTags.length === 0) {
        return;
      }
      
      strongTags.each((j, strong) => {
        const title = $(strong).text().trim();
        
        // Skip empty titles or those that seem to be headers
        if (!title || title.endsWith(':') || title.length < 5) {
          return;
        }
        
        // Check if title already exists in our list
        const exists = studyLinks.some(link => link.title === title);
        if (exists) {
          return;
        }
        
        // Look for links in this paragraph
        const links = $(paragraph).find('a');
        if (links.length > 0) {
          const url = $(links[0]).attr('href');
          console.log(`Found additional: ${title} -> ${url}`);
          
          studyLinks.push({
            title,
            url
          });
        }
      });
    });
    
    console.log(`\nFound ${studyLinks.length} study links`);
    return studyLinks;
  } catch (error) {
    console.error('Error extracting study links:', error);
    return [];
  }
}

/**
 * Update our studies CSV with the extracted URLs
 * @param {Array} studyLinks - Array of study title and URL objects
 */
async function updateStudiesCsv(studyLinks) {
  const INPUT_CSV = path.join('data', 'studies.csv');
  const OUTPUT_CSV = path.join('data', 'studies-with-links.csv');
  
  const studies = [];
  
  // Read current studies
  fs.createReadStream(INPUT_CSV)
    .pipe(csv())
    .on('data', (data) => studies.push(data))
    .on('end', () => {
      // Match studies with extracted links based on title similarity
      studies.forEach(study => {
        let bestMatch = null;
        let highestSimilarity = 0.6; // Lower threshold to catch more matches
        
        const studyTitle = study.title;
        console.log(`\nLooking for matches for: ${studyTitle}`);
        
        studyLinks.forEach(link => {
          const similarity = calculateSimilarity(studyTitle, link.title);
          console.log(`  Comparing with '${link.title}' - similarity: ${similarity.toFixed(2)}`);
          
          if (similarity > highestSimilarity) {
            highestSimilarity = similarity;
            bestMatch = link;
          }
        });
        
        if (bestMatch) {
          study.url = bestMatch.url;
          console.log(`✓ Best match: '${bestMatch.title}' -> ${bestMatch.url}`);
        } else {
          console.log(`✗ No good match found`);
        }
      });
      
      // Write updated CSV
      const csvWriter = createCsvWriter({
        path: OUTPUT_CSV,
        header: Object.keys(studies[0]).map(id => ({ id, title: id }))
      });
      
      csvWriter.writeRecords(studies)
        .then(() => {
          console.log(`\nCSV file was written successfully to ${OUTPUT_CSV}`);
        });
    });
}

/**
 * Main function to run the extractor
 */
async function main() {
  console.log('Starting URL extractor for local HTML file...');
  
  const studyLinks = await extractStudyLinks();
  
  if (studyLinks.length > 0) {
    await updateStudiesCsv(studyLinks);
  } else {
    console.log('No links found to update CSV');
  }
}

main(); 