/* global CustomEvent */

import { moduleFor, test } from 'ember-qunit';
import Ember from 'ember';
import sinon from 'sinon';

let service;
let sandbox;

moduleFor('service:unified-event-handler', 'Unit | Service | UnifiedEventHandler', {
  beforeEach() {
    service = this.subject();
    sandbox = sinon.sandbox.create();
  },
  afterEach() {
    sandbox.restore();
  }
});

/* register */

test('register binds callback to the event on the specified target', function(assert) {
  let callbackStub = sandbox.stub();
  service.register('window', 'scroll', callbackStub);
  window.dispatchEvent(new CustomEvent('scroll'));
  assert.ok(callbackStub.calledOnce);

  service.unregister('window', 'scroll', callbackStub);
});

test('unregisters event listeners when service is destroyed', function(assert) {
  let done = assert.async();
  let callbackStub = sandbox.stub();
  service.register('window', 'scroll', callbackStub);

  Ember.run(service, 'destroy');

  Ember.run(function() {
    window.dispatchEvent(new CustomEvent('scroll'));
    assert.ok(callbackStub.notCalled);
    done();
  });
});

test('cancels throttled events when service is destroyed', function(assert) {
  assert.expect(1);

  let done = assert.async();

  service.triggerEvent('scroll');

  Ember.run(service, 'destroy');

  Ember.run(function() {
    assert.notOk(Ember.run.hasScheduledTimers(), 'No timers scheduled');
  });
});

test('unregisters multiple event listeners of same event type when service is destroyed', function(assert) {
  let done = assert.async();
  let callbackStub = sandbox.stub();
  let callbackBStub = sandbox.stub();
  service.register('window', 'scroll', callbackStub);
  service.register('window', 'scroll', callbackBStub);

  Ember.run(service, 'destroy');

  Ember.run(function() {
    window.dispatchEvent(new CustomEvent('scroll'));
    assert.ok(callbackStub.notCalled);
    assert.ok(callbackBStub.notCalled);
    done();
  });
});

test('unregisters multiple event listeners of different event types when service is destroyed', function(assert) {
  let done = assert.async();
  let callbackStub = sandbox.stub();
  let callbackBStub = sandbox.stub();
  service.register('window', 'scroll', callbackStub);
  service.register('window', 'resize', callbackBStub);

  Ember.run(service, 'destroy');

  Ember.run(function() {
    window.dispatchEvent(new CustomEvent('resize'));
    window.dispatchEvent(new CustomEvent('scroll'));
    assert.ok(callbackStub.notCalled);
    assert.ok(callbackBStub.notCalled);
    done();
  });
});

test('register binds multiple callbacks to the event on the specified target but only triggers once', function(assert) {
  assert.expect(4);

  let callback1Stub = sandbox.stub();
  let callback2Stub = sandbox.stub();
  let triggerSpy = sandbox.spy(service, 'triggerEvent');

  let testContainer = document.getElementById('ember-testing');
  let element = document.createElement('p');
  element.classList.add('foo');
  testContainer.appendChild(element);
  let addEventListenerSpy = sandbox.spy(element, 'addEventListener');

  service.register('p.foo', 'scroll', callback1Stub);
  service.register('p.foo', 'scroll', callback2Stub);
  assert.ok(addEventListenerSpy.calledOnce, 'event listener added only once');

  element.dispatchEvent(new CustomEvent('scroll'));
  assert.ok(callback1Stub.calledOnce, 'first callback executed');
  assert.ok(callback2Stub.calledOnce, 'second callback executed');
  assert.ok(triggerSpy.calledOnce, 'trigger called only once');

  service.unregister('p.foo', 'scroll', callback1Stub);
  service.unregister('p.foo', 'scroll', callback2Stub);
  testContainer.removeChild(element);
});

test('register binds callbacks to multiple events on the specified target', function(assert) {
  assert.expect(4);

  let callback1Stub = sandbox.stub();
  let callback2Stub = sandbox.stub();

  service.register('window', 'resize', callback1Stub);
  service.register('window', 'scroll', callback2Stub);

  window.dispatchEvent(new CustomEvent('resize'));
  assert.ok(callback1Stub.calledOnce);
  assert.ok(callback2Stub.notCalled);

  window.dispatchEvent(new CustomEvent('scroll'));
  assert.ok(callback1Stub.calledOnce);
  assert.ok(callback2Stub.calledOnce);

  service.unregister('window', 'resize', callback1Stub);
  service.unregister('window', 'scroll', callback2Stub);
});

test('register binds callbacks to different events on multiple targets', function(assert) {
  assert.expect(4);

  let callback1Stub = sandbox.stub();
  let callback2Stub = sandbox.stub();

  service.register('window', 'resize', callback1Stub);
  service.register('document', 'scroll', callback2Stub);

  window.dispatchEvent(new CustomEvent('resize'));
  assert.ok(callback1Stub.calledOnce);
  assert.ok(callback2Stub.notCalled);

  document.dispatchEvent(new CustomEvent('scroll'));
  assert.ok(callback1Stub.calledOnce);
  assert.ok(callback2Stub.calledOnce);

  service.unregister('window', 'resize', callback1Stub);
  service.unregister('document', 'scroll', callback2Stub);
});

/* unregister */

test('unregister unbinds the callback from its event', function(assert) {
  let callbackSpy = sandbox.stub();

  service.register('window', 'scroll', callbackSpy);
  service.unregister('window', 'scroll', callbackSpy);
  window.dispatchEvent(new CustomEvent('scroll'));
  assert.ok(callbackSpy.notCalled);
});

test('unregister unbinds the callback from its event but leaves other callbacks for that event', function(assert) {
  assert.expect(2);

  let callback1Stub = sandbox.stub();
  let callback2Stub = sandbox.stub();

  service.register('window', 'scroll', callback1Stub);
  service.register('window', 'scroll', callback2Stub);
  service.unregister('window', 'scroll', callback2Stub);
  window.dispatchEvent(new CustomEvent('scroll'));

  assert.ok(callback1Stub.calledOnce);
  assert.ok(callback2Stub.notCalled);

  service.unregister('window', 'scroll', callback1Stub);
});

test('unregister destroys the DOM handler after all callbacks have been unbound', function(assert) {
  assert.expect(2);

  let callbackSpy = sandbox.stub();
  let triggerSpy = sandbox.spy(service, 'triggerEvent');

  service.register('window', 'scroll', callbackSpy);
  service.unregister('window', 'scroll', callbackSpy);
  window.dispatchEvent(new CustomEvent('scroll'));

  assert.ok(callbackSpy.notCalled);
  assert.ok(triggerSpy.notCalled);
});

test('unregister destroys the DOM handler for an event after all callbacks have been unbound but leaves other events', function(assert) {
  assert.expect(3);

  let callback1Spy = sandbox.stub();
  let callback2Spy = sandbox.stub();
  let triggerSpy = sandbox.spy(service, 'triggerEvent');

  service.register('window', 'scroll', callback1Spy);
  service.register('window', 'resize', callback2Spy);
  service.unregister('window', 'scroll', callback1Spy);
  window.dispatchEvent(new CustomEvent('resize'));

  assert.ok(callback1Spy.notCalled);
  assert.ok(callback2Spy.calledOnce);
  assert.ok(triggerSpy.calledOnce);

  service.unregister('window', 'resize', callback2Spy);
});

/* triggerEvent */

test('triggerEvent triggers the event at a throttled rate', function(assert) {
  assert.expect(2);

  let throttleSpy = sandbox.spy(Ember.run, 'throttle');
  let callbackStub = sandbox.stub();

  service.on('testing', callbackStub);
  service.triggerEvent('testing');

  assert.ok(throttleSpy.calledOnce);
  assert.ok(callbackStub.calledOnce);
});
