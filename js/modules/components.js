/**
 * UI Components for the GenAI Studies Explorer
 * Provides reusable templates for UI elements
 * Version 2.0 - Fixed export issue
 */

import AppState from './state.js';

/**
 * Create a study card component
 * @param {Object} study - Study data object
 * @returns {string} HTML template for the study card
 */
function createStudyCard(study) {
  try {
    console.log(`COMPONENT: Creating study card for study ID: ${study?.id || 'unknown'}`);
    
    // Handle undefined study data
    if (!study) {
      console.error('COMPONENT: Cannot create study card - study is undefined');
      const errorCard = document.createElement('div');
      errorCard.className = 'study-card error';
      errorCard.innerHTML = '<p>Error: Could not display study (data unavailable)</p>';
      return errorCard;
    }
    
    // Create safe copy with guaranteed structure
    const safeStudy = {
      id: study.id || 'unknown',
      title: study.title || 'Untitled Study',
      url: study.url || '#',
      organization: study.organization || 'Unknown Organization',
      date: study.date || '',
      description: study.description || '',
      categories: Array.isArray(study.categories) ? [...study.categories] : ['Uncategorized'],
      metadata: {
        subjects: [],
        year: '',
        authors: [],
        ...(study.metadata || {})
      }
    };
    
    // Ensure categories is never empty
    if (!safeStudy.categories.length) {
      safeStudy.categories = ['Uncategorized'];
    }
    
    // Ensure subjects is valid
    if (!Array.isArray(safeStudy.metadata.subjects)) {
      safeStudy.metadata.subjects = [];
    }
    
    // Get primary category safely
    const primaryCategory = safeStudy.categories[0] || 'Uncategorized';
    
    // Create card element
    const card = document.createElement('div');
    card.className = 'study-card';
    card.setAttribute('data-id', safeStudy.id);
    card.setAttribute('data-primary-category', primaryCategory);
    
    // Add domain-specific class for styling
    const domainClass = primaryCategory
      .replace(/\s+/g, '-')
      .replace(/&/g, 'and')
      .toLowerCase();
    card.classList.add(`domain-${domainClass}`);
    
    // Add color accent based on domain category
    let colorAccent = '';
    if (primaryCategory === 'Current AI Use and Perceptions in PK 12 & HigherEd' || 
        primaryCategory === 'AI Use and Perceptions') {
      colorAccent = 'domain-pk12';
    } else if (primaryCategory === 'Current State of Guidelines, Training, and Policies' || 
               primaryCategory === 'Guidelines, Training, Policies') {
      colorAccent = 'domain-guidelines';
    } else if (primaryCategory === 'Student Performance Data') {
      colorAccent = 'domain-performance';
    } else if (primaryCategory === 'Workforce Trends') {
      colorAccent = 'domain-workforce';
    }
    
    if (colorAccent) {
      card.classList.add(colorAccent);
    }
    
    // Format the date if available
    let dateDisplay = '';
    if (safeStudy.date) {
      try {
        // Try to parse and format the date
        const dateObj = new Date(safeStudy.date);
        if (!isNaN(dateObj.getTime())) {
          dateDisplay = `<div class="study-date">${dateObj.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short' 
          })}</div>`;
        } else {
          // If date parsing fails, use the original string
          dateDisplay = `<div class="study-date">${safeStudy.date}</div>`;
        }
      } catch (e) {
        console.warn(`COMPONENT: Error formatting date for study ${safeStudy.id}:`, e);
        dateDisplay = `<div class="study-date">${safeStudy.date}</div>`;
      }
    }

    // Get subjects as formatted tags
    let subjectTags = '';
    if (Array.isArray(safeStudy.metadata.subjects) && safeStudy.metadata.subjects.length > 0) {
      const tags = safeStudy.metadata.subjects
        .filter(subject => subject && typeof subject === 'string')
        .map(subject => `<span class="subject-tag">${subject}</span>`)
        .join('');
      
      if (tags) {
        subjectTags = `<div class="subject-tags">${tags}</div>`;
      }
    }
    
    // Create trimmed description (with fallback if undefined)
    const description = safeStudy.description || 'No description available';
    
    // Build card content
    card.innerHTML = `
      <div class="study-header">
        <div class="category-badge" title="${primaryCategory}">
          ${getCategoryShortLabel(primaryCategory)}
        </div>
        ${dateDisplay}
      </div>
      <h3 class="study-title">${safeStudy.title}</h3>
      <div class="study-org">${safeStudy.organization}</div>
      <div class="study-desc">${description}</div>
      ${subjectTags}
      <div class="study-footer">
        <a href="${safeStudy.url}" class="view-study-btn" target="_blank" title="${safeStudy.url}">View Study</a>
      </div>
    `;
    
    return card;
  } catch (error) {
    console.error('COMPONENT: Error creating study card:', error);
    // Return a fallback error card
    const errorCard = document.createElement('div');
    errorCard.className = 'study-card error';
    errorCard.innerHTML = `<p>Error displaying study: ${error.message}</p>`;
    return errorCard;
  }
}

/**
 * Generate HTML for additional metadata tags
 * @param {Object} study - Study data object
 * @returns {string} HTML for metadata tags
 */
function getMetadataTags(study) {
  let tags = '';
  
  // Add subject metadata if available
  if (study.metadata && study.metadata.subjects) {
    const subjects = Array.isArray(study.metadata.subjects) 
      ? study.metadata.subjects 
      : [study.metadata.subjects];
      
    subjects.forEach(subject => {
      tags += `<span class="study-tag">${formatMetadataValue(subject)}</span>`;
    });
  }
  
  return tags;
}

/**
 * Create a category filter component
 * @param {string} category - Category name
 * @param {boolean} isActive - Whether the filter is active
 * @returns {string} HTML template for the category filter
 */
function createCategoryFilter(category, isActive = false) {
  return `
    <span class="category-filter ${isActive ? 'active' : ''}" 
          data-category="${category}">
      ${category}
    </span>
  `;
}

/**
 * Create a subject filter component
 * @param {string} subject - Subject name
 * @param {boolean} isActive - Whether the filter is active
 * @returns {string} HTML template for the subject filter
 */
function createSubjectFilter(subject, isActive = false) {
  return `
    <span class="metadata-filter ${isActive ? 'active' : ''}" 
          data-type="subjects" 
          data-value="${subject}">
      ${formatMetadataValue(subject)}
    </span>
  `;
}

/**
 * Create a toast notification component
 * @param {string} message - Toast message
 * @returns {string} HTML template for the toast
 */
function createToast(message) {
  return `<div class="toast">${message}</div>`;
}

/**
 * Create a no results component
 * @param {string} message - Message to display
 * @returns {string} HTML template for no results
 */
function createNoResults(message = 'No studies match your search criteria') {
  return `<p class="placeholder-text">${message}</p>`;
}

/**
 * Format date for display
 * @param {string} dateString - Date string
 * @returns {string} Formatted date
 */
function formatDate(dateString) {
  const date = new Date(dateString);
  const options = { year: 'numeric', month: 'long' };
  return date.toLocaleDateString('en-US', options);
}

/**
 * Format metadata value for display
 * @param {string} value - Metadata value
 * @returns {string} Formatted value
 */
function formatMetadataValue(value) {
  // Convert snake_case to Title Case
  if (typeof value === 'string') {
    return value
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }
  return value;
}

/**
 * Creates a filter chip element
 * @param {string} label - The filter label
 * @param {string} type - The filter type (category, subject, etc.)
 * @param {Function} onRemove - Callback for when the filter is removed
 * @returns {HTMLElement} The filter chip element
 */
function createFilterChip(label, type, onRemove) {
  try {
    if (!label || typeof label !== 'string') {
      console.warn('COMPONENT: Cannot create filter chip - invalid label');
      return null;
    }
    
    const chip = document.createElement('div');
    chip.className = `filter-chip ${type}-filter`;
    chip.setAttribute('data-filter', label);
    chip.setAttribute('data-type', type);
    
    chip.innerHTML = `
      <span class="filter-label">${label}</span>
      <button class="remove-filter" aria-label="Remove ${label} filter">×</button>
    `;
    
    const removeButton = chip.querySelector('.remove-filter');
    if (removeButton && typeof onRemove === 'function') {
      removeButton.addEventListener('click', () => onRemove(label, type));
    }
    
    return chip;
  } catch (error) {
    console.error('COMPONENT: Error creating filter chip:', error);
    return null;
  }
}

/**
 * Gets a short label for the category
 * @param {string} category - Full category name
 * @returns {string} Short label for the category
 */
function getCategoryShortLabel(category) {
  if (category === 'AI Use and Perceptions' || 
      category === 'Current AI Use and Perceptions in PK 12 & HigherEd') {
    return 'Use';
  } else if (category === 'Guidelines, Training, Policies' || 
             category === 'Current State of Guidelines, Training, and Policies') {
    return 'Policy';
  } else if (category === 'Student Performance Data') {
    return 'Data';
  } else if (category === 'Workforce Trends') {
    return 'Work';
  } else {
    return '';
  }
}

// Single export statement to avoid duplicates
export {
  createStudyCard,
  createCategoryFilter,
  createSubjectFilter,
  createToast,
  createNoResults,
  formatDate,
  formatMetadataValue,
  createFilterChip
}; 