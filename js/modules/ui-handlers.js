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
  const listViewBtn = document.getElementById('list-view-btn');
  const cardViewBtn = document.getElementById('card-view-btn');
  
  if (listViewBtn && cardViewBtn) {
    listViewBtn.addEventListener('click', () => {
      AppState.setViewMode('list');
      updateViewMode();
    });
    
    cardViewBtn.addEventListener('click', () => {
      AppState.setViewMode('card');
      updateViewMode();
    });
  } else {
    console.warn('UI: View toggle buttons not found in DOM');
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
      if (studyRow && !event.target.closest('.view-study-btn')) {
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
    console.log(`UI: Switching to ${viewMode} view mode`);
    
    // Get the current results container
    const resultsContainer = document.getElementById('results-container');
    if (!resultsContainer) {
      console.error('UI: Results container not found');
      return;
    }
    
    // Remove any existing view containers
    const oldGrid = document.getElementById('studies-grid');
    const oldList = document.getElementById('studies-list');
    
    if (oldGrid) {
      console.log('UI: Removing old grid container');
      oldGrid.remove();
    }
    if (oldList) {
      console.log('UI: Removing old list container');
      oldList.remove();
    }
    
    // Create a new container for the current view
    const container = document.createElement('div');
    
    if (viewMode === 'list') {
      container.id = 'studies-list';
      container.className = 'list-view';
      console.log('UI: Created list view container');
    } else {
      container.id = 'studies-grid';
      container.className = 'grid-view';
      console.log('UI: Created grid view container');
    }
    
    resultsContainer.appendChild(container);
    console.log(`UI: Appended new ${viewMode} container to results`);
    
    // Update the toggle button
    updateViewToggleButton(viewMode);
    
    // Re-display the studies with the current view
    updateResults();
  } catch (error) {
    console.error('UI: Error updating view mode:', error);
  }
}

/**
 * Updates the view toggle buttons to reflect the current view mode
 * @param {string} viewMode - Current view mode ('card' or 'list') 
 */
function updateViewToggleButton(viewMode) {
  try {
    const listViewBtn = document.getElementById('list-view-btn');
    const cardViewBtn = document.getElementById('card-view-btn');
    
    if (!listViewBtn || !cardViewBtn) {
      console.warn('UI: View toggle buttons not found');
      return;
    }
    
    if (viewMode === 'list') {
      // We're in list view
      listViewBtn.classList.add('active');
      cardViewBtn.classList.remove('active');
    } else {
      // We're in card view
      cardViewBtn.classList.add('active');
      listViewBtn.classList.remove('active');
    }
  } catch (error) {
    console.error('UI: Error updating view toggle buttons:', error);
  }
}

/**
 * Updates the displayed results based on current filters and search query
 * @returns {Promise<void>}
 */
async function updateResults() {
  try {
    console.log('UI: Updating results based on filters and search query');
    
    // Show a loading indicator if it exists
    const loadingIndicator = document.getElementById('loading-indicator');
    if (loadingIndicator) {
      loadingIndicator.style.display = 'block';
    }
    
    // Get all studies
    const allStudies = AppState.getStudies();
    console.log(`UI: Starting with ${allStudies ? allStudies.length : 0} total studies in AppState`);
    
    if (!allStudies || !Array.isArray(allStudies) || allStudies.length === 0) {
      console.error('UI: No studies data available in AppState');
      displayError('No studies data available. Please try refreshing the page.');
      if (loadingIndicator) {
        loadingIndicator.style.display = 'none';
      }
      return;
    }
    
    // Get search query from AppState
    const searchQuery = AppState.getSearchQuery() || '';
    console.log(`UI: Using search query: "${searchQuery}"`);
    
    // Get category filters from AppState
    const categoryFilters = AppState.getCategoryFilters();
    console.log(`UI: Using ${categoryFilters.length} category filters`);
    
    // Import search functions from search-engine
    const { search, filterStudies } = await import('./search-engine.js');
    
    // First, search for studies matching the query
    let searchResults = allStudies;
    if (searchQuery) {
      console.log(`UI: Searching for: "${searchQuery}"`);
      try {
        searchResults = await search(searchQuery, allStudies);
        console.log(`UI: Search returned ${searchResults.length} results`);
      } catch (searchError) {
        console.error('UI: Error during search:', searchError);
        // Fall back to all studies on search error
        searchResults = allStudies;
      }
    }
    
    // Then filter by category if needed
    let finalResults = searchResults;
    if (categoryFilters && categoryFilters.length > 0) {
      console.log('UI: Applying category filters');
      finalResults = filterStudies(searchResults);
      console.log(`UI: After filtering, ${finalResults.length} studies remain`);
    }
    
    // Update active filters UI
    updateActiveFiltersDisplay();
    
    // Hide loading indicator
    if (loadingIndicator) {
      loadingIndicator.style.display = 'none';
    }
    
    // Update results display
    console.log(`UI: Displaying ${finalResults.length} studies`);
    displayStudies(finalResults);
    
  } catch (error) {
    console.error('UI: Error updating results:', error);
    displayError('An error occurred while updating results. Please try refreshing the page.');
    
    // Hide loading indicator
    const loadingIndicator = document.getElementById('loading-indicator');
    if (loadingIndicator) {
      loadingIndicator.style.display = 'none';
    }
  }
}

/**
 * Displays studies in the results container
 * @param {Array} studies - Array of study objects to display
 * @param {boolean} forceDisplay - Whether to force display even if studies appear empty
 */
function displayStudies(studies, forceDisplay = false) {
  try {
    console.log(`UI: displayStudies called with ${studies ? studies.length : 'no'} studies. forceDisplay=${forceDisplay}`);
    
    // Inspect what we received for debugging
    if (studies && studies.length > 0) {
      console.log('UI: First study sample:', JSON.stringify(studies[0]).substring(0, 200));
      console.log('UI: Study categories type:', typeof studies[0].categories);
      console.log('UI: Study categories value:', studies[0].categories);
    } else {
      console.log('UI: No studies received or empty array');
    }
    
    // Use a safe copy of studies to avoid issues
    const safeStudies = studies || [];
    
    // Clear results container
    const resultsContainer = document.getElementById('results-container');
    if (!resultsContainer) {
      console.error('UI: Results container not found in the DOM');
      return;
    }
    
    resultsContainer.innerHTML = '';
    
    // If no studies to display and not forcing display, show message
    if (safeStudies.length === 0 && !forceDisplay) {
      console.log('UI: No studies to display');
      resultsContainer.innerHTML = '<div class="no-results">No studies match your filters. Try adjusting your search criteria.</div>';
      console.log('UI: Displayed "No studies match your filters" message');
      return;
    }
    
    // Get current view mode
    const viewMode = AppState.getViewMode();
    console.log(`UI: Displaying studies in ${viewMode} view`);
    
    // Process each study
    let displayCount = 0;
    
    // Create and append study elements
    if (viewMode === 'card') {
      resultsContainer.classList.add('card-view');
      resultsContainer.classList.remove('list-view');
      
      // Create a dedicated grid container for the cards
      const studiesGrid = document.createElement('div');
      studiesGrid.id = 'studies-grid';
      resultsContainer.innerHTML = ''; // Clear the container first
      resultsContainer.appendChild(studiesGrid);
      
      safeStudies.forEach((study, index) => {
        try {
          if (!study) {
            console.warn(`UI: Study at index ${index} is null or undefined`);
            return;
          }
          
          // Ensure study has required properties
          study.title = study.title || 'Untitled Study';
          study.description = study.description || '';
          study.organization = study.organization || 'Unknown';
          study.date = study.date || '';
          
          // Normalize categories if needed
          if (!study.categories || !Array.isArray(study.categories)) {
            if (typeof study.categories === 'string') {
              study.categories = study.categories.split('|').map(c => c.trim()).filter(c => c);
            } else {
              study.categories = ['Uncategorized'];
            }
          }
          
          const card = createStudyCard(study);
          studiesGrid.appendChild(card);
          displayCount++;
        } catch (cardError) {
          console.error(`UI: Error creating study card for index ${index}:`, cardError, study);
        }
      });
    } else {
      resultsContainer.classList.add('list-view');
      resultsContainer.classList.remove('card-view');
      
      safeStudies.forEach((study, index) => {
        try {
          if (!study) {
            console.warn(`UI: Study at index ${index} is null or undefined`);
            return;
          }
          
          // Ensure study has required properties
          study.title = study.title || 'Untitled Study';
          study.description = study.description || '';
          study.organization = study.organization || 'Unknown';
          study.date = study.date || '';
          
          // Normalize categories if needed
          if (!study.categories || !Array.isArray(study.categories)) {
            if (typeof study.categories === 'string') {
              study.categories = study.categories.split('|').map(c => c.trim()).filter(c => c);
            } else {
              study.categories = ['Uncategorized'];
            }
          }
          
          const row = createStudyRow(study);
          resultsContainer.appendChild(row);
          displayCount++;
        } catch (rowError) {
          console.error(`UI: Error creating study row for index ${index}:`, rowError, study);
        }
      });
    }
    
    console.log(`UI: Successfully displayed ${displayCount} of ${safeStudies.length} studies in ${viewMode} view`);
    
    // If no studies were actually displayed, show a message
    if (displayCount === 0 && safeStudies.length > 0) {
      resultsContainer.innerHTML = '<div class="no-results">Error displaying studies. Check console for details.</div>';
    }
  } catch (error) {
    console.error('UI: Error in displayStudies:', error);
    const resultsContainer = document.getElementById('results-container');
    if (resultsContainer) {
      resultsContainer.innerHTML = '<div class="no-results">An error occurred while displaying studies. Check the console for details.</div>';
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

/**
 * Returns HTML for category badges
 * @param {Object} study - Study object
 * @returns {string} HTML string for category badges
 */
function getCategoryBadges(study) {
  try {
    if (!study || !study.categories) {
      return '';
    }
    
    const categoriesArr = Array.isArray(study.categories) 
      ? study.categories 
      : study.categories.split('|');
    
    if (categoriesArr.length === 0) {
      return '';
    }
    
    console.log(`UI: Creating badges for ${categoriesArr.length} categories`);
    
    return categoriesArr.map(category => {
      const safeCategory = category.trim();
      const categoryClass = getDomainClass({ categories: safeCategory });
      return `<span class="category-badge ${categoryClass}">${safeCategory}</span>`;
    }).join('');
  } catch (error) {
    console.error('UI: Error creating category badges:', error);
    return '';
  }
}

/**
 * Returns CSS class for domain-based color coding
 * @param {Object} study - Study object
 * @returns {string} CSS class name
 */
function getDomainClass(study) {
  try {
    if (!study || !study.categories) {
      console.log('UI: No categories found for domain class');
      return 'domain-default';
    }
    
    const categories = Array.isArray(study.categories) 
      ? study.categories 
      : study.categories.split('|');
    
    const primaryCategory = categories[0]?.trim() || '';
    console.log(`UI: Finding domain class for primary category: ${primaryCategory}`);
    
    // Map category to domain class
    if (primaryCategory.includes('AI Use') || 
        primaryCategory.includes('Perception') || 
        primaryCategory === 'AI Use and Perceptions' ||
        primaryCategory === 'Current AI Use and Perceptions in PK 12 & HigherEd') {
      return 'domain-pk12'; // Blue color
    } 
    else if (primaryCategory.includes('Workforce') || 
             primaryCategory === 'Workforce Trends' ||
             primaryCategory.toLowerCase().includes('jobs') ||
             primaryCategory.toLowerCase().includes('work')) {
      return 'domain-workforce'; // Orange color (was previously green)
    }
    else if (primaryCategory.includes('Performance') || 
             primaryCategory.includes('Student Data') || 
             primaryCategory === 'Student Performance Data') {
      return 'domain-performance'; // Green color (was previously orange)
    }
    else if (primaryCategory.includes('Guidelines') || 
             primaryCategory.includes('Training') || 
             primaryCategory.includes('Policies') || 
             primaryCategory === 'Guidelines, Training, Policies' ||
             primaryCategory === 'Current State of Guidelines, Training, and Policies') {
      return 'domain-guidelines'; // Red color
    }
    
    console.log(`UI: No matching domain found for "${primaryCategory}", using default`);
    return 'domain-default';
  } catch (error) {
    console.error('UI: Error determining domain class:', error);
    return 'domain-default';
  }
}

export { 
  setupEventListeners,
  displayStudies,
  populateCategoryFilters,
  loadFiltersFromURL,
  updateResults,
  updateViewMode,
  createStudyCard,
  createStudyRow,
  getDomainClass,
  getCategoryBadges,
  displayError,
  updateActiveFiltersDisplay
};