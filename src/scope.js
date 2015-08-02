import Binding from './binding';
import RunContext from './runcontext';

// Private symbols.
const __localBindings__ = Symbol('localBindings');
const __parentScope__ = Symbol('parentScope');
const __prefix__ = Symbol('prefix');
const __rootScope__ = Symbol('rootScope');

const __addBinding__ = Symbol('registerProvider');
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

  [__addBinding__](key, binding) {
    if (this[__localBindings__].has(key)) {
      throw new Error(`${key} is already bound`);
    }
    this[__localBindings__].set(key, binding);
  }

  findBinding(key) {
    // Checks the local binding.
    let binding = this[__localBindings__].get(key);
    if (binding === undefined) {
      if (this[__parentScope__]) {
        return this[__parentScope__].findBinding(key);
      } else {
        return undefined;
      }
    } else {
      return binding;
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
    let binding = new Binding(key, fn, childScope);
    childScope[__addBinding__](key, binding);
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
    let binding = new Binding(key, fn, this);
    this[__rootScope__][__addBinding__](key, binding);
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
    let runBinding = new Binding(null, fn, this);

    // Resolves all the bindings in the current scope.
    let resolvedValues = new RunContext();

    let resolveBindings = function(scope) {
      for (let [key, binding] of scope[__localBindings__]) {
        binding.resolve(resolvedValues);
      }

      if (scope[__parentScope__]) {
        resolveBindings(scope[__parentScope__]);
      }
    };

    resolveBindings(this);
    return runBinding.resolve(resolvedValues);
  }

  reset() {
    this[__localBindings__].clear();
  }
}

export default Scope;
