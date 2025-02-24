/**
 * URL Scraper for AI for Education Studies
 * 
 * This script scrapes URLs from the AI for Education website and
 * formats them for inclusion in our studies.csv file.
 */

const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const csv = require('csv-parser');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

// Target URL to scrape
const targetUrl = 'https://www.aiforeducation.io/ai-resources/studies-related-to-generative-ai-in-education';

// Function to scrape study links
async function scrapeStudyLinks() {
  try {
    console.log('Fetching webpage content...');
    const { data } = await axios.get(targetUrl);
    const $ = cheerio.load(data);
    
    // Store URLs with their titles for matching
    const studyLinks = [];
    
    // Adjust these selectors based on the actual structure of the website
    $('.study-item').each((index, element) => {
      const title = $(element).find('.study-title').text().trim();
      const url = $(element).find('a').attr('href');
      
      if (title && url) {
        studyLinks.push({
          title,
          url
        });
      }
    });
    
    console.log(`Found ${studyLinks.length} study links`);
    return studyLinks;
  } catch (error) {
    console.error('Error scraping study links:', error);
    return [];
  }
}

// Function to update our CSV with the scraped URLs
async function updateStudiesCsv(studyLinks) {
  // Read current studies.csv
  const studies = [];
  
  fs.createReadStream('data/studies.csv')
    .pipe(csv())
    .on('data', (data) => studies.push(data))
    .on('end', () => {
      // Match studies with scraped links based on title similarity
      studies.forEach(study => {
        // Find best match for study title
        const bestMatch = findBestMatch(study.title, studyLinks);
        
        if (bestMatch) {
          study.url = bestMatch.url;
        }
      });
      
      // Write updated CSV
      const csvWriter = createCsvWriter({
        path: 'data/studies-with-links.csv',
        header: [
          {id: 'id', title: 'id'},
          {id: 'categories', title: 'categories'},
          {id: 'title', title: 'title'},
          {id: 'organization', title: 'organization'},
          {id: 'date', title: 'date'},
          {id: 'key_findings', title: 'key_findings'},
          {id: 'url', title: 'url'},
          {id: 'metadata', title: 'metadata'}
        ]
      });
      
      csvWriter.writeRecords(studies)
        .then(() => {
          console.log('CSV file was written successfully');
        });
    });
}

// Function to find the best match for a study title using string similarity
function findBestMatch(studyTitle, studyLinks) {
  // This is a simple implementation - you might want to use a library like string-similarity
  let bestMatch = null;
  let highestSimilarity = 0;
  
  studyLinks.forEach(link => {
    const similarity = calculateSimilarity(studyTitle, link.title);
    
    if (similarity > highestSimilarity && similarity > 0.7) { // 0.7 is a threshold for a good match
      highestSimilarity = similarity;
      bestMatch = link;
    }
  });
  
  return bestMatch;
}

// Simple string similarity function (you'd use a more robust solution in practice)
function calculateSimilarity(string1, string2) {
  const s1 = string1.toLowerCase();
  const s2 = string2.toLowerCase();
  
  // Very basic similarity check - use a proper algorithm in a real implementation
  return s1.includes(s2) || s2.includes(s1) ? 0.8 : 0;
}

// Run the scraper
async function run() {
  console.log('Starting URL scraper...');
  
  const studyLinks = await scrapeStudyLinks();
  
  if (studyLinks.length > 0) {
    await updateStudiesCsv(studyLinks);
  } else {
    console.log('No links found to update CSV');
  }
}

run(); 