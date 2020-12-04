import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';
import { run } from '@ember/runloop';
import sinon from 'sinon';

let service;
let sandbox;

module('Unit | Service | UnifiedEventHandler', function(hooks) {
  setupTest(hooks);

  hooks.beforeEach(function() {
    service = this.owner.lookup('service:unified-event-handler');
    sandbox = sinon.sandbox.create();
  });

  hooks.afterEach(function() {
    sandbox.restore();
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

    run(service, 'destroy');

    run(function() {
      window.dispatchEvent(new CustomEvent('scroll'));
      assert.ok(callbackStub.notCalled);
      done();
    });
  });

  test('cancels throttled events when service is destroyed', function(assert) {
    assert.expect(1);

    let callback = sandbox.stub();
    service.register('window', 'scroll', callback);

    for (let i = 0; i < 500; i++) {
      window.dispatchEvent(new CustomEvent('scroll'));
    }

    run(service, 'destroy');

    run(function() {
      assert.notOk(run.hasScheduledTimers(), 'No timers scheduled');
    });
  });

  test('unregisters multiple event listeners of same event type when service is destroyed', function(assert) {
    let done = assert.async();
    let callbackStub = sandbox.stub();
    let callbackBStub = sandbox.stub();
    service.register('window', 'scroll', callbackStub);
    service.register('window', 'scroll', callbackBStub);

    run(service, 'destroy');

    run(function() {
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

    run(service, 'destroy');

    run(function() {
      window.dispatchEvent(new CustomEvent('resize'));
      window.dispatchEvent(new CustomEvent('scroll'));
      assert.ok(callbackStub.notCalled);
      assert.ok(callbackBStub.notCalled);
      done();
    });
  });

  test('register binds multiple callbacks to the event on the specified target but only triggers once', function(assert) {
    assert.expect(3);

    let callback1Stub = sandbox.stub();
    let callback2Stub = sandbox.stub();

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

  test('registered callbacks will recieve the original event', function(assert) {
    assert.expect(1);

    const callback1Stub = sandbox.spy();

    service.register('window', 'keyup', callback1Stub);

    const customEvent = new CustomEvent('keyup');

    window.dispatchEvent(customEvent);

    assert.ok(callback1Stub.calledWith(customEvent));

    service.unregister('window', 'keyup', callback1Stub);
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
    assert.expect(1);

    let callback = sandbox.stub();

    service.register('window', 'scroll', callback);
    service.unregister('window', 'scroll', callback);
    window.dispatchEvent(new CustomEvent('scroll'));

    assert.ok(callback.notCalled);
  });

  test('unregister destroys the DOM handler for an event after all callbacks have been unbound but leaves other events', function(assert) {
    assert.expect(2);

    let callback1 = sandbox.stub();
    let callback2 = sandbox.stub();

    service.register('window', 'scroll', callback1);
    service.register('window', 'resize', callback2);
    service.unregister('window', 'scroll', callback1);
    window.dispatchEvent(new CustomEvent('resize'));

    assert.ok(callback1.notCalled);
    assert.ok(callback2.calledOnce);

    service.unregister('window', 'resize', callback2);
  });

  test('soft unregister, unregister will not attempt to unregister a previously unregistered target', function(assert) {
    assert.expect(1);

    let callback1 = sandbox.stub();

    service.register('window', 'resize', callback1);
    service.unregister('window', 'resize', callback1);
    service.unregister('window', 'resize', callback1);

    assert.ok(true, 'Unregister does not throw an exception');
  });

  test('soft unregister, unregister will not attempt to unregister a previously unregistered targets event', function(assert) {
    assert.expect(3);

    let callback1 = sandbox.stub();
    let callback2 = sandbox.stub();

    service.register('window', 'resize', callback1);
    service.register('window', 'scroll', callback2);

    service.unregister('window', 'scroll', callback2);
    service.unregister('window', 'scroll', callback2);

    assert.ok(true, 'Unregister does not throw an exception');

    window.dispatchEvent(new CustomEvent('resize'));

    assert.ok(callback2.notCalled);
    assert.ok(callback1.calledOnce);

    service.unregister('window', 'resize', callback1);
  });

  /* triggerEvent */

  test('triggerEvent triggers the event at a throttled rate', function(assert) {
    assert.expect(1);

    let callbackStub = sandbox.stub();

    service.register('window', 'scroll', callbackStub);
    window.dispatchEvent(new CustomEvent('scroll'));

    assert.ok(callbackStub.calledOnce);

    service.unregister('window', 'scroll', callbackStub);
  });

  /* Event interval */
  test('runThrottle is called with passed event interval', function(assert) {
    assert.expect(1);

    let callbackStub = sandbox.stub();
    let interval = 10;
    let runThrottleSpy = sandbox.spy(service, '_runThrottle')

    service.register('window', 'scroll', callbackStub, interval);
    window.dispatchEvent(new CustomEvent('scroll'));

    assert.ok(runThrottleSpy.calledWithExactly(sinon.match.any, interval, sinon.match.any));

    service.unregister('window', 'scroll', callbackStub);
  });
});
