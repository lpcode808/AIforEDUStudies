/**
 * Search Engine Module for GenAI Studies Explorer - New Version
 * Provides powerful search capability using Fuse.js with enhanced error handling
 * Version 4.0 - Completely rebuilt to resolve export conflicts
 */

import AppState from './state.js';

// Fuse.js instance
let fuseInstance = null;
// Flag to track if the search engine is ready
let isSearchEngineReady = false;
// Promise to track Fuse.js loading
let fuseLoadingPromise = null;

/**
 * Initialize the search engine with studies data
 * @param {Array} studies - Array of study objects to index
 * @returns {Promise} - Promise that resolves when search engine is initialized
 */
function initializeSearchEngine(studies) {
  console.log('SEARCH: Initializing search engine');
  
  // If we already have a loading promise in progress, return it
  if (fuseLoadingPromise) {
    console.log('SEARCH: Search engine initialization already in progress');
    return fuseLoadingPromise;
  }
  
  try {
    if (!studies || !Array.isArray(studies) || studies.length === 0) {
      console.error('SEARCH: Cannot initialize search engine - invalid studies data');
      return Promise.reject(new Error('Invalid studies data'));
    }
    
    // Create a promise to track the Fuse.js loading process
    fuseLoadingPromise = new Promise((resolve, reject) => {
      // Dynamically import Fuse.js
      import('https://cdn.jsdelivr.net/npm/fuse.js@6.6.2/dist/fuse.esm.js')
        .then(module => {
          const Fuse = module.default;
          
          // Configure Fuse with search options
          const options = {
            includeScore: true,
            threshold: 0.3,
            keys: [
              { name: 'title', weight: 1.5 },
              { name: 'description', weight: 1.0 },
              { name: 'categories', weight: 1.2 },
              { name: 'organization', weight: 0.8 },
              { name: 'metadata.subjects', weight: 1.0 }
            ]
          };
          
          try {
            // Create Fuse instance
            fuseInstance = new Fuse(studies, options);
            isSearchEngineReady = true;
            console.log('SEARCH: Search engine successfully initialized');
            resolve();
          } catch (err) {
            console.error('SEARCH: Error creating Fuse instance:', err);
            reject(err);
          }
        })
        .catch(error => {
          console.error('SEARCH: Error loading Fuse.js:', error);
          fuseLoadingPromise = null; // Allow retrying the initialization
          reject(error);
        });
    });
    
    return fuseLoadingPromise;
  } catch (error) {
    console.error('SEARCH: Error in initializeSearchEngine:', error);
    return Promise.reject(error);
  }
}

/**
 * Perform a search using the Fuse.js search engine
 * @param {string} query - The search query
 * @param {Array} studies - The full studies array to search if Fuse isn't ready
 * @returns {Array} - Array of search results
 */
async function search(query, studies = []) {
  try {
    console.log(`SEARCH: Searching for "${query}"`);
    
    // If query is empty, return all studies
    if (!query || query.trim() === '') {
      console.log('SEARCH: Empty query, returning all studies');
      return studies.length > 0 ? studies : AppState.getStudies() || [];
    }
    
    // Check if search engine is ready
    if (!isSearchEngineReady || !fuseInstance) {
      console.log('SEARCH: Search engine not ready, waiting for initialization');
      
      // If we have a loading promise, wait for it
      if (fuseLoadingPromise) {
        try {
          await fuseLoadingPromise;
          console.log('SEARCH: Search engine loaded, proceeding with search');
        } catch (error) {
          console.error('SEARCH: Failed to initialize search engine:', error);
          // Fall back to simple filtering if available
          return performSimpleSearch(query, studies);
        }
      } else {
        console.warn('SEARCH: No search engine loading process found');
        return performSimpleSearch(query, studies);
      }
    }
    
    // At this point, fuseInstance should be available
    if (fuseInstance) {
      const results = fuseInstance.search(query);
      console.log(`SEARCH: Found ${results.length} results`);
      
      // Map results to actual study objects (Fuse returns objects with item property)
      return results.map(result => result.item);
    } else {
      console.error('SEARCH: Fuse instance still not available after waiting');
      return performSimpleSearch(query, studies);
    }
  } catch (error) {
    console.error('SEARCH: Error performing search:', error);
    // Fall back to simple filtering
    return performSimpleSearch(query, studies);
  }
}

/**
 * Perform a simple search as fallback when Fuse.js is not available
 * @param {string} query - The search query
 * @param {Array} studies - The studies to search
 * @returns {Array} - Filtered studies
 */
function performSimpleSearch(query, studies = []) {
  console.log('SEARCH: Performing simple fallback search');
  
  // Get studies from parameter or AppState
  const studiesData = studies.length > 0 ? studies : AppState.getStudies() || [];
  
  if (!query || query.trim() === '') {
    return studiesData;
  }
  
  // Simple case-insensitive search across multiple fields
  const lowercaseQuery = query.toLowerCase();
  return studiesData.filter(study => {
    return (
      (study.title && study.title.toLowerCase().includes(lowercaseQuery)) ||
      (study.description && study.description.toLowerCase().includes(lowercaseQuery)) ||
      (study.organization && study.organization.toLowerCase().includes(lowercaseQuery)) ||
      (Array.isArray(study.categories) && study.categories.some(cat => 
        cat.toLowerCase().includes(lowercaseQuery)
      ))
    );
  });
}

/**
 * Filter studies based on active filters in AppState
 * @param {Array} studies - The studies to filter
 * @returns {Array} Filtered array of studies
 */
function filterStudies(studies) {
  // Defensive check for studies
  if (!studies || !Array.isArray(studies)) {
    console.error('Invalid studies data in filterStudies:', studies);
    return [];
  }
  
  console.log(`Filtering ${studies.length} studies`);
  
  // Defensive check for AppState
  if (!AppState) {
    console.error('AppState is undefined in filterStudies');
    return studies;
  }
  
  try {
    // Get category filters directly from AppState
    const categoryFilters = AppState.getCategoryFilters();
    console.log(`Using ${categoryFilters.length} category filters from AppState`);
    
    // If no categories are selected, show all studies
    if (!categoryFilters || categoryFilters.length === 0) {
      console.log('No category filters active, returning all studies');
      return studies;
    }
    
    // Convert array to Set for faster lookups
    const categories = new Set(categoryFilters);
    
    // Apply filtering
    return studies.filter(study => {
      // Skip null/undefined studies
      if (!study) return false;
      
      // Extract categories from study
      let studyCategories = [];
      if (typeof study.categories === 'string') {
        studyCategories = study.categories.split('|');
      } else if (Array.isArray(study.categories)) {
        studyCategories = study.categories;
      }
      
      // Show study only if it belongs to at least one of the selected categories
      const hasSelectedCategory = studyCategories.some(studyCategory => {
        // For debugging
        console.log('Checking study category:', studyCategory);
        
        // Exact match
        if (categories.has(studyCategory)) {
          console.log('Exact match found for:', studyCategory);
          return true;
        }
        
        // Check for matches between button categories and actual data categories
        for (const filterCategory of categories) {
          console.log('Comparing filter:', filterCategory, 'with study category:', studyCategory);
          
          // For 'AI Use and Perceptions' button
          if (filterCategory === 'AI Use and Perceptions' && 
              (studyCategory === 'Current AI Use and Perceptions in PK 12 & HigherEd' ||
               studyCategory.includes('AI Use') ||
               studyCategory.includes('AI Perceptions'))) {
            console.log('Matched AI Use and Perceptions');
            return true;
          }
          
          // For 'Guidelines, Training, Policies' button
          if (filterCategory === 'Guidelines, Training, Policies' && 
              (studyCategory === 'Current State of Guidelines, Training, and Policies' ||
               studyCategory.includes('Guidelines') ||
               studyCategory.includes('Training') ||
               studyCategory.includes('Policies'))) {
            console.log('Matched Guidelines category');
            return true;
          }
          
          // For 'Student Performance Data' button
          if (filterCategory === 'Student Performance Data' && 
              (studyCategory === 'Student Performance Data' ||
               studyCategory.includes('Performance') ||
               studyCategory.includes('Student Data'))) {
            console.log('Matched Performance Data category');
            return true;
          }
          
          // For 'Workforce Trends' button
          if (filterCategory === 'Workforce Trends' && 
              (studyCategory === 'Workforce Trends' ||
               studyCategory.includes('Workforce'))) {
            console.log('Matched Workforce category');
            return true;
          }
        }
        
        return false;
      });
      
      return hasSelectedCategory;
    });
  } catch (error) {
    console.error('Error during filtering:', error);
    return studies || [];
  }
}

/**
 * Get filtered and searched results based on AppState
 * @returns {Array} Filtered and searched array of studies
 */
function getFilteredResults() {
  // Defensive check for AppState
  if (!AppState) {
    console.error('AppState is undefined in getFilteredResults');
    return [];
  }
  
  // Get search query using the getter method
  const searchQuery = AppState.getSearchQuery ? AppState.getSearchQuery() : '';
  
  // Get studies using the getter method
  const studies = AppState.getStudies ? AppState.getStudies() : [];
  
  // Get category filters using the getter method
  const categoryFilters = AppState.getCategoryFilters ? AppState.getCategoryFilters() : [];
  
  // Log the current state for debugging
  console.log('getFilteredResults - current state:', {
    searchQuery,
    hasStudies: !!studies,
    studiesLength: studies ? studies.length : 0,
    categoryFilters
  });
  
  // First search - with defensive check
  let results = [];
  try {
    results = search(searchQuery, studies);
  } catch (error) {
    console.error('Error during search:', error);
    // Fall back to all studies if search fails
    results = studies || [];
  }
  
  // Then filter - with defensive check
  try {
    return filterStudies(results);
  } catch (error) {
    console.error('Error during filtering:', error);
    return results || [];
  }
}

// Export functions
export {
  initializeSearchEngine,
  search,
  filterStudies,
  getFilteredResults,
  isSearchEngineReady
}; 