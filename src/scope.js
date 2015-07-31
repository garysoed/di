// Private symbols.
const __localBindings__ = Symbol('localBindings');
const __parentScope__ = Symbol('parentScope');
const __prefix__ = Symbol('prefix');
const __rootScope__ = Symbol('rootScope');

const __registerProvider__ = Symbol('registerProvider');
const __findProvider__ = Symbol('findProvider');

class Scope {
  /**
   * Scope containing local bindings.
   *
   * @class DI.Scope
   * @constructor
   * @param {DI.Scope} [parentScope=null] The parent scope.
   */
  constructor(parentScope = null, rootScope = this) {
    this[__localBindings__] = new Map();
    this[__parentScope__] = parentScope;
    this[__rootScope__] = rootScope;
  }

  [__registerProvider__](normalizedKey, fn) {
    if (this[__localBindings__].has(normalizedKey)) {
      throw new Error(`${normalizedKey} is already bound`);
    }
    this[__localBindings__].set(normalizedKey, fn);
  }

  [__findProvider__](normalizedKey) {
    // Checks the local binding.
    let provider = this[__localBindings__].get(normalizedKey);
    if (provider === undefined) {
      if (this[__parentScope__]) {
        return this[__parentScope__][__findProvider__](normalizedKey);
      } else {
        return undefined;
      }
    } else {
      return provider;
    }
  }

  /**
   * Creates a new child scope with the given value bound to the given key in its local binding.
   *
   * TODO(gs)
   *
   * @method with
   * @param {string} key The key to bound the value to.
   * @param {Object} keys Object with mapping of variable name to the bound name.
   * @param {Function} fn The provider function to run.
   * @return {DI.Scope} The newly created child scope.
   */
  with(key, fn) {
    let childScope = new Scope(this, this[__rootScope__]);
    childScope[__registerProvider__](key, fn);
    return childScope;
  }

  /**
   * Creates a new child scope with the given value bound to the given key in its local binding.
   * This is similar to {{#crossLink "DI.Scope/with"}}{{/crossLink}}, but the value is a constant.
   *
   * @method constant
   * @param {string} key The key to bound the value to.
   * @param {Object} value The object to bind to the given key.
   * @return {DI.Scope} The newly created child scope.
   */
  constant(key, value) {
    return this.with(key, () => value);
  }

  /**
   * Binds the given value to the given key. The execution scope of the provider function is still
   * this scope.
   *
   * TODO(gs)
   *
   * @method bind
   * @param {string} key The key to bound the value to.
   * @param {Object} keys Object with mapping of variable name to the bound name.
   * @param {Function} fn The provider function to run.
   */
  bind(key, fn) {
    this[__rootScope__][__registerProvider__](key, fn);
    return this;
  }

  /**
   * Runs the given function after injecting any dependencies.
   *
   * TODO(gs)
   *
   * @method run
   * @param {Function} fn The function to run.
   */
  run(fn) {
    let resolvedValues = new Map();

    let optional = key => {
      let normalizedKey = key;
      if (resolvedValues.has(normalizedKey)) {
        return resolvedValues.get(normalizedKey);
      }

      let provider = this[__findProvider__](normalizedKey);
      if (provider === undefined) {
        return undefined;
      } else {
        let value = provider(require, optional);
        resolvedValues.set(normalizedKey, value);
        return value;
      }
    };

    let require = key => {
      let value = optional(key);
      if (value === undefined) {
        throw new Error(`Cannot find ${key}`);
      }
      return value;
    };

    return fn(require, optional);
  }

  reset() {
    this[__localBindings__].clear();
  }
}

export default Scope;
