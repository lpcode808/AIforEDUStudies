/**
 * UI Handlers Module for GenAI Studies Explorer
 * Contains functions for handling user interactions with the UI
 * Version 4.0 with big domain buttons and improved UX
 */

import AppState from './state.js';
import { createStudyCard, createStudyRow, createStudyModalContent, createFilterChip } from './components.js';
import { search } from './search-engine.js';

/**
 * Sets up all event listeners for the UI
 */
function setupEventListeners() {
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
  
  // View toggle button
  const toggleViewBtn = document.getElementById('toggle-view-btn');
  if (toggleViewBtn) {
    toggleViewBtn.addEventListener('click', () => {
      const newMode = AppState.toggleViewMode();
      updateViewMode();
    });
  } else {
    console.warn('UI: View toggle button not found in DOM');
  }
  
  // Modal setup
  setupModalEventListeners();
}

/**
 * Set up event listeners for the modal
 */
function setupModalEventListeners() {
  const modalOverlay = document.getElementById('study-modal-overlay');
  const modalCloseBtn = document.getElementById('study-modal-close');
  
  if (!modalOverlay || !modalCloseBtn) {
    console.warn('UI: Modal elements not found in DOM');
    return;
  }
  
  // Close modal when clicking the close button
  modalCloseBtn.addEventListener('click', () => {
    closeModal();
  });
  
  // Close modal when clicking outside the modal content
  modalOverlay.addEventListener('click', (event) => {
    if (event.target === modalOverlay) {
      closeModal();
    }
  });
  
  // Close modal when pressing escape key
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && modalOverlay.classList.contains('active')) {
      closeModal();
    }
  });
  
  // Delegate click events on study rows to show modal
  const resultsContainer = document.getElementById('results-container');
  if (resultsContainer) {
    resultsContainer.addEventListener('click', (event) => {
      // Only handle clicks if we're in list view
      if (AppState.getViewMode() !== 'list') return;
      
      const studyRow = event.target.closest('.study-row');
      // Only process if it's a click on the row but not on the view button
      if (studyRow && !event.target.closest('.view-study-row-btn')) {
        const studyId = studyRow.dataset.id;
        if (studyId) {
          openStudyDetailsModal(studyId);
        }
      }
    });
  }
}

/**
 * Open the study details modal for a specific study
 * @param {string} studyId - ID of the study to display
 */
function openStudyDetailsModal(studyId) {
  try {
    // Find the study in the AppState
    const studies = AppState.getStudies();
    const study = studies.find(s => s.id === studyId);
    
    if (!study) {
      console.error(`UI: Could not find study with ID ${studyId}`);
      return;
    }
    
    // Get the modal elements
    const modalContent = document.getElementById('study-modal-content');
    const modalOverlay = document.getElementById('study-modal-overlay');
    
    if (!modalContent || !modalOverlay) {
      console.error('UI: Modal elements not found in DOM');
      return;
    }
    
    // Clear existing content
    modalContent.innerHTML = '';
    
    // Create and append new content
    const content = createStudyModalContent(study);
    modalContent.appendChild(content);
    
    // Show the modal
    modalOverlay.classList.add('active');
    
    // Add body class to prevent scrolling
    document.body.classList.add('modal-open');
  } catch (error) {
    console.error('UI: Error opening study modal:', error);
  }
}

/**
 * Close the study details modal
 */
function closeModal() {
  try {
    const modalOverlay = document.getElementById('study-modal-overlay');
    
    if (!modalOverlay) {
      console.error('UI: Modal overlay not found in DOM');
      return;
    }
    
    // Hide the modal
    modalOverlay.classList.remove('active');
    
    // Remove body class to enable scrolling
    document.body.classList.remove('modal-open');
  } catch (error) {
    console.error('UI: Error closing modal:', error);
  }
}

/**
 * Switch to list view or card view based on the current AppState view mode
 * This updates the UI to reflect the current view mode
 */
function updateViewMode() {
  try {
    const viewMode = AppState.getViewMode();
    console.log(`UI: Switching to ${viewMode} view`);
    
    // Get the current results container
    const resultsContainer = document.getElementById('results-container');
    if (!resultsContainer) {
      console.error('UI: Results container not found');
      return;
    }
    
    // Remove any existing view containers
    const oldGrid = document.getElementById('studies-grid');
    const oldList = document.getElementById('studies-list');
    
    if (oldGrid) oldGrid.remove();
    if (oldList) oldList.remove();
    
    // Create a new container for the current view
    const container = document.createElement('div');
    
    if (viewMode === 'list') {
      container.id = 'studies-list';
      container.className = 'list-view';
    } else {
      container.id = 'studies-grid';
      container.className = 'grid-view';
    }
    
    resultsContainer.appendChild(container);
    
    // Update the toggle button
    updateViewToggleButton(viewMode);
    
    // Re-display the studies with the current view
    updateResults();
  } catch (error) {
    console.error('UI: Error updating view mode:', error);
  }
}

/**
 * Updates the view toggle button to reflect the current view mode
 * @param {string} viewMode - Current view mode ('card' or 'list') 
 */
function updateViewToggleButton(viewMode) {
  try {
    const toggleBtn = document.getElementById('toggle-view-btn');
    if (!toggleBtn) return;
    
    const iconSpan = toggleBtn.querySelector('.view-icon');
    const labelSpan = toggleBtn.querySelector('.view-label');
    
    if (viewMode === 'list') {
      // We're in list view, so button should show option for card view
      toggleBtn.classList.add('active');
      if (iconSpan) iconSpan.textContent = '🔲';
      if (labelSpan) labelSpan.textContent = 'Card View';
    } else {
      // We're in card view, so button should show option for list view
      toggleBtn.classList.remove('active');
      if (iconSpan) iconSpan.textContent = '📋';
      if (labelSpan) labelSpan.textContent = 'List View';
    }
  } catch (error) {
    console.error('UI: Error updating view toggle button:', error);
  }
}

/**
 * Updates the results display based on current filters
 */
function updateResults() {
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
function displayStudies(studies) {
  try {
    const resultsContainer = document.getElementById('results-container');
    
    if (!resultsContainer) {
      console.error('UI: Could not find results container');
      return;
    }
    
    // Clear the container
    resultsContainer.innerHTML = '';
    
    // Create a separate container for the studies
    const viewMode = AppState.getViewMode();
    const container = document.createElement('div');
    
    if (viewMode === 'list') {
      container.id = 'studies-list';
      container.className = 'list-view';
    } else {
      container.id = 'studies-grid';
      container.className = 'grid-view';
    }
    
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
    
    // Get the actual count from the data array length - don't use the header-adjusted count
    const totalStudies = AppState.getStudies().length - 1; // Subtract 1 for header row
    
    // Add each study to the fragment based on view mode
    if (viewMode === 'list') {
      // List view - simpler rows
      studies.slice(0, totalStudies).forEach(study => {
        try {
          const row = createStudyRow(study);
          if (row) {
            fragment.appendChild(row);
          }
        } catch (error) {
          console.error(`UI: Error creating row for study ${study?.id || 'unknown'}:`, error);
        }
      });
    } else {
      // Card view - detailed cards
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
    }
    
    // Add the fragment to the container
    container.appendChild(fragment);
    
    // Add the container to the results container
    resultsContainer.appendChild(container);
    
    console.log(`UI: Finished displaying ${studies.length} studies in ${viewMode} view`);
    
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
function loadFiltersFromURL() {
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
function populateCategoryFilters(categories) {
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

export { 
  setupEventListeners, 
  displayStudies, 
  populateCategoryFilters, 
  loadFiltersFromURL,
  updateResults,
  updateViewMode
};