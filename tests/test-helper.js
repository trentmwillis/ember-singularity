import resolver from './helpers/resolver';
import { setResolver } from 'ember-qunit';

import registerPolyfills from './helpers/polyfills/register';
registerPolyfills();

setResolver(resolver);
