/**
 * Utility functions for the GenAI Studies Explorer
 */

import AppState from './state.js';

/**
 * Get unique categories from studies
 * @returns {Array} Array of unique categories
 */
function getUniqueCategories() {

  // Create a set to store unique categories
  const categories = new Set();
  
  try {
    // Safely check if AppState and studies exist
    if (!AppState) {
      console.error('AppState is undefined in getUniqueCategories');
      return [];
    }

    if (!AppState.studies) {
      
      return [];
    }
    
    // Make sure we have an array to work with
    const studies = Array.isArray(AppState.studies) ? AppState.studies : [];

    // Process each study
    studies.forEach((study, index) => {

      if (!study) return; // Skip null/undefined studies
      
      try {
        let cats = study.categories;
        
        // Handle different formats of categories
        if (Array.isArray(cats)) {
          // If it's already an array, add each category
          
          cats.forEach(cat => {
            if (cat && typeof cat === 'string') {
              categories.add(cat.trim());
            }
          });
        } else if (typeof cats === 'string') {
          // If it's a string, split by pipe if needed
          
          if (cats.includes('|')) {
            cats.split('|').forEach(cat => {
              if (cat) categories.add(cat.trim());
            });
          } else {
            // Or add as a single category
            categories.add(cats.trim());
          }
        } else {
          
        }
        // Ignore other types
      } catch (err) {
        
      }
    });

    return Array.from(categories).sort();
  } catch (error) {
    console.error('Error in getUniqueCategories:', error);
    return []; // Return empty array on error
  }
}

/**
 * Get unique subject values from studies
 * @returns {Array} Array of unique subjects
 */
function getUniqueSubjects() {
  const subjects = new Set();
  
  try {
    // Safely check if AppState and studies exist
    if (!AppState || !AppState.studies) {
      
      return [];
    }
    
    // Make sure we have an array to work with
    const studies = Array.isArray(AppState.studies) ? AppState.studies : [];
    
    // Process each study
    studies.forEach(study => {
      if (!study) return; // Skip null/undefined studies
      
      try {
        if (study.metadata && study.metadata.subject) {
          let subj = study.metadata.subject;
          
          if (Array.isArray(subj)) {
            subj.forEach(s => {
              if (s && typeof s === 'string') {
                subjects.add(s.trim());
              }
            });
          } else if (typeof subj === 'string') {
            subjects.add(subj.trim());
          }
        }
      } catch (err) {
        
      }
    });
    
    return Array.from(subjects).sort();
  } catch (error) {
    console.error('Error in getUniqueSubjects:', error);
    return []; // Return empty array on error
  }
}

/**
 * Debounce function to limit how often a function can be called
 * @param {Function} func - The function to debounce
 * @param {number} wait - Time to wait in milliseconds
 * @returns {Function} Debounced function
 */
function debounce(func, wait = 300) {
  let timeout;
  
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Safely parse JSON with fallback
 * @param {string} jsonString - JSON string to parse
 * @param {*} fallback - Fallback value if parsing fails
 * @returns {*} Parsed object or fallback
 */
function safeJSONParse(jsonString, fallback = {}) {
  try {
    return JSON.parse(jsonString);
  } catch (error) {
    console.error('Error parsing JSON:', error);
    return fallback;
  }
}

export {
  getUniqueCategories,
  getUniqueSubjects,
  debounce,
  safeJSONParse
}; 