/**
 * Main entry point for the GenAI Studies Explorer
 * Version 4.0 with domain button filters and simplified UI
 * With enhanced error handling and guaranteed safe data structures
 */

import AppState from './modules/state.js';
// Temporarily comment out bootstrap import to avoid errors
// import { bootstrapApplication } from './modules/bootstrap.js';
import { initializeSearchEngine, search } from './modules/search-engine.js';
import { 
  setupEventListeners, 
  displayStudies, 
  populateCategoryFilters, 
  loadFiltersFromURL,
  updateViewMode,
  updateResults
} from './modules/ui-handlers.js';

// Keep track of whether initialization is complete
let appInitialized = false;

/**
 * Initialize the search engine
 * @returns {Promise<void>}
 */
async function initSearch() {
  try {

    // Get the studies data from AppState
    const studies = AppState.getStudies();
    
    // Ensure studies data is valid
    if (!studies || !Array.isArray(studies) || studies.length === 0) {
      
      return Promise.resolve();
    }

    try {
      // Initialize the search engine with the studies data and await its completion
      await initializeSearchEngine(studies);

      // Test search engine with a simple query
      const testQuery = ""; // Empty query should return all studies
      const results = await search(testQuery);

      return Promise.resolve();
    } catch (searchError) {
      console.error('APP: Error initializing search engine:', searchError);
      return Promise.resolve(); // Continue app initialization even if search engine fails
    }
    
  } catch (error) {
    console.error('APP: Error in initSearch function:', error);
    return Promise.reject(error);
  }
}

/**
 * Initialize the application
 */
async function initApp() {
  try {

    // Set up event listeners
    
    setupEventListeners();
    
    // Add explicit search button listener
    const searchButton = document.getElementById('search-button');
    const searchInput = document.getElementById('search-input');
    if (searchButton && searchInput) {
      // Function to perform the search
      const performSearch = () => {
        
        try {
          const query = searchInput.value.trim();

          // Set the search query in the application state
          AppState.setSearchQuery(query);
          
          // Update the results based on the new query
          updateResults();
          
        } catch (error) {
          console.error('APP: Error during search:', error);
        }
      };
      
      // Add click listener to button
      searchButton.addEventListener('click', performSearch);

      // Add keypress listener to input field (for Enter key)
      searchInput.addEventListener('keyup', (event) => {
        if (event.key === 'Enter') {
          
          performSearch();
        }
      });
      
    } else {
      
      if (!searchButton) 
      if (!searchInput) 
    }
    
    // Show loading indicator - safely check if it exists first
    const loadingIndicator = document.getElementById('loading-indicator');
    if (loadingIndicator) {
      loadingIndicator.style.display = 'block';
      
    } else {
      
    }
    
    try {
      // Direct test of CSV loading for debugging
      
      const csvResponse = await fetch('data/studies.csv');
      if (!csvResponse.ok) {
        console.error(`APP: DIRECT TEST - Failed to fetch CSV: ${csvResponse.status} ${csvResponse.statusText}`);
      } else {
        const csvText = await csvResponse.text();

      }
    } catch (csvTestError) {
      console.error('APP: DIRECT TEST - CSV test failed:', csvTestError);
    }
    
    // Load the studies data
    
    let studiesData = [];
    
    try {
      const { loadStudiesData, parseCSV } = await import('./modules/data-loader.js');
      studiesData = await loadStudiesData();

      if (!studiesData || studiesData.length === 0) {
        console.error('APP: No studies loaded from data-loader, attempting direct CSV load');
        
        // Try direct loading as fallback
        const response = await fetch('data/studies.csv');
        const csvText = await response.text();
        studiesData = parseCSV(csvText);
        
      }
    } catch (dataLoadError) {
      console.error('APP: Failed to load studies data:', dataLoadError);
      // Show error message
      const resultsContainer = document.getElementById('results-container');
      if (resultsContainer) {
        resultsContainer.innerHTML = 
          `<div class="error-message">Error loading studies data: ${dataLoadError.message}. Please check console for details.</div>`;
      } else {
        console.error('APP: Results container not found, cannot display error message');
      }
    }

    // Set the studies in AppState
    
    AppState.setStudies(studiesData);
    
    // Verify studies were set properly
    const studiesInState = AppState.getStudies();

    // Initialize the category filters
    
    initCategoryFilters();
    
    // Initialize search implementation AFTER data is loaded
    
    await initSearch();
    
    // Hide loading indicator - safely check if it exists first
    if (loadingIndicator) {
      loadingIndicator.style.display = 'none';
      
    }
    
    // Get a safe copy of studies
    const safeStudies = studiesInState || [];

    // Initial display of studies
    
    displayStudies(safeStudies, true); // Force display even if studies appear empty

  } catch (error) {
    console.error('APP: Error during application initialization:', error);
    
    // Safely hide loading indicator
    const loadingIndicator = document.getElementById('loading-indicator');
    if (loadingIndicator) {
      loadingIndicator.style.display = 'none';
    }
    
    // Safely update results container
    const resultsContainer = document.getElementById('results-container');
    if (resultsContainer) {
      resultsContainer.innerHTML = 
        `<div class="error-message">Error loading application: ${error.message}. Please refresh the page.</div>`;
    } else {
      console.error('APP: Results container not found, cannot display error message');
    }
  }
}

/**
 * Check if the app is fully initialized
 * External modules can use this to check if it's safe to access AppState
 * @returns {boolean} Whether the app is fully initialized
 */
function isAppInitialized() {
  return appInitialized;
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {

  // Log imports to help debug module loading issues

  initApp().catch(error => {
    console.error('Uncaught error during initialization:', error);
  });
});

// Export functions and state for debugging and external access
window.AppState = AppState;
window.isAppInitialized = isAppInitialized;

/**
 * Initialize category filters 
 */
function initCategoryFilters() {
  try {

    // Define the core categories used in the application
    const categories = [
      'AI Use and Perceptions',
      'Workforce Trends',
      'Student Performance Data',
      'Guidelines, Training, Policies'
    ];

    // Get the filters container - update to use the correct ID that exists in the HTML
    const filtersContainer = document.getElementById('category-filters');
    if (!filtersContainer) {
      console.error('APP: Category filters container not found');
      return;
    }
    
    // Clear existing filters
    filtersContainer.innerHTML = '';
    
    // Create a button for each category
    categories.forEach(category => {
      try {
        const button = document.createElement('button');
        button.className = 'filter-button domain-button';
        button.dataset.category = category;
        
        // Create a span for the text instead of using textContent
        const textSpan = document.createElement('span');
        textSpan.textContent = category;
        button.appendChild(textSpan);
        
        // Add click event handler
        button.addEventListener('click', function() {
          // Toggle selected state
          this.classList.toggle('selected');
          
          // Update AppState based on button state
          if (this.classList.contains('selected')) {
            
            AppState.addCategoryFilter(category);
          } else {
            
            AppState.removeCategoryFilter(category);
          }
          
          // Update the results based on new filters
          updateResults();
        });
        
        filtersContainer.appendChild(button);
      } catch (error) {
        console.error(`APP: Error creating button for category ${category}:`, error);
      }
    });

  } catch (error) {
    console.error('APP: Error initializing category filters:', error);
  }
} 