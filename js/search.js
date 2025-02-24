/**
 * Search and filter functionality for the GenAI Studies Explorer
 */

// Global variables
let studiesData = [];
let fuse = null;
let activeFilters = {
    categories: new Set(),
    dateRange: {
        start: null,
        end: null
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
    
    // Display all studies initially
    displayStudies(studiesData);
    
    // Populate category filters
    populateCategoryFilters();
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
    
    // Date filters
    const startDateInput = document.getElementById('start-date');
    const endDateInput = document.getElementById('end-date');
    
    startDateInput.addEventListener('change', updateDateFilter);
    endDateInput.addEventListener('change', updateDateFilter);
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
        
        // Filter by date range
        if (activeFilters.dateRange.start || activeFilters.dateRange.end) {
            const studyDate = new Date(study.date);
            
            if (activeFilters.dateRange.start && studyDate < activeFilters.dateRange.start) {
                return false;
            }
            
            if (activeFilters.dateRange.end && studyDate > activeFilters.dateRange.end) {
                return false;
            }
        }
        
        return true;
    });
}

// Update date filter when date inputs change
function updateDateFilter() {
    const startDateInput = document.getElementById('start-date');
    const endDateInput = document.getElementById('end-date');
    
    if (startDateInput.value) {
        activeFilters.dateRange.start = new Date(`${startDateInput.value}-01`);
    } else {
        activeFilters.dateRange.start = null;
    }
    
    if (endDateInput.value) {
        // Set to the last day of the month
        const [year, month] = endDateInput.value.split('-');
        const lastDay = new Date(year, month, 0).getDate();
        activeFilters.dateRange.end = new Date(`${endDateInput.value}-${lastDay}`);
    } else {
        activeFilters.dateRange.end = null;
    }
    
    // Re-apply search with new date filter
    performSearch();
}

// Toggle category filter
function toggleCategoryFilter(category) {
    if (activeFilters.categories.has(category)) {
        activeFilters.categories.delete(category);
    } else {
        activeFilters.categories.add(category);
    }
    
    // Update UI to reflect active filters
    document.querySelectorAll('.category-filter').forEach(element => {
        const cat = element.getAttribute('data-category');
        if (activeFilters.categories.has(cat)) {
            element.classList.add('active');
        } else {
            element.classList.remove('active');
        }
    });
    
    // Re-apply search with new category filter
    performSearch();
}

// Extract all unique categories from studies
function getUniqueCategories() {
    const categories = new Set();
    studiesData.forEach(study => {
        study.categories.forEach(category => {
            categories.add(category);
        });
    });
    return Array.from(categories).sort();
}

// Populate category filter options
function populateCategoryFilters() {
    const categoryFiltersContainer = document.getElementById('category-filters');
    const categories = getUniqueCategories();
    
    categories.forEach(category => {
        const filterElement = document.createElement('div');
        filterElement.className = 'category-filter';
        filterElement.setAttribute('data-category', category);
        filterElement.textContent = category;
        
        filterElement.addEventListener('click', () => {
            toggleCategoryFilter(category);
        });
        
        categoryFiltersContainer.appendChild(filterElement);
    });
}

// Display studies in the results container
function displayStudies(studies) {
    const resultsContainer = document.getElementById('results-container');
    
    // Clear previous results
    resultsContainer.innerHTML = '';
    
    if (studies.length === 0) {
        // Show message if no results
        const noResults = document.createElement('p');
        noResults.className = 'placeholder-text';
        noResults.textContent = 'No studies match your search criteria. Try adjusting your filters.';
        resultsContainer.appendChild(noResults);
        return;
    }
    
    // Create a card for each study
    studies.forEach(study => {
        const studyCard = document.createElement('div');
        studyCard.className = 'study-card';
        
        // Study title with link
        const titleContainer = document.createElement('div');
        titleContainer.className = 'study-title-container';
        
        const title = document.createElement('h3');
        title.className = 'study-title';
        
        // If URL exists, make title a link
        if (study.url) {
            const titleLink = document.createElement('a');
            titleLink.href = study.url;
            titleLink.textContent = study.title;
            titleLink.target = '_blank';
            titleLink.rel = 'noopener noreferrer';
            title.appendChild(titleLink);
        } else {
            title.textContent = study.title;
        }
        
        titleContainer.appendChild(title);
        
        // Study metadata
        const meta = document.createElement('div');
        meta.className = 'study-meta';
        
        const organization = document.createElement('span');
        organization.className = 'study-organization';
        organization.textContent = study.organization;
        
        const date = document.createElement('span');
        date.className = 'study-date';
        date.textContent = formatDate(study.date);
        
        meta.appendChild(organization);
        meta.appendChild(date);
        
        // Study categories
        const categories = document.createElement('div');
        categories.className = 'study-categories';
        
        study.categories.forEach(category => {
            const categoryTag = document.createElement('span');
            categoryTag.className = 'study-category';
            categoryTag.textContent = category;
            categories.appendChild(categoryTag);
        });
        
        // Study findings
        const findings = document.createElement('p');
        findings.className = 'study-findings';
        findings.textContent = study.key_findings;
        
        // Append all elements to the study card
        studyCard.appendChild(titleContainer);
        studyCard.appendChild(meta);
        studyCard.appendChild(categories);
        studyCard.appendChild(findings);
        
        // Add the study card to the results container
        resultsContainer.appendChild(studyCard);
    });
}

// Format date for display
function formatDate(dateString) {
    const options = { year: 'numeric', month: 'short' };
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', options);
} 