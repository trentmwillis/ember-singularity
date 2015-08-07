import setupBindPolyfill from './function-bind';
import setupCustomEventPolyfill from './custom-event';

export default function registerPolyfills() {
  setupBindPolyfill();
  setupCustomEventPolyfill();
}
