import Globals from './globals';

const __get__ = Globals.get;

// Private symbols.
const __function__ = Symbol();
const __localScope__ = Symbol('localScope');
const __name__ = Symbol();
const __prefix__ = Symbol('prefix');
const __keys__ = Symbol();
const __resolvedValues__ = Symbol();

const FN_ARGS = /^function\s*[^\(]*\(\s*([^\)]*)\)/m;

class Provider {

  /**
   * @class DI.Provider
   * @constructor
   * @param {Function} fn The function to run. The function should take one argument, which is an
   *    object that will contain the injected values, keyed by the given keys.
   * @param {Object} keys Mapping of objects to inject to the function.
   * @param {string} prefix The prefix to use for the keys.
   * @param {DI.Scope} localScope The local scope. This will be prioritized when checking for bound
   *    values.
   * @param {string} [name=null] Reference name of the provider. This is used for detecting cyclic
   *    dependencies.
   */
  constructor(fn, keys, prefix, localScope, name = null) {
    this[__function__] = fn;
    this[__keys__] = keys;
    this[__prefix__] = prefix;
    this[__localScope__] = localScope;
    this[__name__] = name;
    this[__resolvedValues__] = new Map();
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
      let resolvedArgs = {};
      for (let argName in this[__keys__]) {
        let key = this[__keys__][argName];

        // Check if the key is optional.
        let optional = key[key.length - 1] === '?';
        if (optional) {
          key = key.substring(0, key.length - 1);
        }

        // Check if the key is root key.
        let isRoot = key[0] === '/';
        if (isRoot) {
          key = key.substring(1);
        } else if (this[__prefix__]) {
          key = `${this[__prefix__]}.${key}`;
        }

        // Now replace any = in the key with the argument name.
        key = key.replace('=', argName.trim());

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
            throw `${e}\n\twhile providing ${this[__name__]}`;
          } else {
            throw `${e}\n\twhile running expression`;
          }
        }

        if (value === undefined) {
          if (optional) {
            resolvedArgs[argName] = undefined;
          } else if (this[__name__]) {
            throw `Cannot find ${key} while providing ${this[__name__]}`;
          } else {
            throw `Cannot find ${key} while running expression`;
          }
        } else {
          resolvedArgs[argName] = value;
        }
      }

      let value;

      try {
        value = this[__function__](resolvedArgs);
      } catch (e) {
        if (this[__name__]) {
          throw `Uncaught exception ${e}\n\twhile running provider ${this[__name__]}`;
        } else {
          throw `Uncaught exception ${e}\n\twhile running expression`;
        }
      }

      if (value === undefined && this[__name__]) {
        console.warn(`Value of ${this[__name__]} is undefined`);
      }

      this[__resolvedValues__].set(scope, value);
    }

    return this[__resolvedValues__].get(scope);
  }
}

export default Provider;