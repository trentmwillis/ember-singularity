/**
 * The Unified Event Handler helps control DOM event listeners by taking normal
 * DOM events and binding them to Ember Events that are united into one trigger.
 * In other words, this means that instead of having multiple listeners for a
 * single DOM event, we have one listener for a single DOM event that then
 * triggers multiple callbacks via Ember events.
 *
 * Why do this? There are two primary motivations:
 * 1. Reduce number of DOM listeners
 * 2. Leverage Ember's event system
 */
import Ember from 'ember';

/**
 * TODO: Make this globally configurable
 * The interval at which to dispatch events (all events are throttled).
 * @type {Number}
 */
const EVENT_INTERVAL = Ember.testing ? 0 : 50;

/**
 * An array of possible global objects to bind to.
 * @type {Array}
 */
const GLOBALS = ['window', 'document'];

/**
 * The name of the property for the handler map (since we access it a lot).
 * @type {String}
 */
const _HANDLER_MAP = '_handlerMap';

// Generates an incremental id number, used for labeling Ember events
const generateId = (function() {
  let id = 0;

  return function() {
    return ++id + '';
  };
}());

export default Ember.Service.extend(Ember.Evented, {
  // Keeps track of the handlers that have been registered
  [_HANDLER_MAP]: {},

  /**
   * Registers an event type for a specific target to be unified into a single
   * event listener
   * @param {String} target
   * @param {String} eventName
   * @param {Function} callback
   * @return {Void}
   */
  register(target, eventName, callback) {
    let handlerInfo = this._registerDOMHandler(target, eventName);
    this._registerEmberHandler(handlerInfo, callback);
  },

  /**
   * Given a selector return a DOM element
   * @param  {String} target The selector string
   * @return {Object}        The DOM representation of the string
   */
  _lookupElement: function(target) {
    let isGlobal = GLOBALS.indexOf(target) > -1;
    let targetElement;

    if (typeof target === 'string' && !isGlobal) {
      targetElement = document.querySelector(target);
    } else if (isGlobal) {
      switch (target) {
        case 'window':
          targetElement = window;
          break;
        case 'document':
          targetElement = document;
          break;
      }
    } else {
      throw new Error('UnifiedEventHandler inverts control and looks up elements on your behalf. Please call register with a selector string.');
    }

    if (!targetElement) {
      throw new Error(`The target selector ${target} was passed, but could not be retrieved from the DOM.`);
    }

    return targetElement;
  },

  /**
   * Registers a DOM event handler for a specific target and event type; returns
   * the info of the DOM handler on completion
   * @private
   * @param {EventTarget} target
   * @param {String} eventName
   * @return {Object} handlerInfo
   */
  _registerDOMHandler(target, eventName) {
    // Check if the target already has an event listener for this type of event
    let handlerInfo = this._getTargetEventHandler(target, eventName);

    if (!handlerInfo) {
      // Add new DOM event listener since there is none
      let emberEventName = `${eventName}.${generateId()}`;
      let trigger = this.triggerEvent.bind(this, emberEventName);
      let targetElement = this._lookupElement(target);

      targetElement.addEventListener(eventName, trigger);

      // Register the handler info into the map
      let handlerMap = this[_HANDLER_MAP];
      let targetHandlers = handlerMap[target];

      handlerInfo = {
        trigger,
        emberEventName,
        targetElement,
        emberHandlers: [],
      };

      if (!targetHandlers) {
        this[_HANDLER_MAP][target] = {
          [eventName]: handlerInfo
        };
      } else {
        targetHandlers[eventName] = handlerInfo;
      }
    }

    return handlerInfo;
  },

  /**
   * Registers the Ember event handler associated with a DOM handler
   * @private
   * @param {Object} domHandlerInfo
   * @param {Function} callback
   * @return {Void}
   */
  _registerEmberHandler(domHandlerInfo, callback) {
    // Register the callback as a new ember handler
    domHandlerInfo.emberHandlers.push(callback);

    // Add the ember event listener
    this.on(domHandlerInfo.emberEventName, callback);
  },

  /**
   * Unregisters a previously bound event
   * @param {String} target
   * @param {String} eventName
   * @param {Function} callback
   * @return {Void}
   */
  unregister(target, eventName, callback) {
    // Get the handler for the passed in id
    let handlerMap = this[_HANDLER_MAP];
    let handlerTarget = handlerMap[target];
    let handlerInfo = handlerTarget[eventName];
    let targetElement = handlerInfo.targetElement;

    // Remove the associated Ember event listener
    this.off(handlerInfo.emberEventName, callback);

    for (var i = 0, cb; (cb = handlerInfo.emberHandlers && handlerInfo.emberHandlers[i]); ++i) {
      if (cb === callback) {
        handlerInfo.emberHandlers.splice(i, 1);
      }
    }

    // Check if all the ember event listeners for the DOM event listener have been destroyed
    if (!handlerInfo.emberHandlers.length) {
      // If so, unbind the DOM event listener as well
      targetElement.removeEventListener(eventName, handlerInfo.trigger);
      delete handlerTarget[eventName];

      // If the target has no more event listeners
      if (!Object.keys(handlerTarget).length) {
        // Delete the key
        delete this[_HANDLER_MAP][target];
      }
    }
  },

  /**
   * Gets the event handler info (if any) for a specific type of event on a
   * specified target
   * @private
   * @param {EventTarget} target
   * @param {String} eventName
   * @return {Object}
   */
  _getTargetEventHandler(target, eventName) {
    return this.get(`${_HANDLER_MAP}.${target}.${eventName}`);
  },

  /**
   * Triggers a given Ember event at a throttled rate
   * @param {String} eventName
   * @return {Void}
   */
  triggerEvent(eventName) {
    Ember.run.throttle(this, () => this.trigger(eventName), EVENT_INTERVAL);
  }
});
