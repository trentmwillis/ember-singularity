import { module, test } from 'qunit';
import lookupElement from 'ember-singularity/utils/lookup-element';

module('Unit | Addon | Utils | lookup-element');

/* lookupElement */

test('returns an element from the DOM matching a selector', function(assert) {
  assert.equal(lookupElement('a'), document.querySelector('a'));
});

test('returns the window object for "window"', function(assert) {
  assert.equal(lookupElement('window'), window);
});

test('returns the document object for "document"', function(assert) {
  assert.equal(lookupElement('document'), document);
});

test('throws an error if a non-string is passed in as target', function(assert) {
  assert.throws(() => lookupElement(window), 'Ember Singularity expects elements to be looked up via a selector string. Please pass targets as strings, and not a "object"');
});

test('throws an error no element is found', function(assert) {
  assert.throws(() => lookupElement('.not-found'), 'The target selector ".not-found" was passed, but could not be retrieved from the DOM.');
});
