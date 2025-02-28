/**
 * Search and filter functionality for the GenAI Studies Explorer
 */

// Global variables
let studiesData = [];
let fuse = null;
let activeFilters = {
    categories: new Set(),
    // PARKING LOT: Date Range and other metadata filters
    /*
    dateRange: {
        start: null,
        end: null
    },
    metadata: {
        complexity: new Set(),
        region: new Set(),
        subjects: new Set()
    }
    */
    metadata: {
        subjects: new Set()
    }
};

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
    // Load the studies data
    studiesData = await window.csvUtils.loadStudiesData();
    
    // Initialize Fuse.js for fuzzy search
    initializeFuseSearch();
    
    // Initialize UI elements
    setupUI();
    
    // Load filters from URL if present
    loadFiltersFromURL();
    
    // Display all studies initially
    displayStudies(studiesData);
    
    // Populate filters
    populateCategoryFilters();
    // PARKING LOT: Removed populateMetadataFilters()
    populateSubjectFilters();
});

// Initialize Fuse.js with the studies data
function initializeFuseSearch() {
    const options = {
        keys: [
            { name: 'title', weight: 2 },
            { name: 'key_findings', weight: 1.5 },
            { name: 'organization', weight: 1 },
            { name: 'categories', weight: 1 }
        ],
        threshold: 0.3,
        includeScore: true,
        ignoreLocation: true
    };
    
    fuse = new Fuse(studiesData, options);
}

// Set up event listeners for UI elements
function setupUI() {
    // Search input
    const searchInput = document.getElementById('search-input');
    const searchButton = document.getElementById('search-button');
    
    searchInput.addEventListener('input', performSearch);
    searchButton.addEventListener('click', performSearch);
    
    // PARKING LOT: Date filters
    /*
    const startDateInput = document.getElementById('start-date');
    const endDateInput = document.getElementById('end-date');
    
    if (startDateInput && endDateInput) {
        startDateInput.addEventListener('change', updateDateFilter);
        endDateInput.addEventListener('change', updateDateFilter);
    }
    */
    
    // Share button
    const shareButton = document.getElementById('share-button');
    shareButton.addEventListener('click', createShareableLink);
}

// Perform search based on current input and filters
function performSearch() {
    const searchInput = document.getElementById('search-input');
    const query = searchInput.value.trim();
    
    let results = [];
    
    if (query.length > 0) {
        // Use Fuse.js for search
        const searchResults = fuse.search(query);
        results = searchResults.map(result => result.item);
    } else {
        // Show all studies if no search query
        results = studiesData;
    }
    
    // Apply filters to results
    results = filterResults(results);
    
    // Display filtered results
    displayStudies(results);
    
    // Update URL with current search and filters
    updateURL();
}

// Filter results based on active filters
function filterResults(studies) {
    return studies.filter(study => {
        // Filter by categories
        if (activeFilters.categories.size > 0) {
            const hasCategory = study.categories.some(category => 
                activeFilters.categories.has(category)
            );
            if (!hasCategory) return false;
        }
        
        // PARKING LOT: Date filtering
        /*
        // Filter by date
        if (activeFilters.dateRange.start || activeFilters.dateRange.end) {
            const studyDate = new Date(study.date);
            
            if (activeFilters.dateRange.start && studyDate < activeFilters.dateRange.start) {
                return false;
            }
            
            if (activeFilters.dateRange.end) {
                const endDate = new Date(activeFilters.dateRange.end);
                endDate.setMonth(endDate.getMonth() + 1);
                if (studyDate >= endDate) {
                    return false;
                }
            }
        }
        */
        
        // Filter by subject metadata
        if (activeFilters.metadata.subjects.size > 0) {
            const metadata = study.metadata || {};
            const subjects = metadata.subjects;
            
            if (!subjects) return false;
            
            // Handle array values or comma-separated subjects
            let subjectValues = [];
            if (Array.isArray(subjects)) {
                subjectValues = subjects;
            } else if (typeof subjects === 'string') {
                subjectValues = subjects.split(',').map(s => s.trim());
            } else {
                subjectValues = [subjects];
            }
            
            // Check if any of the study subjects match the selected subjects
            const hasSubject = subjectValues.some(val => 
                activeFilters.metadata.subjects.has(val)
            );
            
            if (!hasSubject) return false;
        }
        
        return true;
    });
}

// PARKING LOT: Date filter update function
/*
// Update date filter based on input
function updateDateFilter() {
    const startDateInput = document.getElementById('start-date');
    const endDateInput = document.getElementById('end-date');
    
    if (startDateInput.value) {
        activeFilters.dateRange.start = new Date(startDateInput.value);
    } else {
        activeFilters.dateRange.start = null;
    }
    
    if (endDateInput.value) {
        activeFilters.dateRange.end = new Date(endDateInput.value);
    } else {
        activeFilters.dateRange.end = null;
    }
    
    performSearch();
}
*/

// Toggle category filter
function toggleCategoryFilter(category) {
    if (activeFilters.categories.has(category)) {
        activeFilters.categories.delete(category);
    } else {
        activeFilters.categories.add(category);
    }
    
    // Update UI
    document.querySelectorAll('.category-filter').forEach(element => {
        if (element.dataset.category === category) {
            element.classList.toggle('active', activeFilters.categories.has(category));
        }
    });
    
    performSearch();
}

// Toggle subject filter
function toggleSubjectFilter(subject) {
    if (activeFilters.metadata.subjects.has(subject)) {
        activeFilters.metadata.subjects.delete(subject);
    } else {
        activeFilters.metadata.subjects.add(subject);
    }
    
    // Update UI
    document.querySelectorAll('.metadata-filter[data-type="subjects"]').forEach(element => {
        if (element.dataset.value === subject) {
            element.classList.toggle('active', activeFilters.metadata.subjects.has(subject));
        }
    });
    
    performSearch();
}

// Get unique categories from studies
function getUniqueCategories() {
    const categories = new Set();
    
    studiesData.forEach(study => {
        study.categories.forEach(category => {
            categories.add(category);
        });
    });
    
    return Array.from(categories).sort();
}

// Get unique subject values from studies
function getUniqueSubjects() {
    const subjects = new Set();
    
    studiesData.forEach(study => {
        if (study.metadata && study.metadata.subjects) {
            const metadataValue = study.metadata.subjects;
            
            if (Array.isArray(metadataValue)) {
                metadataValue.forEach(val => subjects.add(val));
            } else if (typeof metadataValue === 'string') {
                metadataValue.split(',').forEach(val => subjects.add(val.trim()));
            } else {
                subjects.add(metadataValue);
            }
        }
    });
    
    return Array.from(subjects).sort();
}

// Populate category filters
function populateCategoryFilters() {
    const categoryFiltersContainer = document.getElementById('category-filters');
    const categories = getUniqueCategories();
    
    categories.forEach(category => {
        const filterElement = document.createElement('span');
        filterElement.className = 'category-filter';
        filterElement.dataset.category = category;
        filterElement.textContent = category;
        
        // Check if this category is active from URL parameters
        if (activeFilters.categories.has(category)) {
            filterElement.classList.add('active');
        }
        
        filterElement.addEventListener('click', () => {
            toggleCategoryFilter(category);
        });
        
        categoryFiltersContainer.appendChild(filterElement);
    });
}

// Populate subject filters
function populateSubjectFilters() {
    const subjectFiltersContainer = document.getElementById('subject-filters');
    const subjects = getUniqueSubjects();
    
    subjects.forEach(subject => {
        const filterElement = document.createElement('span');
        filterElement.className = 'metadata-filter';
        filterElement.dataset.type = 'subjects';
        filterElement.dataset.value = subject;
        filterElement.textContent = formatMetadataValue(subject);
        
        // Check if this subject is active from URL parameters
        if (activeFilters.metadata.subjects.has(subject)) {
            filterElement.classList.add('active');
        }
        
        filterElement.addEventListener('click', () => {
            toggleSubjectFilter(subject);
        });
        
        subjectFiltersContainer.appendChild(filterElement);
    });
}

// PARKING LOT: Full metadata filters populating
/*
// Populate metadata filters
function populateMetadataFilters() {
    // Complexity filters
    populateMetadataFilterType('complexity', 'complexity-filters');
    
    // Region filters
    populateMetadataFilterType('region', 'region-filters');
    
    // Subject filters
    populateMetadataFilterType('subjects', 'subject-filters');
}

// Helper function to populate specific metadata filter type
function populateMetadataFilterType(type, containerId) {
    const filterContainer = document.getElementById(containerId);
    if (!filterContainer) return;
    
    const values = getUniqueMetadataValues(type);
    
    values.forEach(value => {
        const filterElement = document.createElement('span');
        filterElement.className = 'metadata-filter';
        filterElement.dataset.type = type;
        filterElement.dataset.value = value;
        filterElement.textContent = formatMetadataValue(value);
        
        // Check if this value is active from URL parameters
        if (activeFilters.metadata[type] && activeFilters.metadata[type].has(value)) {
            filterElement.classList.add('active');
        }
        
        filterElement.addEventListener('click', () => {
            toggleMetadataFilter(type, value);
        });
        
        filterContainer.appendChild(filterElement);
    });
}
*/

// Format metadata values for display
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

// Display studies in the results container
function displayStudies(studies) {
    const resultsContainer = document.getElementById('results-container');
    
    // Clear existing results
    resultsContainer.innerHTML = '';
    
    if (studies.length === 0) {
        const noResults = document.createElement('p');
        noResults.className = 'placeholder-text';
        noResults.textContent = 'No studies match your search criteria';
        resultsContainer.appendChild(noResults);
        return;
    }
    
    // Create study cards
    studies.forEach(study => {
        const studyCard = document.createElement('div');
        studyCard.className = 'study-card';
        
        // Study title with link
        const titleElement = document.createElement('h3');
        titleElement.className = 'study-title';
        
        const titleLink = document.createElement('a');
        titleLink.href = study.url || '#';
        titleLink.textContent = study.title;
        titleLink.target = '_blank';
        titleElement.appendChild(titleLink);
        
        // Study metadata
        const metaElement = document.createElement('div');
        metaElement.className = 'study-meta';
        
        // Organization and date
        const orgDate = document.createElement('p');
        orgDate.innerHTML = `<strong>${study.organization}</strong> • ${formatDate(study.date)}`;
        
        // Categories
        const categoriesElement = document.createElement('div');
        categoriesElement.className = 'study-categories';
        
        study.categories.forEach(category => {
            const categorySpan = document.createElement('span');
            categorySpan.className = 'study-category';
            categorySpan.textContent = category;
            categoriesElement.appendChild(categorySpan);
        });
        
        // Study findings
        const findingsElement = document.createElement('p');
        findingsElement.className = 'study-findings';
        findingsElement.textContent = study.key_findings;
        
        // Assemble the card
        metaElement.appendChild(orgDate);
        metaElement.appendChild(categoriesElement);
        
        studyCard.appendChild(titleElement);
        studyCard.appendChild(metaElement);
        studyCard.appendChild(findingsElement);
        
        resultsContainer.appendChild(studyCard);
    });
}

// Format date for display
function formatDate(dateString) {
    const date = new Date(dateString);
    const options = { year: 'numeric', month: 'long' };
    return date.toLocaleDateString('en-US', options);
}

// Update URL with current search and filters
function updateURL() {
    const params = new URLSearchParams();
    
    // Add search query
    const searchInput = document.getElementById('search-input');
    if (searchInput.value.trim()) {
        params.append('q', searchInput.value.trim());
    }
    
    // Add categories
    activeFilters.categories.forEach(category => {
        params.append('category', category);
    });
    
    // PARKING LOT: Date range parameters
    /*
    // Add date range
    if (activeFilters.dateRange.start) {
        params.append('startDate', activeFilters.dateRange.start.toISOString().substring(0, 7));
    }
    
    if (activeFilters.dateRange.end) {
        params.append('endDate', activeFilters.dateRange.end.toISOString().substring(0, 7));
    }
    */
    
    // Add subject filters
    activeFilters.metadata.subjects.forEach(value => {
        params.append('subjects', value);
    });
    
    // Update URL without reloading the page
    const newUrl = window.location.pathname + (params.toString() ? '?' + params.toString() : '');
    window.history.pushState({ path: newUrl }, '', newUrl);
}

// Load filters from URL parameters
function loadFiltersFromURL() {
    const params = new URLSearchParams(window.location.search);
    
    // Load search query
    const searchQuery = params.get('q');
    if (searchQuery) {
        document.getElementById('search-input').value = searchQuery;
    }
    
    // Load categories
    params.getAll('category').forEach(category => {
        activeFilters.categories.add(category);
    });
    
    // PARKING LOT: Date range loading
    /*
    // Load date range
    const startDate = params.get('startDate');
    if (startDate) {
        document.getElementById('start-date').value = startDate;
        activeFilters.dateRange.start = new Date(startDate);
    }
    
    const endDate = params.get('endDate');
    if (endDate) {
        document.getElementById('end-date').value = endDate;
        activeFilters.dateRange.end = new Date(endDate);
    }
    */
    
    // Load subject filters
    params.getAll('subjects').forEach(value => {
        activeFilters.metadata.subjects.add(value);
    });
}

// Create shareable link with current filters
function createShareableLink() {
    // Update URL before copying
    updateURL();
    
    // Copy URL to clipboard
    navigator.clipboard.writeText(window.location.href)
        .then(() => {
            // Show toast notification
            showToast('Link copied to clipboard!');
        })
        .catch(err => {
            console.error('Failed to copy: ', err);
            showToast('Failed to copy link.');
        });
}

// Show toast notification
function showToast(message, duration = 3000) {
    // Check if toast already exists
    let toast = document.querySelector('.toast');
    
    // Create toast if it doesn't exist
    if (!toast) {
        toast = document.createElement('div');
        toast.className = 'toast';
        document.body.appendChild(toast);
    }
    
    // Set message and show
    toast.textContent = message;
    toast.classList.add('show');
    
    // Hide after duration
    setTimeout(() => {
        toast.classList.remove('show');
    }, duration);
} 