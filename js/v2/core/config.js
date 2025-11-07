/**
 * Domain Configuration Module
 * Centralizes all domain/category mappings and color schemes
 * Version 2.0 - Single source of truth for domain logic
 */

/**
 * Domain configuration with all metadata
 */
export const DOMAINS = {
  AI_USE: {
    id: 'ai-use',
    label: 'AI Use and Perceptions',
    shortLabel: 'Use',
    color: '#4285F4', // Blue
    className: 'domain-pk12',
    // Category matching patterns
    matches: [
      'AI Use and Perceptions',
      'Current AI Use and Perceptions in PK 12 & HigherEd',
      /AI Use/i,
      /AI Perceptions?/i
    ]
  },

  GUIDELINES: {
    id: 'guidelines',
    label: 'Guidelines, Training, Policies',
    shortLabel: 'Policy',
    color: '#EA4335', // Red
    className: 'domain-guidelines',
    matches: [
      'Guidelines, Training, Policies',
      'Current State of Guidelines, Training, and Policies',
      /Guidelines?/i,
      /Training/i,
      /Policies/i
    ]
  },

  PERFORMANCE: {
    id: 'performance',
    label: 'Student Performance Data',
    shortLabel: 'Data',
    color: '#34A853', // Green
    className: 'domain-performance',
    matches: [
      'Student Performance Data',
      /Performance/i,
      /Student Data/i
    ]
  },

  WORKFORCE: {
    id: 'workforce',
    label: 'Workforce Trends',
    shortLabel: 'Work',
    color: '#E37400', // Orange
    className: 'domain-workforce',
    matches: [
      'Workforce Trends',
      /Workforce/i,
      /jobs/i,
      /work/i
    ]
  }
};

/**
 * Default domain for uncategorized studies
 */
export const DEFAULT_DOMAIN = {
  id: 'default',
  label: 'Other',
  shortLabel: 'Other',
  color: '#757575', // Gray
  className: 'domain-default',
  matches: []
};

/**
 * Get domain configuration from a category string
 * @param {string} category - Category name to match
 * @returns {Object} Domain configuration object
 */
export function getDomainFromCategory(category) {
  if (!category || typeof category !== 'string') {
    return DEFAULT_DOMAIN;
  }

  // Check each domain for a match
  for (const domain of Object.values(DOMAINS)) {
    for (const pattern of domain.matches) {
      if (typeof pattern === 'string') {
        // Exact match (case-insensitive)
        if (category.toLowerCase() === pattern.toLowerCase()) {
          return domain;
        }
      } else if (pattern instanceof RegExp) {
        // Regex match
        if (pattern.test(category)) {
          return domain;
        }
      }
    }
  }

  return DEFAULT_DOMAIN;
}

/**
 * Get domain class name from category
 * @param {string|Array} categories - Category or array of categories
 * @returns {string} CSS class name
 */
export function getDomainClass(categories) {
  // Handle array input - use first category
  const category = Array.isArray(categories) ? categories[0] : categories;
  const domain = getDomainFromCategory(category);
  return domain.className;
}

/**
 * Get domain color from category
 * @param {string|Array} categories - Category or array of categories
 * @returns {string} Hex color code
 */
export function getDomainColor(categories) {
  const category = Array.isArray(categories) ? categories[0] : categories;
  const domain = getDomainFromCategory(category);
  return domain.color;
}

/**
 * Get short label for category badge
 * @param {string|Array} categories - Category or array of categories
 * @returns {string} Short label
 */
export function getDomainShortLabel(categories) {
  const category = Array.isArray(categories) ? categories[0] : categories;
  const domain = getDomainFromCategory(category);
  return domain.shortLabel;
}

/**
 * Check if a category matches a domain
 * @param {string} category - Category to check
 * @param {string} domainId - Domain ID to match against
 * @returns {boolean} True if category matches domain
 */
export function categoryMatchesDomain(category, domainId) {
  const domain = DOMAINS[domainId.toUpperCase().replace('-', '_')];
  if (!domain) return false;

  const categoryDomain = getDomainFromCategory(category);
  return categoryDomain.id === domain.id;
}

/**
 * Get all domain labels for filter buttons
 * @returns {Array<string>} Array of domain labels
 */
export function getAllDomainLabels() {
  return Object.values(DOMAINS).map(d => d.label);
}

/**
 * Get domain configuration by label
 * @param {string} label - Domain label
 * @returns {Object} Domain configuration
 */
export function getDomainByLabel(label) {
  for (const domain of Object.values(DOMAINS)) {
    if (domain.label === label) {
      return domain;
    }
  }
  return DEFAULT_DOMAIN;
}

// Export domains array for iteration
export const domainsArray = Object.values(DOMAINS);

// Export for testing/debugging
export const __test__ = {
  DOMAINS,
  DEFAULT_DOMAIN
};
