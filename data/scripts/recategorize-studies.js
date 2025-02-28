/**
 * Script to recategorize studies based on title, keywords, and content
 * This will correctly assign studies to the four main research domains
 */

const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const { createObjectCsvWriter } = require('csv-writer');

// Path to input and output files
const inputCsvPath = path.join(__dirname, '..', 'processed', 'studies.csv');
const outputCsvPath = path.join(__dirname, '..', 'processed', 'recategorized-studies.csv');

// The four main research domains
const RESEARCH_DOMAINS = [
  'Current AI Use and Perceptions in PK 12 & HigherEd',
  'Workforce Trends',
  'Student Performance Data',
  'Current State of Guidelines, Training, and Policies'
];

// Keywords that indicate the appropriate category
const CATEGORY_KEYWORDS = {
  'Current AI Use and Perceptions in PK 12 & HigherEd': [
    'classroom', 'teacher', 'professor', 'faculty', 'implementation', 'higher education',
    'university', 'college', 'k-12', 'elementary', 'secondary', 'survey', 'opinion',
    'adoption', 'usage', 'perception', 'integration', 'chatbot'
  ],
  'Workforce Trends': [
    'workforce', 'job', 'career', 'employment', 'skill', 'labor', 'market',
    'industry', 'profession', 'hiring', 'future work', 'future of work', 'automation', 'economy',
    'occupation', 'workplace', 'employer', 'employee', 'employability', 'proficiency'
  ],
  'Student Performance Data': [
    'performance', 'achievement', 'assessment', 'outcome', 'score', 'grade', 
    'evaluation', 'testing', 'learning', 'academic', 'progress', 'success',
    'improvement', 'measurement', 'data', 'analytics', 'metrics', 'results',
    'report card', 'PISA', 'cheating'
  ],
  'Current State of Guidelines, Training, and Policies': [
    'policy', 'guideline', 'regulation', 'framework', 'standard', 'training',
    'professional development', 'rule', 'recommendation', 'governance', 'ethics',
    'legal', 'compliance', 'instruction', 'best practice', 'procedure', 'protocol',
    'safety', 'expectations', 'AI act', 'toolkit', 'safe', 'ethical', 'equitable'
  ]
};

// Process the CSV file
async function recategorizeStudies() {
  console.log('Starting recategorization...');
  
  const studies = [];
  
  // Read and parse the CSV file
  fs.createReadStream(inputCsvPath)
    .pipe(csv())
    .on('data', (row) => {
      studies.push(row);
    })
    .on('end', () => {
      console.log(`Read ${studies.length} studies from CSV`);
      
      // Recategorize each study
      studies.forEach(study => {
        // Get the text to analyze (title + findings)
        const textToAnalyze = `${study.title} ${study.key_findings}`.toLowerCase();
        
        // Find the best matching category
        const scores = RESEARCH_DOMAINS.map(domain => {
          let score = 0;
          const keywords = CATEGORY_KEYWORDS[domain];
          
          // Check for keywords
          keywords.forEach(keyword => {
            if (textToAnalyze.includes(keyword.toLowerCase())) {
              score++;
            }
          });
          
          // Extra points if the title is or contains the domain name
          if (study.title === domain || study.title.includes(domain)) {
            score += 5;
          }
          
          return { domain, score };
        });
        
        // Sort by score (highest first)
        scores.sort((a, b) => b.score - a.score);
        
        // Apply the highest scoring category
        // But keep the original if there's no good match (score of 0)
        if (scores[0].score > 0) {
          study.categories = scores[0].domain;
          console.log(`Recategorized: "${study.title.substring(0, 40)}..." to "${scores[0].domain}"`);
        }
      });
      
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
          console.log(`Recategorization complete. Updated ${studies.length} studies.`);
          console.log(`Data saved to ${outputCsvPath}`);
          
          // Also update the main studies.csv file
          fs.copyFileSync(outputCsvPath, inputCsvPath);
          console.log(`Also updated the main studies.csv file`);
        });
    });
}

// Run the recategorization
recategorizeStudies(); 