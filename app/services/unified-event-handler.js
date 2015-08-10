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
 *
 * @class UnifiedEventHandler
 * @extends Ember.Service
 */
import Ember from 'ember';
import UnifiedHandlerInfo from 'ember-singularity/classes/unified-handler-info';
import lookupElement from 'ember-singularity/utils/lookup-element';

/**
 * TODO: Make this globally configurable
 * The interval at which to dispatch events (all events are throttled).
 * @type {Number}
 */
const EVENT_INTERVAL = Ember.testing ? 0 : 50;

/**
 * The name of the property for the handler map (since we access it a lot).
 * @type {String}
 */
const _HANDLER_MAP = '_handlerMap';

export default Ember.Service.extend(Ember.Evented, {
  /* PUBLIC API */

  /**
   * Registers an event handler for a specific target to be unified into a
   * single event listener.
   * @public
   * @param {String} target
   * @param {String} eventName
   * @param {Function} callback
   * @return {Void}
   */
  register(target, eventName, callback) {
    let handlerInfo = this._getUnifiedHandlerInfo(target, eventName);
    this._registerEmberHandler(handlerInfo, callback);
  },

  /**
   * Unregisters a previously bound event handler, requires the same arguments
   * as were used to register the handler.
   * @public
   * @param {String} target
   * @param {String} eventName
   * @param {Function} callback
   * @return {Void}
   */
  unregister(target, eventName, callback) {
    // Get the handler for the passed in id
    let handlerTarget = this.get(`${_HANDLER_MAP}.${target}`);
    let handlerInfo = handlerTarget[eventName];

    // Remove the associated Ember event listener
    this.off(handlerInfo.emberEventName, callback);

    // Remove the Ember callback from the handler info
    handlerInfo.unregisterEmberHandler(callback);

    // Check if all the ember event listeners for the DOM event listener have been destroyed
    if (!handlerInfo.emberHandlers.length) {
      // If so, unbind the DOM event listener as well
      handlerInfo.targetElement.removeEventListener(eventName, handlerInfo.trigger);
      delete handlerTarget[eventName];

      // If the target has no more event listeners
      if (!Object.keys(handlerTarget).length) {
        // Delete the key
        delete this.get(_HANDLER_MAP)[target];
      }
    }
  },

  /**
   * Triggers a given Ember event at a throttled rate. Should rarely ever need
   * to be called explicitly, but is available for testing, debugging, and
   * extensibility purposes.
   * @public
   * @param {String} eventName
   * @return {Void}
   */
  triggerEvent(eventName) {
    Ember.run.throttle(this, () => this.trigger(eventName), EVENT_INTERVAL);
  },

  /* PRIVATE API */

  /**
   * Keeps track of the handlers that have been registered. The structure of
   * which looks like:
   *
   *   _handlerMap: {
   *     <target>: {
   *       <event-name>: <UnifiedHandlerInfo>,
   *       <event-name>: <UnifiedHandlerInfo>,
   *       // ...
   *     },
   *     // ...
   *   }
   *
   * @type {Object}
   */
  [_HANDLER_MAP]: Ember.Object.create(),

  /**
   * Gets the unified handler info for a specified target and event. If one does
   * not exist, it creates it.
   * @private
   * @param {String} target
   * @param {String} eventName
   * @return {UnifiedHandlerInfo} handlerInfo
   */
  _getUnifiedHandlerInfo(target, eventName) {
    return this.get(`${_HANDLER_MAP}.${target}.${eventName}`) ||
           this._createUnifiedHandlerInfo(target, eventName);
  },

  /**
   * Registers the callback on an Ember event associated with a unified DOM
   * event handler.
   * @private
   * @param {UnifiedHandlerInfo} handlerInfo
   * @param {Function} callback
   * @return {Void}
   */
  _registerEmberHandler(handlerInfo, callback) {
    // Register the callback as a new ember handler
    handlerInfo.registerEmberHandler(callback);

    // Add the ember event listener
    this.on(handlerInfo.emberEventName, callback);
  },

  /**
   * Registers a DOM event handler for a specific target and event type; returns
   * the info of the DOM handler on completion.
   * @private
   * @param {String} target
   * @param {String} eventName
   * @return {UnifiedHandlerInfo} handlerInfo
   */
  _createUnifiedHandlerInfo(target, eventName) {
    // Add new DOM event listener since there is none
    let emberEventName = `${eventName}.${target}`;
    let trigger = this.triggerEvent.bind(this, emberEventName);
    let targetElement = lookupElement(target);

    targetElement.addEventListener(eventName, trigger);

    // Register the handler info into the map
    let handlerMap = this[_HANDLER_MAP];
    let targetHandlers = handlerMap.get(target);

    let handlerInfo = new UnifiedHandlerInfo(targetElement, trigger, emberEventName);

    if (!targetHandlers) {
      handlerMap.set(target, {
        [eventName]: handlerInfo
      });
    } else {
      targetHandlers[eventName] = handlerInfo;
    }

    return handlerInfo;
  }
});
