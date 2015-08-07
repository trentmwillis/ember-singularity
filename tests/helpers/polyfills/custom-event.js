export default function setupCustomEventPolyfill() {
  if (!window.CustomEvent) {
    window.CustomEvent = function(event, params) {
      params = params || { bubbles: false, cancelable: false, detail: undefined };
      let evt = document.createEvent('CustomEvent');
      evt.initCustomEvent(event, params.bubbles, params.cancelable, params.detail);
      return evt;
    };

    window.CustomEvent.prototype = window.Event.prototype;
  }
}
