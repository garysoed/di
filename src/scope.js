const __globalBindings__ = Symbol('globalBindings');
const __key__ = Symbol('key');
const __parentScope__ = Symbol('parentScope');
const __provider__ = Symbol('provider');
const __searchAncestor__ = Symbol('searchAncestor');

class Scope {
  constructor(provider = null, key = '(root)', parentScope = null, globalBindings = new Map()) {
    this[__globalBindings__] = globalBindings;
    this[__key__] = key;
    this[__parentScope__] = parentScope;
    this[__provider__] = provider;
  }

  [__searchAncestor__](key) {
    if (this[__key__] === key) {
      return this;
    } else if (this[__parentScope__]){
      return this[__parentScope__][__searchAncestor__](key);
    } else {
      return undefined;
    }
  }

  with(key, provider) {
    return new Scope(provider, key, this, this[__globalBindings__]);
  }

  constant(key, value) {
    return this.with(key, () => value);
  }

  bind(key, fn) {
    let newScope = this.with(key, fn);
    if (this[__globalBindings__].has(key)) {
      throw new Error('Key ${key} is already bound');
    }
    this[__globalBindings__].set(key, newScope);
    return this;
  }

  run(fn) {
    let runScope = this.with('(run)', fn);
    return runScope.resolve('(run)');
  }

  resolve(key, runScope = this, runContext = new Map(), searchChain = []) {
    // Check if the key is already in the search chain.
    if (searchChain.indexOf(key) >= 0) {
      throw new Error(`Cyclic dependency:\n${searchChain.join(' -> ')} -> ${key}`);
    }

    let childSearchChain = searchChain.concat([key]);

    // First, find the ancestral scope.
    let scope = this[__searchAncestor__](key);

    // Second, find in the running scope.
    if (scope === undefined) {
      scope = runScope[__searchAncestor__](key);
    }

    // Finally, search in the global bindings.
    if (scope === undefined && this[__globalBindings__].has(key)) {
      scope = this[__globalBindings__].get(key);
    }

    if (scope === undefined) {
      return undefined;
    }

    if (!runContext.has(scope)) {
      let optional = key => {
        return scope.resolve(key, runScope, runContext, childSearchChain);
      };
      let require = key => {
        let value = optional(key);
        if (value === undefined) {
          throw new Error(`Cannot find ${key}:\n${searchChain.join(' -> ')} -> ${key}`);
        }
        return value;
      };

      runContext.set(scope, scope[__provider__](require, optional));
    }

    return runContext.get(scope);
  }

  toString() {
    let parentStrPart = this[__parentScope__] ? [this[__parentScope__].toString()] : [];
    return [this[__key__]].concat(parentStrPart).join(' -> ');
  }

  reset() {
    this[__globalBindings__].clear();
  }
}

export default Scope;
