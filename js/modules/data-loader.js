/**
 * Data Loading Module for GenAI Studies Explorer
 * Handles fetching and initial normalization of data
 * Version 4.0 - QUICK WIN: Using pre-processed JSON instead of CSV
 */

// URL of the data file
const DATA_URL = './data/studies.json';

/**
 * Load studies data from the JSON file (pre-processed from CSV)
 * @returns {Promise<Array>} Promise resolving to array of study objects
 */
export async function loadStudiesData() {
  try {
    
    // Store the fetch start time for performance metrics
    const fetchStart = performance.now();

    // Load studies from JSON (much faster than CSV parsing)
    const response = await fetch('data/studies.json');

    if (!response.ok) {
      console.error(`DataLoader: Failed to fetch studies.json: ${response.status} ${response.statusText}`);
      throw new Error(`Failed to fetch studies data: ${response.status} ${response.statusText}`);
    }

    const fetchEnd = performance.now();

    // Parse JSON (native browser parsing - much faster than custom CSV parsing)
    const parseStart = performance.now();
    const items = await response.json();
    const parseEnd = performance.now();

    // Convert to normalized studies
    const normalizeStart = performance.now();
    const studies = normalizeStudies(items);
    const normalizeEnd = performance.now();

    // Return the studies
    return studies;
  } catch (error) {
    console.error('DataLoader: Error loading studies data:', error);
    throw new Error(`Failed to load studies data: ${error.message}`);
  }
}

/**
 * Perform initial validation and cleanup of the data
 * @param {Array} data - Raw data from the CSV file
 * @returns {Array} Validated and cleaned data
 */
function performInitialValidation(data) {
  try {

    if (!Array.isArray(data)) {
      console.error('DATALOADER: Data is not an array');
      return [];
    }
    
    // Filter out null/undefined/non-object entries
    const filtered = data.filter(item => {
      if (!item || typeof item !== 'object') {
        
        return false;
      }
      return true;
    });

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
    
    return [];
  }

  return studies.map((study, index) => {
    // Skip null/undefined studies
    if (!study) {
      
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
  try {
    if (!text || typeof text !== 'string') {
      console.error('CSV text is invalid:', text);
      return [];
    }
    
    const lines = text.split('\n');
    if (lines.length < 2) {
      console.error('CSV has fewer than 2 lines, cannot parse headers and data');
      return [];
    }

    // Extract headers from the first line
    const headerLine = lines[0];
    const headers = headerLine.split(',').map(h => h.trim());

    // Process data lines with more robust parsing
    const results = [];
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue; // Skip empty lines
      
      try {
        // Handle commas within quoted fields
        const values = [];
        let currentValue = '';
        let inQuotes = false;
        
        for (let j = 0; j < line.length; j++) {
          const char = line[j];
          
          if (char === '"') {
            // Toggle quote state - handles quotes within quoted fields
            inQuotes = !inQuotes;
            // Add the quote character to preserve it
            currentValue += char;
          } else if (char === ',' && !inQuotes) {
            // Only treat commas as separators when not in quotes
            values.push(currentValue);
            currentValue = '';
          } else {
            currentValue += char;
          }
        }
        
        // Don't forget the last value
        values.push(currentValue);
        
        // Create object from values and headers
        const obj = {};
        
        // Map each header to its corresponding value
        headers.forEach((header, index) => {
          if (index < values.length) {
            let value = values[index].trim();
            
            // Remove surrounding quotes if present
            if (value.startsWith('"') && value.endsWith('"')) {
              value = value.substring(1, value.length - 1);
            }
            
            obj[header] = value;
          }
        });
        
        // Log sample for debugging
        if (i === 1) {
          
        }
        
        results.push(obj);
        successCount++;
      } catch (lineError) {
        console.error(`DataLoader: Error parsing line ${i}:`, lineError);
        errorCount++;
      }
    }

    // Log sample of parsed data
    if (results.length > 0) {

    }
    
    return results;
  } catch (error) {
    console.error('DataLoader: Fatal error parsing CSV:', error);
    return [];
  }
}

// Export additional functions needed by other modules
export { normalizeStudies, parseCSV }; 