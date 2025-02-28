/**
 * Main entry point for the GenAI Studies Explorer
 * Version 4.0 with domain button filters and simplified UI
 * With enhanced error handling and guaranteed safe data structures
 */

import AppState from './modules/state.js';
import { bootstrapApplication } from './modules/bootstrap.js';
import { initializeSearchEngine } from './modules/search-engine.js';
import { 
  setupEventListeners, 
  displayStudies, 
  populateCategoryFilters, 
  loadFiltersFromURL 
} from './modules/ui-handlers.js';

// Keep track of whether initialization is complete
let appInitialized = false;

/**
 * Initialize the application
 * Completely revised initialization flow using bootstrap pattern
 */
async function initApp() {
  try {
    const resultsContainer = document.getElementById('results-container');
    if (!resultsContainer) {
      console.error('CRITICAL ERROR: Results container not found in DOM');
      return;
    }
    
    resultsContainer.innerHTML = '<p>Initializing application...</p>';
    
    // Bootstrap the application - this handles data loading, normalization and retries
    console.log('INITAPP: Starting bootstrap process...');
    const safeStudies = await bootstrapApplication();
    
    // Verify we have data
    if (!safeStudies || !Array.isArray(safeStudies) || safeStudies.length === 0) {
      console.error('INITAPP: Bootstrap process failed to provide valid data');
      resultsContainer.innerHTML = '<p class="error-message">Error: Could not load studies data. Please try refreshing the page.</p>';
      return;
    }
    
    console.log(`INITAPP: Bootstrap successful, received ${safeStudies.length} safe studies`);
    
    // Store clean data in AppState
    console.log('INITAPP: Setting studies in AppState');
    AppState.setStudies(safeStudies);
    
    // Initialize search engine with safe data
    console.log('INITAPP: Initializing search engine');
    initializeSearchEngine(safeStudies);
    
    // Set up event listeners
    console.log('INITAPP: Setting up event listeners');
    setupEventListeners();
    
    // Get the predefined domains/categories
    console.log('INITAPP: Setting up domain categories');
    const domainCategories = [
      'AI Use and Perceptions',
      'Workforce Trends',
      'Student Performance Data',
      'Guidelines, Training, Policies'
    ];
    
    // Populate UI with domain buttons
    console.log('INITAPP: Populating domain buttons');
    populateCategoryFilters(domainCategories);
    
    // Clear any existing subject filters since we're removing that feature
    AppState.clearSubjectFilters();
    
    // Mark initialization as complete
    appInitialized = true;
    
    // Only try to load filters if we have a query string
    let filtersApplied = false;
    if (window.location.search) {
      try {
        console.log('INITAPP: Loading filters from URL');
        loadFiltersFromURL();
        filtersApplied = true;
        console.log('INITAPP: Filters successfully applied from URL');
      } catch (e) {
        console.error('INITAPP: Error loading filters from URL:', e);
        // Continue with default display
      }
    }
    
    // Display studies (either filtered or all)
    if (!filtersApplied) {
      console.log('INITAPP: Displaying all studies');
      displayStudies(safeStudies);
    }
    
    console.log('INITAPP: Application initialization complete');
    
  } catch (error) {
    console.error('INITAPP: Fatal error during initialization:', error);
    const resultsContainer = document.getElementById('results-container');
    if (resultsContainer) {
      resultsContainer.innerHTML = '<p class="error-message">A critical error occurred during initialization. Please try refreshing the page.</p>';
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
  initApp().catch(error => {
    console.error('Uncaught error during initialization:', error);
  });
});

// Export functions and state for debugging and external access
window.AppState = AppState;
window.isAppInitialized = isAppInitialized; 