/**
 * Utility functions for the GenAI Studies Explorer
 */

console.log('=== UTILS.JS LOADING ===', new Date().toISOString());

import AppState from './state.js';

console.log('=== UTILS.JS IMPORTED APPSTATE ===', {
  exists: !!AppState,
  type: typeof AppState,
  hasStudies: AppState && 'studies' in AppState,
  studiesType: AppState && typeof AppState.studies
});

/**
 * Get unique categories from studies
 * @returns {Array} Array of unique categories
 */
function getUniqueCategories() {
  console.log('=== GETUNIQUECAT CALLED ===', {
    appStateExists: !!AppState,
    studiesExists: AppState && 'studies' in AppState,
    studiesValue: AppState && AppState.studies,
    studiesType: AppState && typeof AppState.studies,
    studiesIsArray: AppState && Array.isArray(AppState.studies),
    studiesLength: AppState && AppState.studies && Array.isArray(AppState.studies) ? AppState.studies.length : -1
  });
  
  // Create a set to store unique categories
  const categories = new Set();
  
  try {
    // Safely check if AppState and studies exist
    if (!AppState) {
      console.error('AppState is undefined in getUniqueCategories');
      return [];
    }
    
    console.log('AppState in getUniqueCategories:', AppState);
    
    if (!AppState.studies) {
      console.warn('AppState.studies not initialized in getUniqueCategories');
      return [];
    }
    
    // Make sure we have an array to work with
    const studies = Array.isArray(AppState.studies) ? AppState.studies : [];
    console.log(`Processing ${studies.length} studies for categories`);
    
    // Process each study
    studies.forEach((study, index) => {
      console.log(`Processing study ${index}:`, {
        exists: !!study,
        hasCategories: study && 'categories' in study,
        categoriesType: study && typeof study.categories,
        categoriesIsArray: study && Array.isArray(study.categories),
        categoriesValue: study && study.categories
      });
      
      if (!study) return; // Skip null/undefined studies
      
      try {
        let cats = study.categories;
        
        // Handle different formats of categories
        if (Array.isArray(cats)) {
          // If it's already an array, add each category
          console.log(`Study ${index} has category array of length ${cats.length}`);
          cats.forEach(cat => {
            if (cat && typeof cat === 'string') {
              categories.add(cat.trim());
            }
          });
        } else if (typeof cats === 'string') {
          // If it's a string, split by pipe if needed
          console.log(`Study ${index} has category string: ${cats}`);
          if (cats.includes('|')) {
            cats.split('|').forEach(cat => {
              if (cat) categories.add(cat.trim());
            });
          } else {
            // Or add as a single category
            categories.add(cats.trim());
          }
        } else {
          console.warn(`Study ${index} has unexpected categories type:`, typeof cats);
        }
        // Ignore other types
      } catch (err) {
        console.warn(`Error processing categories for study ${index}:`, err);
      }
    });
    
    console.log(`Found ${categories.size} unique categories`);
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
      console.warn('AppState or studies not initialized in getUniqueSubjects');
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
        console.warn('Error processing subjects for a study:', err);
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

console.log('=== UTILS.JS LOADED ===');

export {
  getUniqueCategories,
  getUniqueSubjects,
  debounce,
  safeJSONParse
}; 