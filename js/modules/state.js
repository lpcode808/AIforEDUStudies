/**
 * State Management for GenAI Studies Explorer
 * Version 3.0 with enhanced state management and error handling
 */

/**
 * AppState - Singleton state manager for the application
 * Maintains the source of truth for application data and state
 */
class AppState {
  constructor() {
    // Core data
    this._studies = [];
    
    // Active filters
    this._categoryFilters = [];
    this._subjectFilters = [];
    this._searchQuery = '';
    
    // UI state
    this._viewMode = 'card'; // 'card' or 'list'
    
    // State flags
    this._initialized = false;
    this._loading = false;
    this._error = null;
    
    // Event callbacks
    this._listeners = {
      'state-changed': [],
      'studies-loaded': [],
      'filter-changed': [],
      'error': [],
      'view-mode-changed': []
    };
    
    console.log('STATE: AppState initialized');
  }
  
  // ------ GETTERS ------
  
  /**
   * Get all studies
   * @returns {Array} Array of study objects
   */
  getStudies() {
    return [...this._studies];
  }
  
  /**
   * Get category filters
   * @returns {Array} Array of active category filters
   */
  getCategoryFilters() {
    return [...this._categoryFilters];
  }
  
  /**
   * Get subject filters
   * @returns {Array} Array of active subject filters
   */
  getSubjectFilters() {
    return [...this._subjectFilters];
  }
  
  /**
   * Get search query
   * @returns {string} Current search query
   */
  getSearchQuery() {
    return this._searchQuery;
  }
  
  /**
   * Get current view mode
   * @returns {string} Current view mode ('card' or 'list')
   */
  getViewMode() {
    return this._viewMode;
  }
  
  /**
   * Get loading state
   * @returns {boolean} Whether data is currently loading
   */
  isLoading() {
    return this._loading;
  }
  
  /**
   * Get error state
   * @returns {Error|null} Current error or null if no error
   */
  getError() {
    return this._error;
  }
  
  /**
   * Get initialization state
   * @returns {boolean} Whether the app state is fully initialized
   */
  isInitialized() {
    return this._initialized;
  }
  
  // ------ SETTERS ------
  
  /**
   * Set studies data
   * @param {Array} studies - Array of study objects
   */
  setStudies(studies) {
    try {
      console.log(`STATE: Setting ${studies ? studies.length : 0} studies`);
      
      if (!studies || !Array.isArray(studies)) {
        console.error('STATE: Invalid studies data provided to setStudies');
        this._studies = [];
        this._error = new Error('Invalid studies data');
        this._notifyListeners('error', this._error);
        return;
      }
      
      // Store a deep copy to prevent external mutations
      try {
        this._studies = structuredClone(studies);
      } catch (e) {
        // Fallback for browsers without structuredClone
        this._studies = JSON.parse(JSON.stringify(studies));
      }
      
      this._initialized = true;
      this._loading = false;
      this._error = null;
      
      console.log(`STATE: Successfully set ${this._studies.length} studies`);
      this._notifyListeners('studies-loaded', this._studies);
      this._notifyListeners('state-changed', this);
    } catch (error) {
      console.error('STATE: Error setting studies:', error);
      this._error = error;
      this._notifyListeners('error', error);
    }
  }
  
  /**
   * Set loading state
   * @param {boolean} loading - Whether data is loading
   */
  setLoading(loading) {
    this._loading = Boolean(loading);
    this._notifyListeners('state-changed', this);
  }
  
  /**
   * Set error state
   * @param {Error|null} error - Error object or null to clear error
   */
  setError(error) {
    this._error = error;
    if (error) {
      this._notifyListeners('error', error);
    }
    this._notifyListeners('state-changed', this);
  }
  
  /**
   * Set search query
   * @param {string} query - Search query string
   */
  setSearchQuery(query) {
    if (typeof query !== 'string') {
      query = '';
    }
    this._searchQuery = query.trim();
    this._notifyListeners('filter-changed', {
      type: 'search',
      value: this._searchQuery
    });
    this._notifyListeners('state-changed', this);
  }
  
  /**
   * Set view mode
   * @param {string} mode - View mode ('card' or 'list')
   */
  setViewMode(mode) {
    if (mode !== 'card' && mode !== 'list') {
      console.warn(`STATE: Invalid view mode: ${mode}, defaulting to 'card'`);
      mode = 'card';
    }
    
    if (this._viewMode !== mode) {
      this._viewMode = mode;
      this._notifyListeners('view-mode-changed', this._viewMode);
      this._notifyListeners('state-changed', this);
    }
  }
  
  /**
   * Toggle view mode between 'card' and 'list'
   */
  toggleViewMode() {
    const newMode = this._viewMode === 'card' ? 'list' : 'card';
    this.setViewMode(newMode);
    return newMode;
  }
  
  // ------ FILTER OPERATIONS ------
  
  /**
   * Add a category filter
   * @param {string} category - Category to add to filters
   */
  addCategoryFilter(category) {
    if (!category || typeof category !== 'string') {
      console.warn('STATE: Cannot add invalid category filter:', category);
      return;
    }
    
    if (!this._categoryFilters.includes(category)) {
      this._categoryFilters.push(category);
      this._notifyListeners('filter-changed', {
        type: 'category',
        action: 'add',
        value: category
      });
      this._notifyListeners('state-changed', this);
    }
  }
  
  /**
   * Remove a category filter
   * @param {string} category - Category to remove from filters
   */
  removeCategoryFilter(category) {
    const index = this._categoryFilters.indexOf(category);
    if (index !== -1) {
      this._categoryFilters.splice(index, 1);
      this._notifyListeners('filter-changed', {
        type: 'category',
        action: 'remove',
        value: category
      });
      this._notifyListeners('state-changed', this);
    }
  }
  
  /**
   * Add a subject filter
   * @param {string} subject - Subject to add to filters
   */
  addSubjectFilter(subject) {
    if (!subject || typeof subject !== 'string') {
      console.warn('STATE: Cannot add invalid subject filter:', subject);
      return;
    }
    
    if (!this._subjectFilters.includes(subject)) {
      this._subjectFilters.push(subject);
      this._notifyListeners('filter-changed', {
        type: 'subject',
        action: 'add',
        value: subject
      });
      this._notifyListeners('state-changed', this);
    }
  }
  
  /**
   * Remove a subject filter
   * @param {string} subject - Subject to remove from filters
   */
  removeSubjectFilter(subject) {
    const index = this._subjectFilters.indexOf(subject);
    if (index !== -1) {
      this._subjectFilters.splice(index, 1);
      this._notifyListeners('filter-changed', {
        type: 'subject',
        action: 'remove',
        value: subject
      });
      this._notifyListeners('state-changed', this);
    }
  }
  
  /**
   * Clear all filters
   */
  clearFilters() {
    this._categoryFilters = [];
    this._subjectFilters = [];
    this._searchQuery = '';
    
    this._notifyListeners('filter-changed', {
      type: 'clear-all',
      action: 'clear'
    });
    this._notifyListeners('state-changed', this);
  }
  
  /**
   * Clear only subject filters
   */
  clearSubjectFilters() {
    this._subjectFilters = [];
    
    this._notifyListeners('filter-changed', {
      type: 'subject',
      action: 'clear-all'
    });
    this._notifyListeners('state-changed', this);
  }
  
  // ------ EVENT HANDLING ------
  
  /**
   * Add event listener
   * @param {string} event - Event name to listen for
   * @param {Function} callback - Function to call when event occurs
   */
  addEventListener(event, callback) {
    if (typeof callback !== 'function') {
      console.warn('STATE: Cannot add non-function as event listener');
      return;
    }
    
    if (!this._listeners[event]) {
      this._listeners[event] = [];
    }
    
    this._listeners[event].push(callback);
  }
  
  /**
   * Remove event listener
   * @param {string} event - Event name
   * @param {Function} callback - Function to remove
   */
  removeEventListener(event, callback) {
    if (!this._listeners[event]) return;
    
    const index = this._listeners[event].indexOf(callback);
    if (index !== -1) {
      this._listeners[event].splice(index, 1);
    }
  }
  
  /**
   * Notify all listeners of an event
   * @param {string} event - Event name
   * @param {*} data - Data to pass to listeners
   * @private
   */
  _notifyListeners(event, data) {
    if (!this._listeners[event]) return;
    
    for (const callback of this._listeners[event]) {
      try {
        callback(data);
      } catch (error) {
        console.error(`STATE: Error in ${event} listener:`, error);
      }
    }
  }
}

// Create and export a singleton instance
export default new AppState(); 