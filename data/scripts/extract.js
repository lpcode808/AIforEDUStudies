/**
 * Data extraction script for GenAI Studies
 * Extracts study data from HTML source
 */

const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

// Path to the HTML file and output
const htmlFilePath = path.join(__dirname, '..', 'raw', 'studies-source.html');
const outputJsonPath = path.join(__dirname, '..', 'raw', 'extracted-studies.json');

/**
 * Extract studies from the HTML source
 */
function extractStudies() {
  console.log('Starting data extraction...');
  
  // Read the HTML file
  try {
    const html = fs.readFileSync(htmlFilePath, 'utf8');
    const dom = new JSDOM(html);
    const document = dom.window.document;
    
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
          // Check if the paragraph is near the title element
          if (isNearby(titleEl, para)) {
            findings += para.textContent.trim() + ' ';
          }
        }
        
        // Create study object
        const study = {
          id: idCounter++,
          title,
          url,
          key_findings: findings.trim(),
          organization: extractOrganization(title, findings),
          date: extractDate(title, findings),
          categories: extractCategories(title, findings),
          metadata: {
            subjects: extractSubjects(title, findings)
          }
        };
        
        studies.push(study);
      });
    });
    
    // Write the extracted data to a JSON file
    fs.writeFileSync(outputJsonPath, JSON.stringify(studies, null, 2));
    
    console.log(`Extraction complete. Found ${studies.length} studies.`);
    console.log(`Data saved to ${outputJsonPath}`);
    
    return studies;
  } catch (error) {
    console.error('Error during extraction:', error);
    return [];
  }
}

/**
 * Check if two elements are nearby in the DOM
 */
function isNearby(element1, element2) {
  // Check if one element is a parent/child of the other
  if (element1.contains(element2) || element2.contains(element1)) {
    return true;
  }
  
  // Check if they share a parent
  if (element1.parentNode === element2.parentNode) {
    return true;
  }
  
  // Check if they are siblings or close in the DOM tree
  let sibling = element1.nextElementSibling;
  while (sibling) {
    if (sibling === element2 || sibling.contains(element2)) {
      return true;
    }
    sibling = sibling.nextElementSibling;
  }
  
  return false;
}

/**
 * Extract organization from text
 */
function extractOrganization(title, text) {
  // List of common educational organizations
  const orgs = [
    'University', 'College', 'School', 'Institute', 'Academy',
    'Stanford', 'Harvard', 'MIT', 'Princeton', 'Yale',
    'Oxford', 'Cambridge', 'Berkeley', 'UCLA', 'UCSD',
    'Carnegie Mellon', 'Georgia Tech', 'Caltech'
  ];
  
  // Try to find organization mentions
  const combinedText = `${title} ${text}`;
  
  for (const org of orgs) {
    const regex = new RegExp(`(\\w+\\s+)?${org}(\\s+\\w+)?`, 'i');
    const match = combinedText.match(regex);
    if (match) {
      return match[0].trim();
    }
  }
  
  return 'Unknown Organization';
}

/**
 * Extract date from text
 */
function extractDate(title, text) {
  // Look for dates in format YYYY or MM/YYYY or MM-YYYY
  const combinedText = `${title} ${text}`;
  
  // Try to find year (2020-2023)
  const yearMatch = combinedText.match(/\b(202[0-3])\b/);
  if (yearMatch) {
    return `${yearMatch[1]}-01`;
  }
  
  // Default to a placeholder date
  return '2023-01';
}

/**
 * Extract categories from text
 */
function extractCategories(title, text) {
  const categories = [];
  const combinedText = `${title} ${text}`.toLowerCase();
  
  // Define possible categories and their keywords based on the screenshot
  const categoryKeywords = {
    'Current AI Use and Perceptions in PK 12 & HigherEd': [
      'perception', 'usage', 'adoption', 'integration', 'classroom', 'higher education', 
      'university', 'college', 'k-12', 'elementary', 'secondary', 'survey', 'opinion',
      'teacher', 'professor', 'faculty', 'implementation', 'tool', 'application'
    ],
    'Workforce Trends': [
      'workforce', 'job', 'career', 'employment', 'skill', 'labor', 'market',
      'industry', 'profession', 'hiring', 'future work', 'automation', 'economy',
      'occupation', 'workplace', 'employer', 'employee'
    ],
    'Student Performance Data': [
      'performance', 'achievement', 'assessment', 'outcome', 'score', 'grade', 
      'evaluation', 'testing', 'learning', 'academic', 'progress', 'success',
      'improvement', 'measurement', 'data', 'analytics', 'metrics', 'results'
    ],
    'Current State of Guidelines, Training, and Policies': [
      'policy', 'guideline', 'regulation', 'framework', 'standard', 'training',
      'professional development', 'rule', 'recommendation', 'governance', 'ethics',
      'legal', 'compliance', 'instruction', 'best practice', 'procedure', 'protocol'
    ]
  };
  
  // Check for keywords in the text
  for (const [category, keywords] of Object.entries(categoryKeywords)) {
    for (const keyword of keywords) {
      if (combinedText.includes(keyword)) {
        categories.push(category);
        break;
      }
    }
  }
  
  // If no categories found, add a default
  if (categories.length === 0) {
    categories.push('Current AI Use and Perceptions in PK 12 & HigherEd');
  }
  
  return categories;
}

/**
 * Extract subjects from text
 */
function extractSubjects(title, text) {
  const subjects = [];
  const combinedText = `${title} ${text}`.toLowerCase();
  
  // Define possible subjects and their keywords
  const subjectKeywords = {
    'Mathematics': ['math', 'mathematics', 'calculus', 'algebra'],
    'Computer Science': ['computer science', 'programming', 'coding', 'algorithm'],
    'English': ['english', 'literature', 'writing', 'reading'],
    'Science': ['science', 'biology', 'chemistry', 'physics'],
    'Social Studies': ['social studies', 'history', 'geography', 'civics'],
    'Foreign Languages': ['language', 'spanish', 'french', 'german', 'chinese'],
    'Arts': ['art', 'music', 'drama', 'painting'],
    'Engineering': ['engineering', 'design', 'mechanical', 'electrical'],
    'Medicine': ['medicine', 'medical', 'health', 'nursing'],
    'Business': ['business', 'finance', 'marketing', 'economics']
  };
  
  // Check for keywords in the text
  for (const [subject, keywords] of Object.entries(subjectKeywords)) {
    for (const keyword of keywords) {
      if (combinedText.includes(keyword)) {
        subjects.push(subject);
        break;
      }
    }
  }
  
  // If no subjects found, add a default
  if (subjects.length === 0) {
    subjects.push('General Education');
  }
  
  return subjects;
}

// Run the extraction if this script is executed directly
if (require.main === module) {
  extractStudies();
}

module.exports = { extractStudies }; 