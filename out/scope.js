<html><head></head><body>const __globalBindings__ = Symbol('globalBindings');
const __name__ = Symbol('name');
const __parentScope__ = Symbol('parentScope');
const __provider__ = Symbol('provider');
const __resolve__ = Symbol('resolve');
const __searchAncestor__ = Symbol('searchAncestor');

class Scope {

  /**
   * Represents a binding scope.
   *
   * @class dijs.Scope
   * @constructor
   * @param {string} name Name of this scope.
   * @param {Function} provider Provider bound to this scope.
   * @param {Map} globalBindings Reference to the global bindings.
   * @param {dijs.Scope} [parentScope] The parent scope object. Defaults to null.
   */
  constructor(name, provider, globalBindings, parentScope = null) {
    this[__name__] = name;
    this[__provider__] = provider;
    this[__globalBindings__] = globalBindings;
    this[__parentScope__] = parentScope;
  }

  /**
   * Searches the ancestor for a scope with the given name.
   *
   * @method __searchAncestor__
   * @param {string} name Name of the scope to be returned.
   * @return {dijs.Scope} Ancestor scope, or the current scope, with the given name. Or null if
   *    no scopes can be found.
   * @private
   */
  [__searchAncestor__](name) {
    if (this[__name__] === name) {
      return this;
    } else if (this[__parentScope__]){
      return this[__parentScope__][__searchAncestor__](name);
    } else {
      return undefined;
    }
  }

  /**
   * Runs the provider bound to the given key and return its value.
   *
   * @method resolve
   * @param {string} key Key of the bound provider to be ran.
   * @param {dijs.Scope} [runScope] The scope to run the provider in. Any local bindings to this
   *    scope will override any global bindings in the run context.
   * @param {Map} [runContext] Cache of resolved keys during this run. Defaults to empty map.
   * @param {Array} [resolveChain] Array of keys to keep track of the resolution chain. This is
   *    used for cyclic dependency. Defaults to empty array.
   * @return {Object} The value bound to the given key.
   * @private
   */
  [__resolve__](key, runScope = this, runContext = new Map(), resolveChain = []) {
    // Check if the key is already in the search chain.
    if (resolveChain.indexOf(key) &gt;= 0) {
      throw new Error(`Cyclic dependency:\n${resolveChain.join(' -&gt; ')} -&gt; ${key}`);
    }

    let childSearchChain = resolveChain.concat([key]);

    // First, find the ancestral scope.
    let scope = this[__searchAncestor__](key);

    // Second, find in the running scope.
    if (scope === undefined) {
      scope = runScope[__searchAncestor__](key);
    }

    // Finally, search in the global bindings.
    if (scope === undefined &amp;&amp; this[__globalBindings__].has(key)) {
      scope = this[__globalBindings__].get(key);
    }

    if (scope === undefined) {
      return undefined;
    }

    if (!runContext.has(scope)) {
      let optional = key =&gt; {
        return scope[__resolve__](key, runScope, runContext, childSearchChain);
      };
      let require = key =&gt; {
        let value = optional(key);
        if (value === undefined) {
          throw new Error(`Cannot find ${key}:\n${resolveChain.join(' -&gt; ')} -&gt; ${key}`);
        }
        return value;
      };

      runContext.set(scope, scope[__provider__](require, optional));
    }

    return runContext.get(scope);
  }

  /**
   * Locally binds the given provider to the given key.
   *
   * @method with
   * @param {string} key The key to bind the provider to.
   * @param {Function} provider The provider function to bind.
   * @return {dijs.Scope} The child scope with the bound provider.
   */
  with(key, provider) {
    return new Scope(key, provider, this[__globalBindings__], this);
  }

  /**
   * Locally bind the given constant to the given key.
   *
   * @method constant
   * @param {string} key The key to bind the constant to.
   * @param {Object} value The constant to bind.
   * @return {dijs.Scope} The child scope with the bound constant.
   */
  constant(key, value) {
    return this.with(key, () =&gt; value);
  }

  /**
   * Globally binds the given provider to the given key.
   *
   * @method bind
   * @param {string} key The key to bind the provider to.
   * @param {Function} fn The provider function to bind.
   * @return {dijs.Scope} This scope for chaining.
   */
  bind(key, fn) {
    let newScope = this.with(key, fn);
    if (this[__globalBindings__].has(key)) {
      throw new Error('Key ${key} is already bound');
    }
    this[__globalBindings__].set(key, newScope);
    return this;
  }

  /**
   * Runs the given provider.
   *
   * @method run
   * @param {Function} fn The provider to run.
   * @return {Object} The value returned by the provider.
   */
  run(fn) {
    return this.with('(run)', fn)[__resolve__]('(run)');
  }

  /**
   * Pretty prints this scope.
   *
   * @method toString
   * @return {string} Pretty printed string of this scope.
   */
  toString() {
    let parentStrPart = this[__parentScope__] ? [this[__parentScope__].toString()] : [];
    return [this[__name__]].concat(parentStrPart).join(' -&gt; ');
  }

  /**
   * Clears any global bindings.
   *
   * @method reset
   */
  reset() {
    this[__globalBindings__].clear();
  }
}

export default Scope;
</body></html>