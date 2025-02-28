const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');
const csv = require('csv-parser');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

// Path to the HTML file and CSV output
const htmlFilePath = path.join(__dirname, 'data', 'Studies Related to Generative AI in Education — AI for Education.html');
const outputCsvPath = path.join(__dirname, 'data', 'all-studies.csv');

// Read the HTML file
const html = fs.readFileSync(htmlFilePath, 'utf8');
const dom = new JSDOM(html);
const document = dom.window.document;

// Extract studies from the HTML
function extractStudies() {
  const studies = [];
  let idCounter = 1;
  
  // Look for study-like elements (sections, divs with titles, etc.)
  const studySections = document.querySelectorAll('section, .sqs-block-content');
  
  studySections.forEach(section => {
    // Look for titles/headings
    const titleElements = section.querySelectorAll('h1, h2, h3, h4, strong');
    const linkElements = section.querySelectorAll('a[href]');
    
    // Extract paragraphs that might contain findings
    const paragraphs = section.querySelectorAll('p');
    
    titleElements.forEach(titleEl => {
      const title = titleEl.textContent.trim();
      
      // Skip empty titles or very short titles
      if (!title || title.length < 5 || title.toLowerCase().includes('studies')) return;
      
      // Find closest link (potential URL to the study)
      let url = '';
      for (const link of linkElements) {
        if (link.textContent.includes(title) || 
            titleEl.contains(link) || 
            link.parentNode.contains(titleEl)) {
          url = link.href;
          break;
        }
      }
      
      // Extract key findings (nearby paragraphs)
      let findings = '';
      for (const para of paragraphs) {
        if (isNearby(titleEl, para) && para.textContent.trim().length > 20) {
          findings = para.textContent.trim();
          break;
        }
      }
      
      // Skip if we don't have findings
      if (!findings) return;
      
      // Create a unique ID for the study
      const id = `study-${idCounter++}`;
      
      // Extract organization (often in parentheses after title)
      let organization = '';
      const titleText = title;
      const orgMatch = titleText.match(/\(([^)]+)\)$/);
      if (orgMatch) {
        organization = orgMatch[1].trim();
      }
      
      // Estimate date (current year by default)
      const date = '2025-01';
      
      // Extract potential categories (keywords in the title or findings)
      const potentialKeywords = [
        'Assessment', 'Performance', 'Teaching', 'Learning', 'Tools', 
        'Implementation', 'Equity', 'Policy', 'Ethics', 'Future',
        'Collaboration', 'Pedagogy', 'Curriculum', 'Professional',
        'Development', 'Research', 'Technology', 'Innovation'
      ];
      
      const categories = potentialKeywords
        .filter(keyword => 
          title.includes(keyword) || 
          findings.includes(keyword)
        )
        .slice(0, 2)
        .join('|');
      
      // Assemble study object
      const study = {
        id,
        categories: categories || 'General AI Studies',
        title: title.replace(/\([^)]+\)$/, '').trim(),
        organization: organization || 'Research Organization',
        date,
        key_findings: findings,
        url: url || '#',
        metadata: 'complexity=3|region=global|subjects=general'
      };
      
      studies.push(study);
    });
  });
  
  return studies;
}

// Helper to check if two elements are near each other (findings near title)
function isNearby(el1, el2) {
  const rect1 = el1.getBoundingClientRect();
  const rect2 = el2.getBoundingClientRect();
  
  // Check if elements are within reasonable distance vertically
  const verticalDistance = Math.abs(rect2.top - rect1.bottom);
  return verticalDistance < 200; // Pixels threshold
}

// Write studies to CSV
function writeStudiesToCsv(studies) {
  // First read existing studies to avoid duplicates
  const existingStudies = [];
  
  // Setup CSV writer
  const csvWriter = createCsvWriter({
    path: outputCsvPath,
    header: [
      { id: 'id', title: 'id' },
      { id: 'categories', title: 'categories' },
      { id: 'title', title: 'title' },
      { id: 'organization', title: 'organization' },
      { id: 'date', title: 'date' },
      { id: 'key_findings', title: 'key_findings' },
      { id: 'url', title: 'url' },
      { id: 'metadata', title: 'metadata' }
    ]
  });
  
  // Check for existing studies CSV to prevent duplicates
  try {
    if (fs.existsSync('data/studies.csv')) {
      fs.createReadStream('data/studies.csv')
        .pipe(csv())
        .on('data', (data) => existingStudies.push(data))
        .on('end', () => {
          // Extract existing titles
          const existingTitles = existingStudies.map(study => study.title);
          
          // Filter out duplicate studies
          const newStudies = studies.filter(study => !existingTitles.includes(study.title));
          
          // Combine existing and new studies
          const allStudies = [...existingStudies, ...newStudies];
          
          // Write to CSV
          csvWriter.writeRecords(allStudies)
            .then(() => {
              console.log(`Wrote ${allStudies.length} studies to ${outputCsvPath}`);
              console.log(`${existingStudies.length} existing studies, ${newStudies.length} new studies`);
            });
        });
    } else {
      // No existing CSV, write all studies
      csvWriter.writeRecords(studies)
        .then(() => {
          console.log(`Wrote ${studies.length} studies to ${outputCsvPath}`);
        });
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

// Main execution
const extractedStudies = extractStudies();
console.log(`Extracted ${extractedStudies.length} studies from HTML`);

if (extractedStudies.length > 0) {
  writeStudiesToCsv(extractedStudies);
} else {
  console.log('No studies found in the HTML file');
} 