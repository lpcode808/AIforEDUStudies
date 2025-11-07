/**
 * Filter Service Module
 * Centralizes all filtering logic with clean API
 * Version 2.0 - Service layer pattern with domain-aware filtering
 */

import eventBus, { Events } from '../core/event-bus.js';
import { getDomainFromCategory, categoryMatchesDomain } from '../core/config.js';

/**
 * FilterService class - Manages all filtering operations
 */
export class FilterService {
  constructor() {
    this.activeCategories = new Set();
    this.activeSubjects = new Set();
  }

  /**
   * Add a category filter
   * @param {string} category - Category to filter by
   */
  addCategoryFilter(category) {
    if (!category || typeof category !== 'string') {
      console.warn('FilterService: Invalid category:', category);
      return;
    }

    this.activeCategories.add(category);
    console.log('FilterService: Added category filter:', category);

    eventBus.emit(Events.FILTER_ADDED, {
      type: 'category',
      value: category
    });

    eventBus.emit(Events.FILTERS_CHANGED, {
      categories: this.getActiveCategories(),
      subjects: this.getActiveSubjects()
    });
  }

  /**
   * Remove a category filter
   * @param {string} category - Category to remove
   */
  removeCategoryFilter(category) {
    this.activeCategories.delete(category);
    console.log('FilterService: Removed category filter:', category);

    eventBus.emit(Events.FILTER_REMOVED, {
      type: 'category',
      value: category
    });

    eventBus.emit(Events.FILTERS_CHANGED, {
      categories: this.getActiveCategories(),
      subjects: this.getActiveSubjects()
    });
  }

  /**
   * Toggle a category filter
   * @param {string} category - Category to toggle
   * @returns {boolean} True if now active, false if now inactive
   */
  toggleCategoryFilter(category) {
    if (this.activeCategories.has(category)) {
      this.removeCategoryFilter(category);
      return false;
    } else {
      this.addCategoryFilter(category);
      return true;
    }
  }

  /**
   * Add a subject filter
   * @param {string} subject - Subject to filter by
   */
  addSubjectFilter(subject) {
    if (!subject || typeof subject !== 'string') {
      console.warn('FilterService: Invalid subject:', subject);
      return;
    }

    this.activeSubjects.add(subject);
    console.log('FilterService: Added subject filter:', subject);

    eventBus.emit(Events.FILTER_ADDED, {
      type: 'subject',
      value: subject
    });

    eventBus.emit(Events.FILTERS_CHANGED, {
      categories: this.getActiveCategories(),
      subjects: this.getActiveSubjects()
    });
  }

  /**
   * Remove a subject filter
   * @param {string} subject - Subject to remove
   */
  removeSubjectFilter(subject) {
    this.activeSubjects.delete(subject);
    console.log('FilterService: Removed subject filter:', subject);

    eventBus.emit(Events.FILTER_REMOVED, {
      type: 'subject',
      value: subject
    });

    eventBus.emit(Events.FILTERS_CHANGED, {
      categories: this.getActiveCategories(),
      subjects: this.getActiveSubjects()
    });
  }

  /**
   * Clear all filters
   */
  clearAllFilters() {
    this.activeCategories.clear();
    this.activeSubjects.clear();

    console.log('FilterService: Cleared all filters');

    eventBus.emit(Events.FILTER_CLEARED, {
      type: 'all'
    });

    eventBus.emit(Events.FILTERS_CHANGED, {
      categories: [],
      subjects: []
    });
  }

  /**
   * Clear only category filters
   */
  clearCategoryFilters() {
    this.activeCategories.clear();

    console.log('FilterService: Cleared category filters');

    eventBus.emit(Events.FILTER_CLEARED, {
      type: 'category'
    });

    eventBus.emit(Events.FILTERS_CHANGED, {
      categories: [],
      subjects: this.getActiveSubjects()
    });
  }

  /**
   * Clear only subject filters
   */
  clearSubjectFilters() {
    this.activeSubjects.clear();

    console.log('FilterService: Cleared subject filters');

    eventBus.emit(Events.FILTER_CLEARED, {
      type: 'subject'
    });

    eventBus.emit(Events.FILTERS_CHANGED, {
      categories: this.getActiveCategories(),
      subjects: []
    });
  }

  /**
   * Get active category filters
   * @returns {Array<string>} Array of active categories
   */
  getActiveCategories() {
    return Array.from(this.activeCategories);
  }

  /**
   * Get active subject filters
   * @returns {Array<string>} Array of active subjects
   */
  getActiveSubjects() {
    return Array.from(this.activeSubjects);
  }

  /**
   * Check if any filters are active
   * @returns {boolean} True if filters are active
   */
  hasActiveFilters() {
    return this.activeCategories.size > 0 || this.activeSubjects.size > 0;
  }

  /**
   * Check if a category filter is active
   * @param {string} category - Category to check
   * @returns {boolean} True if active
   */
  isCategoryActive(category) {
    return this.activeCategories.has(category);
  }

  /**
   * Check if a subject filter is active
   * @param {string} subject - Subject to check
   * @returns {boolean} True if active
   */
  isSubjectActive(subject) {
    return this.activeSubjects.has(subject);
  }

  /**
   * Filter studies by active filters
   * @param {Array} studies - Studies to filter
   * @returns {Array} Filtered studies
   */
  filterStudies(studies) {
    if (!studies || !Array.isArray(studies)) {
      console.error('FilterService: Invalid studies array');
      return [];
    }

    // If no filters active, return all studies
    if (!this.hasActiveFilters()) {
      console.log('FilterService: No active filters, returning all studies');
      return studies;
    }

    console.log(`FilterService: Filtering ${studies.length} studies`);
    console.log('FilterService: Active categories:', this.getActiveCategories());
    console.log('FilterService: Active subjects:', this.getActiveSubjects());

    let filtered = studies;

    // Apply category filters
    if (this.activeCategories.size > 0) {
      filtered = this.filterByCategories(filtered);
    }

    // Apply subject filters
    if (this.activeSubjects.size > 0) {
      filtered = this.filterBySubjects(filtered);
    }

    console.log(`FilterService: Filtered to ${filtered.length} studies`);
    return filtered;
  }

  /**
   * Filter studies by categories (using domain matching)
   * @param {Array} studies - Studies to filter
   * @returns {Array} Filtered studies
   * @private
   */
  filterByCategories(studies) {
    return studies.filter(study => {
      if (!study || !study.categories) return false;

      // Extract study categories
      const studyCategories = Array.isArray(study.categories)
        ? study.categories
        : study.categories.split('|').map(c => c.trim());

      // Check if any study category matches any active filter
      return studyCategories.some(studyCategory => {
        // Direct match
        if (this.activeCategories.has(studyCategory)) {
          return true;
        }

        // Domain-based matching
        const studyDomain = getDomainFromCategory(studyCategory);

        for (const filterCategory of this.activeCategories) {
          const filterDomain = getDomainFromCategory(filterCategory);

          // Match if domains are the same
          if (studyDomain.id === filterDomain.id && studyDomain.id !== 'default') {
            return true;
          }
        }

        return false;
      });
    });
  }

  /**
   * Filter studies by subjects
   * @param {Array} studies - Studies to filter
   * @returns {Array} Filtered studies
   * @private
   */
  filterBySubjects(studies) {
    return studies.filter(study => {
      if (!study || !study.metadata || !study.metadata.subjects) return false;

      const studySubjects = Array.isArray(study.metadata.subjects)
        ? study.metadata.subjects
        : [study.metadata.subjects];

      // Check if any study subject matches any active subject filter
      return studySubjects.some(subject =>
        this.activeSubjects.has(subject)
      );
    });
  }

  /**
   * Get filter statistics
   * @param {Array} studies - All studies
   * @returns {Object} Filter statistics
   */
  getFilterStats(studies) {
    const categoryCount = new Map();
    const subjectCount = new Map();

    studies.forEach(study => {
      // Count categories
      if (study.categories) {
        const categories = Array.isArray(study.categories)
          ? study.categories
          : study.categories.split('|').map(c => c.trim());

        categories.forEach(category => {
          categoryCount.set(category, (categoryCount.get(category) || 0) + 1);
        });
      }

      // Count subjects
      if (study.metadata && study.metadata.subjects) {
        const subjects = Array.isArray(study.metadata.subjects)
          ? study.metadata.subjects
          : [study.metadata.subjects];

        subjects.forEach(subject => {
          subjectCount.set(subject, (subjectCount.get(subject) || 0) + 1);
        });
      }
    });

    return {
      categories: Object.fromEntries(categoryCount),
      subjects: Object.fromEntries(subjectCount),
      totalStudies: studies.length
    };
  }
}

// Create and export singleton instance
const filterService = new FilterService();
export default filterService;

/**
 * Example usage:
 *
 * import filterService from './services/filter-service.js';
 * import eventBus, { Events } from './core/event-bus.js';
 *
 * // Listen for filter changes
 * eventBus.on(Events.FILTERS_CHANGED, ({ categories, subjects }) => {
 *   console.log('Active filters:', categories, subjects);
 *   updateUI();
 * });
 *
 * // Add filters
 * filterService.addCategoryFilter('AI Use and Perceptions');
 * filterService.addSubjectFilter('Mathematics');
 *
 * // Filter studies
 * const filtered = filterService.filterStudies(allStudies);
 *
 * // Clear filters
 * filterService.clearAllFilters();
 *
 * // Get stats
 * const stats = filterService.getFilterStats(allStudies);
 */
