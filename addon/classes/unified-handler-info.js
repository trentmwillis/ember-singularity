/**
 * Represents information about a unified event handler. That information is
 * primarily concerned with what element has the event listener on it, what
 * function is triggered by the event, the name of the associated Ember event
 * and what handlers get triggered by the Ember event.
 *
 * @class UnifiedHandlerInfo
 */
export default class UnifiedHandlerInfo {
  /**
   * @constructor
   * @param {HTMLElement} targetElement
   * @param {Function} trigger
   * @param {String} emberEventName
   */
  constructor(targetElement, trigger, emberEventName) {
    // What element has the DOM event listener on it
    this.targetElement = targetElement;

    // What function is triggered by the DOM event
    this.trigger = trigger;

    // What Ember event is triggered by the trigger function
    this.emberEventName = emberEventName;

    // What callbacks are triggered by the ember event
    this.emberHandlers = [];
  }

  registerEmberHandler(callback) {
    this.emberHandlers.push(callback);
  }

  /**
   *
   */
  unregisterEmberHandler(callback) {
    for (let i = 0, cb; (cb = this.emberHandlers && this.emberHandlers[i]); ++i) {
      if (cb === callback) {
        this.emberHandlers.splice(i, 1);
      }
    }
  }
}
