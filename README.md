# Ember Singularity

Ember Singularity integrates a [Unified Event Handler](https://github.com/trentmwillis/ember-singularity/blob/master/app/services/unified-event-handler.js)
service to help control DOM event listeners by taking normal DOM events and
binding them to Ember Events that are triggered by a singular DOM listener.

In other words, this means that instead of having multiple listeners for a
single DOM event, you have one listener for a single DOM event that then
triggers multiple callbacks via Ember events.

Why do this? There are two primary motivations:

1. **Centralize control of DOM listeners**: this has numerous benefits. Primary
   would be that it reduces the risk of memory leaks and allows optimization of
   the number of handlers being used. It allows an easy choke point for
   throttling "spammy" events. Essentially greater and easier control over
   DOM events not already handled by Ember.
2. **Leverage Ember's event system**: this helps ensure events that cause
   modifications to application state or the DOM get batched into the Ember
   run-loop. Helping reduce churn (especially in cases such as scrolling) is a
   huge win when trying to make performant applications.

## Usage

The available interface for the `UnifiedEventHandler` is pretty simple and only
contains 3 available methods. That said, it is recommended that you abstract
away any usage of the service via mixins or base-level components; this helps
ensure the benefits described in the above motivations.

### `register(target, eventName, callback)`

This registers a callback to be tied to a specific target and event type. The
`target` and `eventName` are expected to be of type `string` and `callback` is a
function. The `callback` will receive the original event. Here's an example:

```js
let ScrollMixin = Ember.Mixin.extend({
  unifiedEventHandler: Ember.inject.service(),

  _registerScrollCallback: Ember.on('init', function() {
    this.get('unifiedEventHandler').register('window', 'scroll', (event) => {
      console.log('scrolled!');
      console.log(event);
    });
  })
});
```

### `unregister(target, eventName, callback)`

This is the exact opposite of `register()` and expects the arguments to be the
same as were used to register the handler. Here's an example:

```js
let ScrollMixin = Ember.Mixin.extend({
  unifiedEventHandler: Ember.inject.service(),

  scroll() { console.log('scrolled!'); },

  _registerScrollCallback: Ember.on('init', function() {
    this.get('unifiedEventHandler').register('window', 'scroll', this.scroll);
  }),

  _unregisterScrollCallback: Ember.on('willDestroy', function() {
    this.get('unifiedEventHandler').unregister('window', 'scroll', this.scroll);
  })
});
```

### `triggerEvent(eventName)`

This allows you to trigger the Ember event that your callback got bound to. As
of version 1.1.0, after you register a handler it's Ember event will be of the
form `<event-name>.<target>`. This probably won't be used often, but is
available for flexibility in testing, debugging, and extending functionality.
Here's a final example of the total API:

```js
let ScrollMixin = Ember.Mixin.extend({
  unifiedEventHandler: Ember.inject.service(),

  scroll() { console.log('scrolled!'); },

  triggerScroll() {
    this.get('unifiedEventHandler').triggerEvent('window.scroll');
  },

  _registerScrollCallback: Ember.on('init', function() {
    this.get('unifiedEventHandler').register('window', 'scroll', this.scroll);
  }),

  _unregisterScrollCallback: Ember.on('willDestroy', function() {
    this.get('unifiedEventHandler').unregister('window', 'scroll', this.scroll);
  })
});
```
