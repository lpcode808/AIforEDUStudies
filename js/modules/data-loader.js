/**
 * Data Loading Module for GenAI Studies Explorer
 * Handles fetching and initial normalization of data
 * Version 3.0 with enhanced error handling
 */

// URL of the data file
const DATA_URL = './data/studies.csv';

/**
 * Load studies data from the CSV file
 * @returns {Promise<Array>} Promise resolving to an array of study objects
 */
export async function loadStudiesData() {
  try {
    console.log('DATALOADER: Loading studies data from', DATA_URL);
    
    // Fetch the data
    const response = await fetch(DATA_URL);
    
    // Check if the request was successful
    if (!response.ok) {
      throw new Error(`Failed to load data: ${response.status} ${response.statusText}`);
    }
    
    // Get the CSV text
    const csvText = await response.text();
    
    // Parse the CSV data
    const data = parseCSV(csvText);
    
    // Ensure data is properly structured
    if (!data || !Array.isArray(data)) {
      console.error('DATALOADER: Invalid data format received');
      return [];
    }
    
    console.log(`DATALOADER: Successfully loaded ${data.length} studies`);
    
    // Perform preliminary data validation and cleanup
    const validatedData = performInitialValidation(data);
    
    return validatedData;
  } catch (error) {
    console.error('DATALOADER: Error loading studies data:', error);
    throw error; // Re-throw to allow retry logic in the bootstrap module
  }
}

/**
 * Perform initial validation and cleanup of the data
 * @param {Array} data - Raw data from the CSV file
 * @returns {Array} Validated and cleaned data
 */
function performInitialValidation(data) {
  try {
    console.log('DATALOADER: Performing initial data validation');
    
    if (!Array.isArray(data)) {
      console.error('DATALOADER: Data is not an array');
      return [];
    }
    
    // Filter out null/undefined/non-object entries
    const filtered = data.filter(item => {
      if (!item || typeof item !== 'object') {
        console.warn('DATALOADER: Filtering out invalid study item');
        return false;
      }
      return true;
    });
    
    console.log(`DATALOADER: ${filtered.length} valid studies after initial validation`);
    return filtered;
  } catch (error) {
    console.error('DATALOADER: Error during initial data validation:', error);
    return [];
  }
}

/**
 * Normalize study objects to ensure consistent structure
 * @param {Array} studies - Array of parsed study objects
 * @returns {Array} - Array of normalized study objects
 */
function normalizeStudies(studies) {
  if (!studies || !Array.isArray(studies)) {
    console.warn('normalizeStudies received invalid data:', studies);
    return [];
  }
  
  console.log(`Normalizing ${studies.length} studies`);
  
  return studies.map((study, index) => {
    // Skip null/undefined studies
    if (!study) {
      console.warn(`Study at index ${index} is null or undefined`);
      return null;
    }
    
    // Create a new object with guaranteed properties
    const normalizedStudy = {
      id: study.id || `study-${index}`,
      title: study.title || 'Untitled Study',
      url: study.url || '#',
      organization: study.organization || 'Unknown Organization',
      date: study.date || '',
      description: study.description || study.key_findings || '',
      categories: [],
      metadata: { subjects: [] }
    };
    
    // Process categories with careful error handling
    try {
      if (study.categories) {
        // Handle different formats of categories
        if (Array.isArray(study.categories)) {
          // Filter out any non-string or empty values
          normalizedStudy.categories = study.categories
            .filter(cat => cat && typeof cat === 'string')
            .map(cat => cat.trim());
        } else if (typeof study.categories === 'string') {
          // Split by pipe if needed
          if (study.categories.includes('|')) {
            normalizedStudy.categories = study.categories
              .split('|')
              .map(cat => cat.trim())
              .filter(cat => cat);
          } else if (study.categories.trim()) {
            normalizedStudy.categories = [study.categories.trim()];
          }
        }
      }
      
      // Ensure at least one category exists
      if (normalizedStudy.categories.length === 0) {
        normalizedStudy.categories = ['Uncategorized'];
        console.log(`Added default category for study ${index}`);
      }
    } catch (error) {
      console.error(`Error processing categories for study ${index}:`, error);
      normalizedStudy.categories = ['Uncategorized'];
    }
    
    // Process metadata
    try {
      if (study.metadata) {
        if (typeof study.metadata === 'object') {
          normalizedStudy.metadata = { ...study.metadata };
        } else if (typeof study.metadata === 'string') {
          try {
            normalizedStudy.metadata = JSON.parse(study.metadata);
          } catch (e) {
            normalizedStudy.metadata = {};
          }
        }
      }
      
      // Ensure subjects array exists
      if (!normalizedStudy.metadata.subjects) {
        normalizedStudy.metadata.subjects = [];
      } else if (!Array.isArray(normalizedStudy.metadata.subjects)) {
        normalizedStudy.metadata.subjects = [String(normalizedStudy.metadata.subjects)];
      }
    } catch (error) {
      console.error(`Error processing metadata for study ${index}:`, error);
      normalizedStudy.metadata = { subjects: [] };
    }
    
    return normalizedStudy;
  }).filter(study => study !== null); // Remove any null studies
}

/**
 * Parse CSV text into array of objects
 * @param {string} text - CSV text
 * @returns {Array} Array of objects
 */
function parseCSV(text) {
  const lines = text.split('\n');
  if (lines.length < 2) {
    console.error('CSV has fewer than 2 lines, cannot parse headers and data');
    return [];
  }
  
  console.log(`CSV has ${lines.length} lines`);
  
  // Extract headers - skip the first empty column
  const headers = lines[0].split(',').map(h => h.trim()).filter((h, i) => i > 0 || h.length > 0);
  console.log('CSV Headers:', headers);
  
  // Process data lines
  const results = lines.slice(1)
    .filter(line => line.trim())
    .map((line, index) => {
      try {
        // Handle commas within quoted fields
        const fields = [];
        let currentField = '';
        let inQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
          const char = line[i];
          
          if (char === '"') {
            inQuotes = !inQuotes;
          } else if (char === ',' && !inQuotes) {
            fields.push(currentField);
            currentField = '';
          } else {
            currentField += char;
          }
        }
        
        // Push the last field
        fields.push(currentField);
        
        // Skip the first field if it's the marker column
        const dataFields = fields.slice(1);
        
        // Create object from fields and headers
        const obj = {};
        
        headers.forEach((header, i) => {
          // Skip if we don't have this field
          if (i >= dataFields.length) return;
          
          let value = dataFields[i].trim();
          
          // Remove surrounding quotes if present
          if (value.startsWith('"') && value.endsWith('"')) {
            value = value.substring(1, value.length - 1);
          }
          
          obj[header] = value;
        });
        
        return obj;
      } catch (error) {
        console.error(`Error parsing line ${index + 1}: ${line}`, error);
        return null;
      }
    })
    .filter(item => item !== null);
  
  console.log(`Successfully parsed ${results.length} items from CSV`);
  return results;
} 