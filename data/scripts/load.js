/**
 * Data loading script for GenAI Studies
 * Converts JSON data to CSV format for the web application
 */

const fs = require('fs');
const path = require('path');
const { createObjectCsvWriter } = require('csv-writer');

// Path to input and output files
const inputJsonPath = path.join(__dirname, '..', 'processed', 'transformed-studies.json');
const outputCsvPath = path.join(__dirname, '..', 'processed', 'studies.csv');

/**
 * Convert JSON data to CSV format
 */
function generateCSV() {
  console.log('Starting CSV generation...');
  
  try {
    // Read the transformed JSON data
    const rawData = fs.readFileSync(inputJsonPath, 'utf8');
    const studies = JSON.parse(rawData);
    
    console.log(`Loaded ${studies.length} studies for CSV conversion`);
    
    // Prepare the CSV writer
    const csvWriter = createObjectCsvWriter({
      path: outputCsvPath,
      header: [
        { id: 'id', title: 'id' },
        { id: 'title', title: 'title' },
        { id: 'url', title: 'url' },
        { id: 'key_findings', title: 'key_findings' },
        { id: 'organization', title: 'organization' },
        { id: 'date', title: 'date' },
        { id: 'categories', title: 'categories' },
        { id: 'metadata', title: 'metadata' }
      ]
    });
    
    // Format studies for CSV
    const formattedStudies = studies.map(study => {
      // Format categories as pipe-delimited
      const categoriesStr = Array.isArray(study.categories) 
        ? study.categories.join('|') 
        : study.categories;
      
      // Format metadata as pipe-delimited key=value pairs
      let metadataStr = '';
      if (study.metadata) {
        const metadataPairs = [];
        for (const [key, value] of Object.entries(study.metadata)) {
          if (Array.isArray(value)) {
            metadataPairs.push(`${key}=${value.join(',')}`);
          } else {
            metadataPairs.push(`${key}=${value}`);
          }
        }
        metadataStr = metadataPairs.join('|');
      }
      
      return {
        id: study.id,
        title: study.title,
        url: study.url,
        key_findings: study.key_findings,
        organization: study.organization,
        date: study.date,
        categories: categoriesStr,
        metadata: metadataStr
      };
    });
    
    // Write the CSV file
    csvWriter.writeRecords(formattedStudies)
      .then(() => {
        console.log(`CSV generation complete. Data saved to ${outputCsvPath}`);
        // Make a backup copy for the web app
        fs.copyFileSync(outputCsvPath, path.join(__dirname, '..', 'studies.csv'));
        console.log('Backup copy created in data directory');
      });
    
    return true;
  } catch (error) {
    console.error('Error generating CSV:', error);
    return false;
  }
}

/**
 * Run the entire data pipeline
 */
function runPipeline() {
  console.log('Starting data pipeline...');
  
  // Import other scripts
  const { extractStudies } = require('./extract');
  const { transformStudies } = require('./transform');
  
  // Run the pipeline steps
  const extracted = extractStudies();
  if (extracted.length > 0) {
    const transformed = transformStudies();
    if (transformed.length > 0) {
      generateCSV();
    }
  }
  
  console.log('Pipeline complete!');
}

// Run the CSV generation if this script is executed directly
if (require.main === module) {
  // Check if full pipeline is requested
  if (process.argv.includes('--pipeline')) {
    runPipeline();
  } else {
    generateCSV();
  }
}

module.exports = { generateCSV, runPipeline }; 