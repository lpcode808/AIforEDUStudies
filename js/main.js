/**
 * Main entry point for the GenAI Studies Explorer
 * Version 4.0 with domain button filters and simplified UI
 * With enhanced error handling and guaranteed safe data structures
 */

import AppState from './modules/state.js';
// Temporarily comment out bootstrap import to avoid errors
// import { bootstrapApplication } from './modules/bootstrap.js';
import { initializeSearchEngine } from './modules/search-engine.js';
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
    console.log('APP: Initializing search engine');
    
    // Get the studies data from AppState
    const studies = AppState.getStudies();
    
    if (!studies || !Array.isArray(studies) || studies.length === 0) {
      console.warn('APP: No studies data available for search engine initialization');
      return Promise.resolve();
    }
    
    // Import the search engine module
    const { initializeSearchEngine } = await import('./modules/search-engine.js');
    
    // Initialize the search engine with the studies data
    initializeSearchEngine(studies);
    console.log(`APP: Search engine initialized with ${studies.length} studies`);
    
    return Promise.resolve();
  } catch (error) {
    console.error('APP: Error initializing search engine:', error);
    return Promise.reject(error);
  }
}

/**
 * Initialize the application
 */
async function initApp() {
  try {
    console.log('APP: Initializing application');
    
    // Set up event listeners
    console.log('APP: Setting up event listeners');
    setupEventListeners();
    
    // Add explicit search button listener
    const searchButton = document.getElementById('search-button');
    const searchInput = document.getElementById('search-input');
    if (searchButton && searchInput) {
      searchButton.addEventListener('click', () => {
        console.log('APP: Search button clicked');
        const query = searchInput.value.trim();
        AppState.setSearchQuery(query);
        updateResults();
      });
      console.log('APP: Search button event listener added');
    } else {
      console.warn('APP: Search button or input not found in DOM');
    }
    
    // Initialize search implementation
    console.log('APP: Initializing search implementation');
    await initSearch();
    
    // Show loading indicator - safely check if it exists first
    const loadingIndicator = document.getElementById('loading-indicator');
    if (loadingIndicator) {
      loadingIndicator.style.display = 'block';
      console.log('APP: Loading indicator shown');
    } else {
      console.warn('APP: Loading indicator element not found');
    }
    
    try {
      // Direct test of CSV loading for debugging
      console.log('APP: DIRECT TEST - Fetching CSV data');
      const csvResponse = await fetch('data/studies.csv');
      if (!csvResponse.ok) {
        console.error(`APP: DIRECT TEST - Failed to fetch CSV: ${csvResponse.status} ${csvResponse.statusText}`);
      } else {
        const csvText = await csvResponse.text();
        console.log(`APP: DIRECT TEST - Received CSV text length: ${csvText.length} chars`);
        console.log(`APP: DIRECT TEST - CSV preview: ${csvText.substring(0, 200)}...`);
      }
    } catch (csvTestError) {
      console.error('APP: DIRECT TEST - CSV test failed:', csvTestError);
    }
    
    // Load the studies data
    console.log('APP: Loading studies data from data-loader');
    let studiesData = [];
    
    try {
      const { loadStudiesData, parseCSV } = await import('./modules/data-loader.js');
      studiesData = await loadStudiesData();
      console.log(`APP: Loaded ${studiesData ? studiesData.length : 0} studies from data loader`);
      
      if (!studiesData || studiesData.length === 0) {
        console.error('APP: No studies loaded from data-loader, attempting direct CSV load');
        
        // Try direct loading as fallback
        const response = await fetch('data/studies.csv');
        const csvText = await response.text();
        studiesData = parseCSV(csvText);
        console.log(`APP: Direct CSV parse returned ${studiesData ? studiesData.length : 0} studies`);
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
    
    console.log('APP: Sample study data:', studiesData && studiesData.length > 0 ? 
      JSON.stringify(studiesData[0]).substring(0, 100) + '...' : 'No studies found');
    
    // Set the studies in AppState
    console.log('APP: Setting studies in AppState');
    AppState.setStudies(studiesData);
    
    // Verify studies were set properly
    const studiesInState = AppState.getStudies();
    console.log(`APP: Verified ${studiesInState ? studiesInState.length : 0} studies in AppState`);
    
    // Initialize the category filters
    console.log('APP: Initializing category filters');
    initCategoryFilters();
    
    // Hide loading indicator - safely check if it exists first
    if (loadingIndicator) {
      loadingIndicator.style.display = 'none';
      console.log('APP: Loading indicator hidden');
    }
    
    // Get a safe copy of studies
    const safeStudies = studiesInState || [];
    console.log(`APP: About to display ${safeStudies.length} studies`);
    
    // Initial display of studies
    console.log('APP: Initial display of studies');
    displayStudies(safeStudies, true); // Force display even if studies appear empty
    
    console.log('APP: Application initialization complete');
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
  console.log('DOM loaded, starting application initialization...');
  
  // Log imports to help debug module loading issues
  console.log('Debug - Imported modules:', {
    AppState: typeof AppState,
    // bootstrapApplication: typeof bootstrapApplication,
    initializeSearchEngine: typeof initializeSearchEngine,
    setupEventListeners: typeof setupEventListeners,
    displayStudies: typeof displayStudies,
    populateCategoryFilters: typeof populateCategoryFilters,
    loadFiltersFromURL: typeof loadFiltersFromURL,
    updateViewMode: typeof updateViewMode,
    updateResults: typeof updateResults
  });
  
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
    console.log('APP: Initializing category filters');
    
    // Define the core categories used in the application
    const categories = [
      'AI Use and Perceptions',
      'Workforce Trends',
      'Student Performance Data',
      'Guidelines, Training, Policies'
    ];
    
    console.log(`APP: Setting up ${categories.length} category filters:`, categories);
    
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
        button.textContent = category;
        
        // Add click event handler
        button.addEventListener('click', function() {
          // Toggle selected state
          this.classList.toggle('selected');
          
          // Update AppState based on button state
          if (this.classList.contains('selected')) {
            console.log(`APP: Adding category filter: ${category}`);
            AppState.addCategoryFilter(category);
          } else {
            console.log(`APP: Removing category filter: ${category}`);
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
    
    console.log('APP: Category filters initialized successfully');
  } catch (error) {
    console.error('APP: Error initializing category filters:', error);
  }
} 