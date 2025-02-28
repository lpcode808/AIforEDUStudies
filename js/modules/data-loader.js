/**
 * Data Loading Module for GenAI Studies Explorer
 * Handles fetching and initial normalization of data
 * Version 3.0 with enhanced error handling
 */

// URL of the data file
const DATA_URL = './data/studies.csv';

/**
 * Load studies data from the CSV file
 * @returns {Promise<Array>} Promise resolving to array of study objects
 */
export async function loadStudiesData() {
  try {
    console.log('DataLoader: Beginning to load studies data');
    // Store the fetch start time for performance metrics
    const fetchStart = performance.now();
    
    // Load studies from CSV
    const response = await fetch('data/studies.csv');
    
    if (!response.ok) {
      console.error(`DataLoader: Failed to fetch studies.csv: ${response.status} ${response.statusText}`);
      throw new Error(`Failed to fetch studies data: ${response.status} ${response.statusText}`);
    }
    
    const fetchEnd = performance.now();
    console.log(`DataLoader: Fetched studies.csv in ${(fetchEnd - fetchStart).toFixed(2)}ms`);
    
    // Get text content
    const csvText = await response.text();
    console.log(`DataLoader: Received CSV data of length: ${csvText.length} characters`);
    console.log(`DataLoader: CSV preview: ${csvText.substring(0, 100)}...`);
    
    // Parse CSV
    const parseStart = performance.now();
    const items = await parseCSV(csvText);
    const parseEnd = performance.now();
    
    console.log(`DataLoader: Parsed ${items.length} items from CSV in ${(parseEnd - parseStart).toFixed(2)}ms`);
    console.log(`DataLoader: First item sample:`, items.length > 0 ? items[0] : 'No items found');
    
    // Convert to normalized studies
    const normalizeStart = performance.now();
    const studies = normalizeStudies(items);
    const normalizeEnd = performance.now();
    
    console.log(`DataLoader: Normalized ${studies.length} studies in ${(normalizeEnd - normalizeStart).toFixed(2)}ms`);
    console.log(`DataLoader: First study sample:`, studies.length > 0 ? studies[0] : 'No studies found');
    
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
    
    console.log(`DataLoader: CSV has ${lines.length} lines`);
    
    // Extract headers from the first line
    const headerLine = lines[0];
    const headers = headerLine.split(',').map(h => h.trim());
    console.log('DataLoader: CSV Headers:', headers);
    console.log('DataLoader: First header line:', headerLine);
    
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
          console.log('DataLoader: First data row parsed:', obj);
        }
        
        results.push(obj);
        successCount++;
      } catch (lineError) {
        console.error(`DataLoader: Error parsing line ${i}:`, lineError);
        errorCount++;
      }
    }
    
    console.log(`DataLoader: Successfully parsed ${successCount} items from CSV (${errorCount} errors)`);
    
    // Log sample of parsed data
    if (results.length > 0) {
      console.log('DataLoader: First item parsed:', results[0]);
      console.log('DataLoader: First item categories:', results[0].categories);
    }
    
    return results;
  } catch (error) {
    console.error('DataLoader: Fatal error parsing CSV:', error);
    return [];
  }
}

// Export additional functions needed by other modules
export { normalizeStudies, parseCSV }; 