/**
 * Bootstrap module for the GenAI Studies Explorer
 * Handles loading, normalizing, and validation of data with retries and robust error handling
 */

import { loadStudiesData } from './data-loader.js';

// Constants for bootstrap operations
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // ms

/**
 * Bootstraps the entire application by loading and normalizing data
 * Implements retry logic and guarantees a safe data structure
 * @returns {Promise<Array>} Promise resolving to a safe, normalized array of studies
 */
export async function bootstrapApplication() {
  console.log('BOOTSTRAP: Starting application bootstrap process');
  let retries = 0;
  let studies = null;
  
  // Try to load studies with retries
  while (retries < MAX_RETRIES) {
    try {
      console.log(`BOOTSTRAP: Loading studies data (attempt ${retries + 1}/${MAX_RETRIES})`);
      studies = await loadStudiesData();
      
      if (studies && Array.isArray(studies) && studies.length > 0) {
        console.log(`BOOTSTRAP: Successfully loaded ${studies.length} studies`);
        break;
      } else {
        console.warn('BOOTSTRAP: Loaded studies data is invalid or empty');
        // Clear studies to ensure retry
        studies = null;
      }
    } catch (error) {
      console.error(`BOOTSTRAP: Error loading studies data (attempt ${retries + 1}/${MAX_RETRIES}):`, error);
    }
    
    retries++;
    if (retries < MAX_RETRIES) {
      console.log(`BOOTSTRAP: Retrying in ${RETRY_DELAY}ms...`);
      await delay(RETRY_DELAY);
    }
  }
  
  // If we couldn't load studies after all retries, return an empty array
  if (!studies || !Array.isArray(studies)) {
    console.error('BOOTSTRAP: Failed to load studies data after all retries');
    return [];
  }
  
  // Normalize and validate studies data
  console.log('BOOTSTRAP: Normalizing and validating studies data');
  const normalizedStudies = normalizeStudiesData(studies);
  console.log(`BOOTSTRAP: Normalized ${normalizedStudies.length} studies`);
  
  return normalizedStudies;
}

/**
 * Normalizes studies data to ensure a consistent structure
 * @param {Array} studies - Raw studies data
 * @returns {Array} Normalized studies data with guaranteed structure
 */
function normalizeStudiesData(studies) {
  if (!studies || !Array.isArray(studies)) {
    console.error('NORMALIZE: Invalid studies data passed to normalizer');
    return [];
  }
  
  return studies
    .filter(study => study !== null && typeof study === 'object')
    .map(study => {
      // Deep copy using structured clone to avoid reference issues
      // For browsers that don't support structuredClone, fall back to less safe method
      let safeCopy;
      try {
        safeCopy = structuredClone(study);
      } catch (e) {
        // Fallback for older browsers
        safeCopy = JSON.parse(JSON.stringify(study));
      }
      
      // Create normalized structure with guaranteed properties
      const normalized = {
        id: typeof safeCopy.id === 'string' ? safeCopy.id : 
            (typeof safeCopy.id === 'number' ? String(safeCopy.id) : `generated-${Math.random().toString(36).substring(2, 9)}`),
        title: typeof safeCopy.title === 'string' ? safeCopy.title : 'Untitled Study',
        url: typeof safeCopy.url === 'string' ? safeCopy.url : '#',
        organization: typeof safeCopy.organization === 'string' ? safeCopy.organization : 'Unknown Organization',
        date: typeof safeCopy.date === 'string' ? safeCopy.date : '',
        description: typeof safeCopy.description === 'string' ? safeCopy.description : '',
        categories: [],
        metadata: {
          subjects: [],
          year: '',
          authors: [],
          ...((safeCopy.metadata && typeof safeCopy.metadata === 'object') ? safeCopy.metadata : {})
        }
      };
      
      // Handle categories carefully
      if (safeCopy.categories) {
        if (Array.isArray(safeCopy.categories)) {
          normalized.categories = safeCopy.categories
            .filter(cat => cat && typeof cat === 'string')
            .map(cat => cat.trim());
        } else if (typeof safeCopy.categories === 'string') {
          normalized.categories = [safeCopy.categories.trim()];
        }
      }
      
      // Ensure categories is never empty
      if (!normalized.categories.length) {
        normalized.categories = ['Uncategorized'];
      }
      
      // Handle subjects carefully
      if (normalized.metadata.subjects) {
        if (Array.isArray(normalized.metadata.subjects)) {
          normalized.metadata.subjects = normalized.metadata.subjects
            .filter(subject => subject && typeof subject === 'string')
            .map(subject => subject.trim());
        } else if (typeof normalized.metadata.subjects === 'string') {
          normalized.metadata.subjects = [normalized.metadata.subjects.trim()];
        } else {
          normalized.metadata.subjects = [];
        }
      }
      
      return normalized;
    });
}

/**
 * Simple delay function for retry logic
 * @param {number} ms - Milliseconds to delay
 * @returns {Promise} Promise that resolves after the specified delay
 */
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
} 