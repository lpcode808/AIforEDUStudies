/**
 * Event Bus Module
 * Provides a simple publish-subscribe pattern for decoupled communication
 * Version 2.0 - Enables loose coupling between modules
 */

/**
 * EventBus class - Simple pub/sub implementation
 */
class EventBus {
  constructor() {
    this.listeners = new Map();
    this.debugMode = false;
  }

  /**
   * Subscribe to an event
   * @param {string} event - Event name
   * @param {Function} callback - Handler function
   * @param {Object} options - Optional configuration
   * @returns {Function} Unsubscribe function
   */
  on(event, callback, options = {}) {
    if (typeof callback !== 'function') {
      console.error('EventBus: Callback must be a function');
      return () => {};
    }

    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }

    const listener = {
      callback,
      once: options.once || false,
      priority: options.priority || 0
    };

    this.listeners.get(event).push(listener);

    // Sort by priority (higher priority first)
    this.listeners.get(event).sort((a, b) => b.priority - a.priority);

    if (this.debugMode) {
      console.log(`EventBus: Subscribed to '${event}'`, { listener, totalListeners: this.listeners.get(event).length });
    }

    // Return unsubscribe function
    return () => this.off(event, callback);
  }

  /**
   * Subscribe to an event for one-time execution
   * @param {string} event - Event name
   * @param {Function} callback - Handler function
   * @returns {Function} Unsubscribe function
   */
  once(event, callback) {
    return this.on(event, callback, { once: true });
  }

  /**
   * Unsubscribe from an event
   * @param {string} event - Event name
   * @param {Function} callback - Handler function to remove
   */
  off(event, callback) {
    if (!this.listeners.has(event)) {
      return;
    }

    const eventListeners = this.listeners.get(event);
    const index = eventListeners.findIndex(listener => listener.callback === callback);

    if (index !== -1) {
      eventListeners.splice(index, 1);

      if (this.debugMode) {
        console.log(`EventBus: Unsubscribed from '${event}'`, { remainingListeners: eventListeners.length });
      }
    }

    // Clean up empty listener arrays
    if (eventListeners.length === 0) {
      this.listeners.delete(event);
    }
  }

  /**
   * Emit an event
   * @param {string} event - Event name
   * @param {*} data - Data to pass to listeners
   * @returns {number} Number of listeners notified
   */
  emit(event, data) {
    if (!this.listeners.has(event)) {
      if (this.debugMode) {
        console.log(`EventBus: No listeners for '${event}'`);
      }
      return 0;
    }

    const eventListeners = [...this.listeners.get(event)]; // Copy to avoid modification during iteration
    let notifiedCount = 0;

    if (this.debugMode) {
      console.log(`EventBus: Emitting '${event}'`, { data, listenerCount: eventListeners.length });
    }

    for (const listener of eventListeners) {
      try {
        listener.callback(data);
        notifiedCount++;

        // Remove one-time listeners
        if (listener.once) {
          this.off(event, listener.callback);
        }
      } catch (error) {
        console.error(`EventBus: Error in listener for '${event}':`, error);
      }
    }

    return notifiedCount;
  }

  /**
   * Remove all listeners for an event (or all events if no event specified)
   * @param {string} [event] - Event name (optional)
   */
  clear(event) {
    if (event) {
      this.listeners.delete(event);
      if (this.debugMode) {
        console.log(`EventBus: Cleared all listeners for '${event}'`);
      }
    } else {
      this.listeners.clear();
      if (this.debugMode) {
        console.log('EventBus: Cleared all listeners');
      }
    }
  }

  /**
   * Get count of listeners for an event
   * @param {string} event - Event name
   * @returns {number} Number of listeners
   */
  listenerCount(event) {
    return this.listeners.has(event) ? this.listeners.get(event).length : 0;
  }

  /**
   * Get all registered event names
   * @returns {Array<string>} Array of event names
   */
  eventNames() {
    return Array.from(this.listeners.keys());
  }

  /**
   * Enable or disable debug mode
   * @param {boolean} enabled - Whether to enable debug logging
   */
  setDebugMode(enabled) {
    this.debugMode = Boolean(enabled);
    if (this.debugMode) {
      console.log('EventBus: Debug mode enabled');
    }
  }
}

// Create singleton instance
const eventBus = new EventBus();

// Export singleton instance as default
export default eventBus;

// Also export the class for testing
export { EventBus };

/**
 * Common event names used in the application
 * This provides type safety and prevents typos
 */
export const Events = {
  // Data events
  DATA_LOADED: 'data:loaded',
  DATA_ERROR: 'data:error',
  DATA_LOADING: 'data:loading',

  // Search events
  SEARCH_QUERY_CHANGED: 'search:query-changed',
  SEARCH_RESULTS_UPDATED: 'search:results-updated',
  SEARCH_ERROR: 'search:error',

  // Filter events
  FILTER_ADDED: 'filter:added',
  FILTER_REMOVED: 'filter:removed',
  FILTER_CLEARED: 'filter:cleared',
  FILTERS_CHANGED: 'filters:changed',

  // UI events
  VIEW_MODE_CHANGED: 'ui:view-mode-changed',
  MODAL_OPENED: 'ui:modal-opened',
  MODAL_CLOSED: 'ui:modal-closed',

  // State events
  STATE_CHANGED: 'state:changed',
  STATE_INITIALIZED: 'state:initialized'
};

/**
 * Example usage:
 *
 * // Subscribe to an event
 * import eventBus, { Events } from './core/event-bus.js';
 *
 * const unsubscribe = eventBus.on(Events.SEARCH_QUERY_CHANGED, (query) => {
 *   console.log('Search query changed:', query);
 * });
 *
 * // Emit an event
 * eventBus.emit(Events.SEARCH_QUERY_CHANGED, 'machine learning');
 *
 * // Unsubscribe
 * unsubscribe();
 *
 * // One-time listener
 * eventBus.once(Events.DATA_LOADED, (data) => {
 *   console.log('Data loaded once:', data);
 * });
 *
 * // Priority listeners (higher priority runs first)
 * eventBus.on(Events.STATE_CHANGED, handler1, { priority: 10 });
 * eventBus.on(Events.STATE_CHANGED, handler2, { priority: 5 });
 */
