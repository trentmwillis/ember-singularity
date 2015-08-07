// Polyfill from MDN: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/bind#Polyfill
export default function setupBindPolyfill() {
  if (!Function.prototype.bind) {
    Function.prototype.bind = function(oThis) {
      if (typeof this !== 'function') {
        // closest thing possible to the ECMAScript 5
        // internal IsCallable function
        throw new TypeError('Function.prototype.bind - what is trying to be bound is not callable');
      }

      var aArgs   = Array.prototype.slice.call(arguments, 1),
          fToBind = this,
          Noop    = function() {},
          Bound  = function() {
            return fToBind.apply(this instanceof Noop ? this : oThis,
                   aArgs.concat(Array.prototype.slice.call(arguments)));
          };

      Noop.prototype = this.prototype;
      Bound.prototype = new Noop();

      return Bound;
    };
  }
}
