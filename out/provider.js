<html><head></head><body>import Globals from './globals';

const __get__ = Globals.get;

// Private symbols.
const __function__ = Symbol();
const __localScope__ = Symbol('localScope');
const __name__ = Symbol();
const __normalizeKey__ = Symbol();
const __prefix__ = Symbol('prefix');
const __resolvedValues__ = Symbol();
const __searchValue__ = Symbol();

function createError(msg, cause) {
  return new Error(`${msg}\nCaused by:\n${cause.stack}`);
}

class Provider {

  /**
   * @class DI.Provider
   * @constructor
   * @param {Function} fn The function to run. The function should take one argument, which is an
   *    object that will contain the injected values, keyed by the given keys.
   * @param {string} prefix The prefix to use for the keys.
   * @param {DI.Scope} localScope The local scope. This will be prioritized when checking for bound
   *    values.
   * @param {string} [name=null] Reference name of the provider. This is used for detecting cyclic
   *    dependencies.
   */
  constructor(fn, prefix, localScope, name = null) {
    this[__function__] = fn;
    this[__prefix__] = prefix;
    this[__localScope__] = localScope;
    this[__name__] = name;
    this[__resolvedValues__] = new Map();
  }

  /**
   * Searches for the value with the given key. First, it tries searching in the local scope. Then
   * it searches in the given scope. If the key is still not found, it searches in the global
   * scope.
   *
   * @method __searchValue__
   * @param {string} key Key to search the value by
   * @param {[DI.Scope} scope Scope to search the value in.
   * @return {any} Value corresponding to the given key, or undefined if none were found.
   * @private
   */
  [__searchValue__](key, scope) {
    // Normalize the key.
    key = this[__normalizeKey__](key);

    // TODO(gs): Handle cyclic dependency.
    let value;

    try {
      // Check the local scope first.
      value = this[__localScope__][__get__](key, scope);

      if (value === undefined) {
        // If value cannot be resolved in the local scope, check the given scope.
        value = scope[__get__](key, scope);
      }

      if (value === undefined) {
        // If value cannot be resolved in the local scope, check the global bindings.
        value = Globals.getGlobal(key, scope);
      }
    } catch (e) {
      // TODO(gs): Make a shared method.
      if (this[__name__]) {
        throw createError(`${e}\n\twhile providing ${this[__name__]}`, e);
      } else {
        throw createError(`${e}\n\twhile running expression`, e);
      }
    }

    return value;
  }

  /**
   * Normalizes the given key.
   *
   * @method __normalizeKey__
   * @param {string} key The key to normalize.
   * @return {string} The normalized key.
   * @private
   */
  [__normalizeKey__](key) {
    // Check if the key is root key.
    let isRoot = key[0] === '/';
    if (isRoot) {
      return key.substring(1);
    } else if (this[__prefix__]) {
      return `${this[__prefix__]}.${key}`;
    } else {
      return key;
    }
  }

  /**
   * Resolves the provider. Resolved values are cached per scope.
   *
   * @method resolve
   * @param {DI.Scope} scope The scope to resolve the value in.
   * @return {Object} The resolved value for the given scope.
   */
  resolve(scope) {
    if (!this[__resolvedValues__].has(scope)) {
      let optional = key =&gt; {
        return this[__searchValue__](key, scope);
      };

      let require = key =&gt; {
        let value = optional(key);
        if (value === undefined) {
          if (this[__name__]) {
            throw new Error(`Cannot find ${key} while providing ${this[__name__]}`);
          } else {
            throw new Error(`Cannot find ${key} while running expression`);
          }
        }
        return value;
      };

      // Now run the function
      let value;
      try {
        value = this[__function__](require, optional);
      } catch (e) {
        if (this[__name__]) {
          throw createError(
              `Uncaught exception ${e}\n\twhile running provider ${this[__name__]}`, e);
        } else {
          throw createError(`Uncaught exception ${e}\n\twhile running expression`, e);
        }
      }

      if (value === undefined &amp;&amp; this[__name__]) {
        console.warn(`Value of ${this[__name__]} is undefined`);
      }

      this[__resolvedValues__].set(scope, value);
    }

    return this[__resolvedValues__].get(scope);
  }
}

export default Provider;
</body></html>