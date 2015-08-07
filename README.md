# Ember Singularity

Ember Singularity integrates a service (the [Unified Event Handler](https://github.com/trentmwillis/ember-singularity/blob/master/app/services/unified-event-handler.js))
to help control DOM event listeners by taking normal DOM events and binding them
to Ember Events that trigger by a singular DOM listener.

In other words, this means that instead of having multiple listeners for a
single DOM event, you have one listener for a single DOM event that then
triggers multiple callbacks via Ember events.

Why do this? There are two primary motivations:

1. **Centralize control of DOM listeners**: this has numerous benefits. Primary
   would be that it reduces the risk of memory leaks and allows optimization of
   the number of handlers being used. It allows allows an easy choke point for
   throttling "spammy" events. Essentially greater and easier control over
   DOM events not already handled by Ember.
2. **Leverage Ember's event system**: this helps ensure events that cause
   modifications to application state or the DOM get batched into the Ember
   run-loop. Helping reduce churn (especially in cases such as scrolling) is a
   huge win when trying to make performant applications.
