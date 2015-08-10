/**
 * An array of possible global objects to bind to. Defined separately, since
 * they can't be selected via a CSS selector string.
 * @type {Array}
 */
const GLOBALS = ['window', 'document'];

/**
 * Given a selector string return a DOM element. Specially handles global
 * objects and throws an error if a non-string is passed.
 * @public
 * @throws {Error}
 * @param  {String} target
 * @return {HTMLElement}
 */
export default function lookupElement(target) {
  let targetElement;

  if (GLOBALS.indexOf(target) > -1) {
    switch (target) {
      case 'window':
        targetElement = window;
        break;
      case 'document':
        targetElement = document;
        break;
    }
  } else if (typeof target === 'string') {
    targetElement = document.querySelector(target);
  } else {
    throw new Error(`Ember Singularity expects elements to be looked up via a selector string. Please pass targets as strings, and not a "${typeof target}"`);
  }

  if (!targetElement) {
    throw new Error(`The target selector "${target}" was passed, but could not be retrieved from the DOM.`);
  }

  return targetElement;
}
