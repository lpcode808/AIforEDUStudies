/**
 * Data transformation script for GenAI Studies
 * Cleans and enhances extracted study data
 */

const fs = require('fs');
const path = require('path');

// Path to input and output files
const inputJsonPath = path.join(__dirname, '..', 'raw', 'extracted-studies.json');
const outputJsonPath = path.join(__dirname, '..', 'processed', 'transformed-studies.json');

/**
 * Transform the extracted studies data
 */
function transformStudies() {
  console.log('Starting data transformation...');
  
  try {
    // Read the extracted JSON data
    const rawData = fs.readFileSync(inputJsonPath, 'utf8');
    const studies = JSON.parse(rawData);
    
    console.log(`Loaded ${studies.length} studies for transformation`);
    
    // Transform each study
    const transformedStudies = studies.map(study => {
      return {
        id: study.id,
        title: cleanText(study.title),
        url: cleanUrl(study.url),
        key_findings: truncateAndClean(study.key_findings, 300),
        organization: study.organization,
        date: normalizeDate(study.date),
        categories: deduplicateArray(study.categories),
        metadata: {
          subjects: deduplicateArray(study.metadata.subjects)
        }
      };
    });
    
    // Filter out low-quality studies
    const filteredStudies = transformedStudies.filter(study => {
      const hasTitle = study.title && study.title.length > 5;
      const hasFindings = study.key_findings && study.key_findings.length > 10;
      return hasTitle && hasFindings;
    });
    
    // Write the transformed data to a JSON file
    fs.writeFileSync(outputJsonPath, JSON.stringify(filteredStudies, null, 2));
    
    console.log(`Transformation complete. Processed ${filteredStudies.length} studies.`);
    console.log(`Data saved to ${outputJsonPath}`);
    
    return filteredStudies;
  } catch (error) {
    console.error('Error during transformation:', error);
    return [];
  }
}

/**
 * Clean text by removing extra spaces and special characters
 */
function cleanText(text) {
  if (!text) return '';
  
  return text
    .trim()
    .replace(/\s+/g, ' ')                // Replace multiple spaces with a single space
    .replace(/[\r\n]+/g, ' ')           // Replace newlines with spaces
    .replace(/[^\w\s.,?!;:()[\]{}'"%-]/g, ''); // Remove special characters except common punctuation
}

/**
 * Clean and validate URLs
 */
function cleanUrl(url) {
  if (!url) return '';
  
  // Remove any whitespace
  url = url.trim();
  
  // Check if it's a valid URL
  try {
    new URL(url);
    return url;
  } catch (e) {
    // If not a valid URL, check if it's a relative path or other format
    if (url.startsWith('/') || url.startsWith('./') || url.startsWith('../')) {
      return url;
    }
    
    // If it contains a domain-like structure, try to fix it
    if (url.includes('.') && !url.startsWith('http')) {
      return 'https://' + url;
    }
    
    return '';
  }
}

/**
 * Truncate and clean text
 */
function truncateAndClean(text, maxLength) {
  if (!text) return '';
  
  const cleaned = cleanText(text);
  
  if (cleaned.length <= maxLength) {
    return cleaned;
  }
  
  // Truncate at the last complete sentence within the limit
  const truncated = cleaned.substring(0, maxLength);
  const lastSentenceEnd = Math.max(
    truncated.lastIndexOf('.'),
    truncated.lastIndexOf('!'),
    truncated.lastIndexOf('?')
  );
  
  if (lastSentenceEnd > maxLength * 0.7) {
    return cleaned.substring(0, lastSentenceEnd + 1);
  }
  
  return truncated + '...';
}

/**
 * Normalize date format to YYYY-MM
 */
function normalizeDate(dateStr) {
  if (!dateStr) return '2023-01';
  
  // Check if it's already in YYYY-MM format
  if (/^\d{4}-\d{2}$/.test(dateStr)) {
    return dateStr;
  }
  
  // Try to parse different formats
  const dashFormat = dateStr.match(/(\d{4})-(\d{1,2})/);
  if (dashFormat) {
    const year = dashFormat[1];
    const month = dashFormat[2].padStart(2, '0');
    return `${year}-${month}`;
  }
  
  const slashFormat = dateStr.match(/(\d{1,2})\/(\d{4})/);
  if (slashFormat) {
    const month = slashFormat[1].padStart(2, '0');
    const year = slashFormat[2];
    return `${year}-${month}`;
  }
  
  // If only year is available
  const yearFormat = dateStr.match(/(\d{4})/);
  if (yearFormat) {
    return `${yearFormat[1]}-01`;
  }
  
  // Default
  return '2023-01';
}

/**
 * Remove duplicates from an array
 */
function deduplicateArray(arr) {
  if (!Array.isArray(arr)) {
    return [];
  }
  return [...new Set(arr)];
}

// Run the transformation if this script is executed directly
if (require.main === module) {
  transformStudies();
}

module.exports = { transformStudies }; 