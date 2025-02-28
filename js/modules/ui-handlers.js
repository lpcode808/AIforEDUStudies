/**
 * UI Handlers Module for GenAI Studies Explorer
 * Contains functions for handling user interactions with the UI
 * Version 4.0 with big domain buttons and improved UX
 */

import AppState from './state.js';
import { createStudyCard, createFilterChip } from './components.js';
import { search } from './search-engine.js';

/**
 * Sets up all event listeners for the UI
 */
export function setupEventListeners() {
  console.log('UI: Setting up event listeners');

  // Category filter listeners (now button-based)
  const categoryFilters = document.getElementById('category-filters');
  if (categoryFilters) {
    categoryFilters.addEventListener('click', (event) => {
      const domainButton = event.target.closest('.domain-button');
      if (domainButton) {
        const category = domainButton.dataset.domain;
        const isActive = domainButton.classList.contains('active');
        
        if (isActive) {
          domainButton.classList.remove('active');
          AppState.removeCategoryFilter(category);
        } else {
          domainButton.classList.add('active');
          AppState.addCategoryFilter(category);
        }
        updateResults();
      }
    });
  } else {
    console.warn('UI: Category filters container not found in DOM');
  }

  // Search input listener
  const searchInput = document.getElementById('search-input');
  if (searchInput) {
    // Debounce search to prevent excessive updates
    let searchTimeout;
    searchInput.addEventListener('input', (event) => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        const query = event.target.value.trim();
        AppState.setSearchQuery(query);
        updateResults();
      }, 300);
    });
  } else {
    console.warn('UI: Search input not found in DOM');
  }

  // Clear filters button
  const clearFiltersBtn = document.getElementById('clear-filters');
  if (clearFiltersBtn) {
    clearFiltersBtn.addEventListener('click', () => {
      AppState.clearFilters();
      
      // Reset all domain buttons to active state
      const domainButtons = document.querySelectorAll('.domain-button');
      domainButtons.forEach(button => {
        button.classList.add('active');
        
        // Re-add the category to the AppState
        const category = button.dataset.domain;
        if (category) {
          AppState.addCategoryFilter(category);
        }
      });
      
      // Clear search input
      const searchInput = document.getElementById('search-input');
      if (searchInput) {
        searchInput.value = '';
      }
      
      updateResults();
    });
  } else {
    console.warn('UI: Clear filters button not found in DOM');
  }
}

/**
 * Updates the results display based on current filters
 */
export function updateResults() {
  try {
    console.log('UI: Updating results based on filters');
    
    // Get the full dataset from AppState
    let results = AppState.getStudies();
    console.log(`UI: Starting with ${results.length} total studies`);
    
    // Show all when no filters are active
    const activeFiltersSection = document.getElementById('active-filters-section');
    
    // Apply category filters if any are active
    const categoryFilters = AppState.getCategoryFilters();
    if (categoryFilters.length > 0) {
      console.log(`UI: Filtering by categories: ${categoryFilters.join(', ')}`);
      results = results.filter(study => {
        if (!study || !Array.isArray(study.categories)) return false;
        return study.categories.some(category => categoryFilters.includes(category));
      });
      console.log(`UI: ${results.length} studies match category filters`);
    }
    
    // Apply search query if present
    const searchQuery = AppState.getSearchQuery();
    if (searchQuery) {
      console.log(`UI: Filtering by search query: "${searchQuery}"`);
      results = search(results, searchQuery);
      console.log(`UI: ${results.length} studies match search query`);
    }
    
    // Update active filters UI
    updateActiveFiltersDisplay();
    
    // Update results display
    displayStudies(results);
    
  } catch (error) {
    console.error('UI: Error updating results:', error);
    displayError('An error occurred while updating results. Please try refreshing the page.');
  }
}

/**
 * Displays a list of studies in the results container
 * @param {Array} studies - Array of study objects to display
 */
export function displayStudies(studies) {
  try {
    const resultsContainer = document.getElementById('results-container');
    
    if (!resultsContainer) {
      console.error('UI: Could not find results container');
      return;
    }
    
    // Clear the container
    resultsContainer.innerHTML = '';
    
    // Create a separate container for the studies grid
    const gridContainer = document.createElement('div');
    gridContainer.id = 'studies-grid';
    
    // Add study counter element with a fixed calculation logic
    // Get the actual count from the data array length - don't use the header-adjusted count
    const totalStudies = AppState.getStudies().length - 1; // Subtract 1 for header row
    const displayedStudies = studies ? studies.length : 0;
    
    // Fix the count to ensure displayed studies never exceeds total studies
    const adjustedDisplayedStudies = Math.min(displayedStudies, totalStudies);
    
    /* Studies counter disabled to save space
    // Remove any existing counter before adding a new one
    const existingCounter = document.querySelector('.studies-counter');
    if (existingCounter) {
      existingCounter.remove();
    }
    
    // Create the counter with a more prominent styling as a standalone element
    const counterElement = document.createElement('div');
    counterElement.className = 'studies-counter';
    counterElement.innerHTML = `<span>Showing ${adjustedDisplayedStudies} of ${totalStudies} studies</span>`;
    
    // Find the new container for the counter (below Filters heading)
    const counterContainer = document.getElementById('studies-counter-container');
    if (counterContainer) {
      // Clear any existing content in the counter container
      counterContainer.innerHTML = '';
      counterContainer.appendChild(counterElement);
    } else {
      // Fallback to the old location if container not found
      resultsContainer.appendChild(counterElement);
    }
    */
    
    // If no studies, show empty message
    if (!studies || !Array.isArray(studies) || studies.length === 0) {
      const noResultsElement = document.createElement('p');
      noResultsElement.className = 'no-results';
      noResultsElement.textContent = 'No studies match your filters. Try adjusting your criteria.';
      resultsContainer.appendChild(noResultsElement);
      return;
    }
    
    // Create a document fragment for performance
    const fragment = document.createDocumentFragment();
    
    // Add each study card to the fragment (use the adjusted count to prevent showing more than total)
    studies.slice(0, totalStudies).forEach(study => {
      try {
        const card = createStudyCard(study);
        if (card) {
          fragment.appendChild(card);
        }
      } catch (error) {
        console.error(`UI: Error creating card for study ${study?.id || 'unknown'}:`, error);
      }
    });
    
    // Add the fragment to the grid container
    gridContainer.appendChild(fragment);
    
    // Add the grid container to the results container
    resultsContainer.appendChild(gridContainer);
    
    console.log('UI: Finished displaying studies');
    
  } catch (error) {
    console.error('UI: Error displaying studies:', error);
    const resultsContainer = document.getElementById('results-container');
    if (resultsContainer) {
      resultsContainer.innerHTML = `<p class="error-message">Error displaying studies: ${error.message}</p>`;
    }
  }
}

/**
 * Loads filters from URL parameters
 */
export function loadFiltersFromURL() {
  try {
    console.log('UI: Loading filters from URL parameters');
    
    // Ensure AppState is initialized
    if (!window.isAppInitialized || !window.isAppInitialized()) {
      console.warn('UI: Cannot load filters - app not fully initialized');
      return;
    }
    
    // Get the URL parameters
    const params = new URLSearchParams(window.location.search);
    
    // Load category filters
    const categoriesParam = params.get('categories');
    if (categoriesParam) {
      const categories = categoriesParam.split(',').map(c => c.trim());
      console.log(`UI: Loading category filters from URL: ${categories.join(', ')}`);
      
      // Check all corresponding checkboxes
      categories.forEach(category => {
        const checkbox = document.querySelector(`#category-filters input[value="${category}"]`);
        if (checkbox) {
          checkbox.checked = true;
          AppState.addCategoryFilter(category);
        } else {
          console.warn(`UI: Category "${category}" from URL not found in available filters`);
        }
      });
    }
    
    // Load subject filters
    const subjectsParam = params.get('subjects');
    if (subjectsParam) {
      const subjects = subjectsParam.split(',').map(s => s.trim());
      console.log(`UI: Loading subject filters from URL: ${subjects.join(', ')}`);
      
      // Check all corresponding checkboxes
      subjects.forEach(subject => {
        const checkbox = document.querySelector(`#subject-filters input[value="${subject}"]`);
        if (checkbox) {
          checkbox.checked = true;
          AppState.addSubjectFilter(subject);
        } else {
          console.warn(`UI: Subject "${subject}" from URL not found in available filters`);
        }
      });
    }
    
    // Load search query
    const searchParam = params.get('q');
    if (searchParam) {
      console.log(`UI: Loading search query from URL: "${searchParam}"`);
      const searchInput = document.getElementById('search-input');
      if (searchInput) {
        searchInput.value = searchParam;
      }
      AppState.setSearchQuery(searchParam);
    }
    
    // Update results with the loaded filters
    updateResults();
    
    console.log('UI: Successfully loaded filters from URL');
    
  } catch (error) {
    console.error('UI: Error loading filters from URL:', error);
    // Continue without filters
  }
}

/**
 * Updates the active filters display area with current filters.
 * Note: Currently hidden to avoid redundancy with button-style domain filters
 */
function updateActiveFiltersDisplay() {
  // Hide active filters section entirely - buttons now show active state visually
  const activeFiltersContainer = document.getElementById('active-filters');
  if (activeFiltersContainer) {
    activeFiltersContainer.classList.add('hidden');
  }
  
  // No need to display filter chips as buttons now show the active state
}

/**
 * Displays an error message in the results container
 * @param {string} message - The error message to display
 */
function displayError(message) {
  try {
    const resultsContainer = document.getElementById('results-container');
    if (resultsContainer) {
      resultsContainer.innerHTML = `<p class="error-message">${message}</p>`;
    } else {
      console.error('UI: Cannot display error - results container not found');
    }
  } catch (error) {
    console.error('UI: Error displaying error message:', error);
  }
}

/**
 * Populates the category filters panel with big buttons
 * @param {Array} categories - Array of category strings
 */
export function populateCategoryFilters(categories) {
  try {
    if (!Array.isArray(categories)) {
      console.error('UI: Invalid categories data for filters');
      return;
    }
    
    const categoryFiltersContainer = document.getElementById('category-filters');
    if (!categoryFiltersContainer) {
      console.warn('UI: Category filters container not found in DOM');
      return;
    }
    
    // Clear existing filters
    categoryFiltersContainer.innerHTML = '';
    
    // Sort categories alphabetically
    const sortedCategories = [...categories].sort();
    
    // Create a button for each domain category
    sortedCategories.forEach(category => {
      if (!category || typeof category !== 'string') return;
      
      const button = document.createElement('button');
      button.className = 'domain-button active'; // All active by default
      button.dataset.domain = category;
      button.textContent = category;
      
      categoryFiltersContainer.appendChild(button);
      
      // Add to active filters initially since all are active by default
      AppState.addCategoryFilter(category);
    });
    
    console.log(`UI: Populated ${sortedCategories.length} domain buttons`);
    updateResults();
  } catch (error) {
    console.error('UI: Error populating category filters:', error);
  }
}