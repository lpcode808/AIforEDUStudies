/**
 * Search Service Module
 * Provides a clean abstraction over the search engine implementation
 * Version 2.0 - Service layer pattern with event-driven updates
 */

import eventBus, { Events } from '../core/event-bus.js';
import { search as legacySearch, initializeSearchEngine } from '../../modules/search-engine.js';

/**
 * SearchService class - Manages search operations
 */
export class SearchService {
  constructor() {
    this.initialized = false;
    this.currentQuery = '';
    this.lastResults = [];
    this.searchEngine = null;
  }

  /**
   * Initialize the search service with data
   * @param {Array} studies - Array of study objects to index
   * @returns {Promise<void>}
   */
  async initialize(studies) {
    try {
      console.log('SearchService: Initializing with', studies.length, 'studies');

      // Initialize the underlying search engine (Fuse.js)
      await initializeSearchEngine(studies);

      this.initialized = true;
      console.log('SearchService: Initialization complete');

      // Emit initialization event
      eventBus.emit(Events.SEARCH_RESULTS_UPDATED, {
        query: '',
        results: studies,
        source: 'initialization'
      });

      return Promise.resolve();
    } catch (error) {
      console.error('SearchService: Initialization error:', error);
      eventBus.emit(Events.SEARCH_ERROR, error);
      return Promise.reject(error);
    }
  }

  /**
   * Perform a search
   * @param {string} query - Search query
   * @param {Array} studies - Studies to search (optional, for fallback)
   * @returns {Promise<Array>} Search results
   */
  async search(query, studies = []) {
    try {
      // Store current query
      this.currentQuery = query;

      // Emit query changed event
      eventBus.emit(Events.SEARCH_QUERY_CHANGED, query);

      console.log(`SearchService: Searching for "${query}"`);

      // Delegate to legacy search implementation
      const results = await legacySearch(query, studies);

      // Store results
      this.lastResults = results;

      console.log(`SearchService: Found ${results.length} results`);

      // Emit results updated event
      eventBus.emit(Events.SEARCH_RESULTS_UPDATED, {
        query,
        results,
        source: 'search'
      });

      return results;
    } catch (error) {
      console.error('SearchService: Search error:', error);
      eventBus.emit(Events.SEARCH_ERROR, error);

      // Return empty array on error
      return [];
    }
  }

  /**
   * Clear the current search
   * @param {Array} allStudies - All studies to return
   * @returns {Promise<Array>} All studies
   */
  async clearSearch(allStudies) {
    this.currentQuery = '';
    this.lastResults = allStudies;

    eventBus.emit(Events.SEARCH_QUERY_CHANGED, '');
    eventBus.emit(Events.SEARCH_RESULTS_UPDATED, {
      query: '',
      results: allStudies,
      source: 'clear'
    });

    return allStudies;
  }

  /**
   * Get the current search query
   * @returns {string} Current query
   */
  getCurrentQuery() {
    return this.currentQuery;
  }

  /**
   * Get the last search results
   * @returns {Array} Last results
   */
  getLastResults() {
    return [...this.lastResults];
  }

  /**
   * Check if search service is ready
   * @returns {boolean} True if initialized
   */
  isReady() {
    return this.initialized;
  }
}

// Create and export singleton instance
const searchService = new SearchService();
export default searchService;

/**
 * Example usage:
 *
 * import searchService from './services/search-service.js';
 * import eventBus, { Events } from './core/event-bus.js';
 *
 * // Listen for search results
 * eventBus.on(Events.SEARCH_RESULTS_UPDATED, ({ query, results }) => {
 *   console.log(`Search for "${query}" returned ${results.length} results`);
 *   displayResults(results);
 * });
 *
 * // Initialize
 * await searchService.initialize(studies);
 *
 * // Perform search
 * const results = await searchService.search('machine learning');
 *
 * // Clear search
 * await searchService.clearSearch(allStudies);
 */
