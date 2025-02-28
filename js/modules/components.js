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
    const domainClass = getDomainClass([primaryCategory]);
    if (domainClass) {
        card.classList.add(domainClass);
        console.log(`Adding domain class ${domainClass} to card for category: ${primaryCategory}`);
    }
    
    // Create and add color accent based on domain category
    let colorAccent = '';
    if (primaryCategory === 'Current AI Use and Perceptions in PK 12 & HigherEd' || 
        primaryCategory === 'AI Use and Perceptions' || 
        primaryCategory.includes('AI Use') || 
        primaryCategory.includes('AI Perceptions')) {
      colorAccent = 'domain-pk12';
    } else if (primaryCategory === 'Current State of Guidelines, Training, and Policies' || 
               primaryCategory === 'Guidelines, Training, Policies' ||
               primaryCategory.includes('Guidelines') || 
               primaryCategory.includes('Training') || 
               primaryCategory.includes('Policies')) {
      colorAccent = 'domain-guidelines';
    } else if (primaryCategory === 'Student Performance Data' ||
               primaryCategory.includes('Performance') ||
               primaryCategory.includes('Student Data')) {
      colorAccent = 'domain-performance';
    } else if (primaryCategory === 'Workforce Trends' ||
               primaryCategory.includes('Workforce')) {
      colorAccent = 'domain-workforce';
    }
    
    if (colorAccent) {
      card.classList.add(colorAccent);
      console.log(`Adding color accent ${colorAccent} to card for category: ${primaryCategory}`);
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

/**
 * Creates a study row component for the list view
 * @param {Object} study - Study data object
 * @returns {HTMLElement} - Study row element
 */
function createStudyRow(study) {
  try {
    if (!study) {
      console.error('Cannot create study row: study data is undefined');
      return null;
    }
    
    // Extract fields with default values for safety
    const {
      id = 'unknown',
      title = 'Untitled Study',
      url = '#',
      categories = []
    } = study;
    
    // Create the row element
    const row = document.createElement('div');
    row.className = 'study-row';
    row.dataset.id = id;
    
    // Determine color based on the first category
    const domainClass = getDomainClass(categories);
    if (domainClass) {
      row.classList.add(domainClass);
      console.log(`Adding domain class ${domainClass} to row for category:`, categories[0]);
    }
    
    let colorClass = 'var(--color-primary)';
    
    if (domainClass === 'domain-pk12') {
      colorClass = 'var(--color-domain-pk12)';
    } else if (domainClass === 'domain-guidelines') {
      colorClass = 'var(--color-domain-guidelines)';
    } else if (domainClass === 'domain-performance') {
      colorClass = 'var(--color-domain-performance)';
    } else if (domainClass === 'domain-workforce') {
      colorClass = 'var(--color-domain-workforce)';
    }
    
    // Create row HTML structure
    row.innerHTML = `
      <div class="color-indicator" style="background-color: ${colorClass};"></div>
      <h3 class="row-title">${title}</h3>
      <div class="row-action">
        <a href="${url}" class="view-study-row-btn" target="_blank" rel="noopener">View Study</a>
      </div>
    `;
    
    return row;
  } catch (error) {
    console.error('Error creating study row:', error);
    return null;
  }
}

/**
 * Creates a modal content element with study details
 * @param {Object} study - Study data object
 * @returns {DocumentFragment} - Document fragment with modal content
 */
function createStudyModalContent(study) {
  try {
    if (!study) {
      console.error('Cannot create modal content: study data is undefined');
      return document.createDocumentFragment();
    }
    
    // Extract fields with default values for safety
    const {
      title = 'Untitled Study',
      organization = 'Unknown Organization',
      date = '',
      description = 'No description available',
      url = '#',
      categories = []
    } = study;
    
    // Create document fragment
    const fragment = document.createDocumentFragment();
    
    // Create header element
    const header = document.createElement('div');
    header.className = 'modal-header';
    
    // Create title element
    const titleEl = document.createElement('h2');
    titleEl.className = 'modal-title';
    titleEl.textContent = title;
    header.appendChild(titleEl);
    
    // Create metadata section
    const metaSection = document.createElement('div');
    metaSection.className = 'modal-meta';
    
    if (organization) {
      const orgEl = document.createElement('p');
      orgEl.className = 'modal-organization';
      orgEl.textContent = `Organization: ${organization}`;
      metaSection.appendChild(orgEl);
    }
    
    if (date) {
      const dateEl = document.createElement('p');
      dateEl.className = 'modal-date';
      dateEl.textContent = `Date: ${date}`;
      metaSection.appendChild(dateEl);
    }
    
    if (categories && categories.length > 0) {
      const catEl = document.createElement('p');
      catEl.className = 'modal-categories';
      catEl.textContent = `Categories: ${categories.join(', ')}`;
      metaSection.appendChild(catEl);
    }
    
    // Create description section
    const descSection = document.createElement('div');
    descSection.className = 'modal-description';
    
    const descTitle = document.createElement('h3');
    descTitle.textContent = 'Description';
    descSection.appendChild(descTitle);
    
    const descText = document.createElement('p');
    descText.textContent = description;
    descSection.appendChild(descText);
    
    // Create action section
    const actionSection = document.createElement('div');
    actionSection.className = 'modal-actions';
    
    const viewLink = document.createElement('a');
    viewLink.href = url;
    viewLink.className = 'view-study-btn';
    viewLink.target = '_blank';
    viewLink.rel = 'noopener';
    viewLink.textContent = 'View Study';
    actionSection.appendChild(viewLink);
    
    // Append all sections to fragment
    fragment.appendChild(header);
    fragment.appendChild(metaSection);
    fragment.appendChild(descSection);
    fragment.appendChild(actionSection);
    
    return fragment;
  } catch (error) {
    console.error('Error creating modal content:', error);
    return document.createDocumentFragment();
  }
}

/**
 * Get the domain class based on categories
 * @param {Array} categories - Array of categories
 * @returns {string} - Domain class
 */
function getDomainClass(categories) {
  if (!categories || categories.length === 0) return '';
  
  // Get the first category
  const category = categories[0];
  
  // Map categories to domain classes with more comprehensive matching
  // This handles both the button filter names and the actual data category names
  if (category === 'AI Use and Perceptions' || 
      category === 'Current AI Use and Perceptions in PK 12 & HigherEd' ||
      category.includes('AI Use') || 
      category.includes('AI Perceptions')) {
    return 'domain-pk12';
  } else if (category === 'Guidelines, Training, Policies' || 
             category === 'Current State of Guidelines, Training, and Policies' ||
             category.includes('Guidelines') || 
             category.includes('Training') || 
             category.includes('Policies')) {
    return 'domain-guidelines';
  } else if (category === 'Student Performance Data' ||
             category.includes('Performance') ||
             category.includes('Student Data')) {
    return 'domain-performance';
  } else if (category === 'Workforce Trends' ||
             category.includes('Workforce')) {
    return 'domain-workforce';
  }
  
  // Add domain- prefix to the category if no match found
  // This provides a fallback for any category that doesn't match the explicit mappings
  return 'domain-' + category.toLowerCase().replace(/\s+/g, '-').replace(/[&,]/g, '');
}

/**
 * Truncate text to a specified length
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string} - Truncated text
 */
function truncateText(text, maxLength) {
  if (!text || typeof text !== 'string') return '';
  
  if (text.length <= maxLength) return text;
  
  return text.substring(0, maxLength) + '...';
}

// Export components
export { 
  createStudyCard,
  createStudyRow,
  createStudyModalContent,
  createFilterChip,
  getCategoryShortLabel,
  getDomainClass,
  truncateText
}; 