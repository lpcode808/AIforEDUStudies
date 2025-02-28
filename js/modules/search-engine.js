/**
 * Search Engine Module for GenAI Studies Explorer - New Version
 * Provides powerful search capability using Fuse.js with enhanced error handling
 * Version 4.0 - Completely rebuilt to resolve export conflicts
 */

import AppState from './state.js';

// Fuse.js instance
let fuseInstance = null;

/**
 * Initialize the search engine with studies data
 * @param {Array} studies - Array of study objects to index
 */
function initializeSearchEngine(studies) {
  try {
    console.log('SEARCH: Initializing search engine');
    
    if (!studies || !Array.isArray(studies) || studies.length === 0) {
      console.error('SEARCH: Cannot initialize search engine - invalid studies data');
      return;
    }
    
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
        
        // Create Fuse instance
        fuseInstance = new Fuse(studies, options);
        console.log('SEARCH: Search engine successfully initialized');
      })
      .catch(error => {
        console.error('SEARCH: Error loading Fuse.js:', error);
      });
  } catch (error) {
    console.error('SEARCH: Error initializing search engine:', error);
  }
}

/**
 * Search for studies matching the query
 * @param {Array} studies - The studies to search within
 * @param {string} query - The search query
 * @returns {Array} Filtered array of studies matching the query
 */
function search(studies, query) {
  try {
    if (!query || typeof query !== 'string' || query.trim() === '') {
      return studies;
    }
    
    query = query.trim();
    console.log(`SEARCH: Searching for "${query}"`);
    
    // If Fuse.js failed to load, fallback to basic search
    if (!fuseInstance) {
      console.warn('SEARCH: Fuse.js not available, using basic search');
      return basicSearch(studies, query);
    }
    
    // Perform search with Fuse.js
    const results = fuseInstance.search(query);
    console.log(`SEARCH: Found ${results.length} results with Fuse.js`);
    
    // Extract the items from results and return
    return results.map(result => result.item);
  } catch (error) {
    console.error('SEARCH: Error performing search:', error);
    return studies; // Return original studies on error
  }
}

/**
 * Basic search fallback when Fuse.js is not available
 * @param {Array} studies - The studies to search within
 * @param {string} query - The search query
 * @returns {Array} Filtered array of studies matching the query
 */
function basicSearch(studies, query) {
  try {
    if (!query || !studies || !Array.isArray(studies)) {
      return studies;
    }
    
    // Convert query to lowercase for case-insensitive matching
    const lowerQuery = query.toLowerCase();
    
    // Filter studies by query
    return studies.filter(study => {
      if (!study) return false;
      
      // Check title
      if (study.title && study.title.toLowerCase().includes(lowerQuery)) {
        return true;
      }
      
      // Check description
      if (study.description && study.description.toLowerCase().includes(lowerQuery)) {
        return true;
      }
      
      // Check organization
      if (study.organization && study.organization.toLowerCase().includes(lowerQuery)) {
        return true;
      }
      
      // Check categories
      if (Array.isArray(study.categories)) {
        for (const category of study.categories) {
          if (category && category.toLowerCase().includes(lowerQuery)) {
            return true;
          }
        }
      }
      
      // Check subjects
      if (study.metadata && Array.isArray(study.metadata.subjects)) {
        for (const subject of study.metadata.subjects) {
          if (subject && subject.toLowerCase().includes(lowerQuery)) {
            return true;
          }
        }
      }
      
      return false;
    });
  } catch (error) {
    console.error('SEARCH: Error in basic search:', error);
    return studies; // Return original studies on error
  }
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
    results = search(studies, searchQuery);
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

// Single export statement - only one place where exports happen
export { 
  initializeSearchEngine,
  search,
  filterStudies,
  getFilteredResults
}; 