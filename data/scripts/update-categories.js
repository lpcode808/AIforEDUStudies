/**
 * Script to update study categories to match the new research domains
 */

const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const { createObjectCsvWriter } = require('csv-writer');

// Path to input and output files
const inputCsvPath = path.join(__dirname, '..', 'studies.csv');
const outputCsvPath = path.join(__dirname, '..', 'processed', 'studies.csv');

// New categories based on the screenshot
const NEW_CATEGORIES = [
  'Current AI Use and Perceptions in PK 12 & HigherEd',
  'Workforce Trends',
  'Student Performance Data',
  'Current State of Guidelines, Training, and Policies'
];

// Map old categories to new ones
const CATEGORY_MAPPING = {
  // Map to 'Current AI Use and Perceptions in PK 12 & HigherEd'
  'Teaching Tools': 'Current AI Use and Perceptions in PK 12 & HigherEd',
  'Educational Tools': 'Current AI Use and Perceptions in PK 12 & HigherEd',
  'Teaching Methods': 'Current AI Use and Perceptions in PK 12 & HigherEd',
  'Pedagogical Approaches': 'Current AI Use and Perceptions in PK 12 & HigherEd',
  'Current AI Use': 'Current AI Use and Perceptions in PK 12 & HigherEd',
  'Higher Education': 'Current AI Use and Perceptions in PK 12 & HigherEd',
  'K-12 Education': 'Current AI Use and Perceptions in PK 12 & HigherEd',
  
  // Map to 'Workforce Trends'
  'Workforce': 'Workforce Trends',
  'Career Readiness': 'Workforce Trends',
  'Future Skills': 'Workforce Trends',
  'Job Market': 'Workforce Trends',
  
  // Map to 'Student Performance Data'
  'Student Performance': 'Student Performance Data',
  'AI Assessment': 'Student Performance Data',
  'Assessment': 'Student Performance Data',
  'Student Engagement': 'Student Performance Data',
  'Learning Outcomes': 'Student Performance Data',
  'Personalized Learning': 'Student Performance Data',
  'Writing Skills': 'Student Performance Data',
  'Language Learning': 'Student Performance Data',
  
  // Map to 'Current State of Guidelines, Training, and Policies'
  'AI Ethics': 'Current State of Guidelines, Training, and Policies',
  'Implementation Barriers': 'Current State of Guidelines, Training, and Policies',
  'Equity Concerns': 'Current State of Guidelines, Training, and Policies',
  'Policy': 'Current State of Guidelines, Training, and Policies',
  'Guidelines': 'Current State of Guidelines, Training, and Policies',
  'Research': 'Current State of Guidelines, Training, and Policies'
};

// Function to map an old category to a new one
function mapCategory(oldCategory) {
  return CATEGORY_MAPPING[oldCategory] || 'Current AI Use and Perceptions in PK 12 & HigherEd';
}

// Process the CSV file
async function updateCategories() {
  console.log('Starting category update...');
  
  const studies = [];
  
  // Read and parse the CSV file
  fs.createReadStream(inputCsvPath)
    .pipe(csv())
    .on('data', (row) => {
      // Split the categories
      const oldCategories = row.categories.split('|');
      
      // Map each old category to a new one
      let newCategories = oldCategories.map(mapCategory);
      
      // Remove duplicates
      newCategories = [...new Set(newCategories)];
      
      // Update the row with new categories
      const updatedRow = {
        ...row,
        categories: newCategories.join('|')
      };
      
      studies.push(updatedRow);
    })
    .on('end', () => {
      console.log(`Read ${studies.length} studies from CSV`);
      
      // Prepare the CSV writer
      const csvWriter = createObjectCsvWriter({
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
      
      // Write the updated studies to a new CSV file
      csvWriter.writeRecords(studies)
        .then(() => {
          console.log(`Updated categories for ${studies.length} studies`);
          console.log(`Data saved to ${outputCsvPath}`);
          
          // Also update the main studies.csv file
          fs.copyFileSync(outputCsvPath, inputCsvPath);
          console.log(`Also updated the main studies.csv file`);
        });
    });
}

// Run the update
updateCategories(); 