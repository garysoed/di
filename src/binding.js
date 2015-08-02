const __binding__ = Symbol();
const __cachedValue__ = Symbol();
const __key__ = Symbol();
const __provider__ = Symbol();
const __scope__ = Symbol();

class Binding {
  constructor(key, fn, scope) {
    this[__key__] = key;
    this[__provider__] = fn;
    this[__scope__] = scope;
  }

  resolve(runContext, searchChain = []) {
    if (!runContext.has(this[__key__])) {
      let optional = key => {
        let binding = this[__scope__].findBinding(key);

        // Check if the key is already in the search chain.
        if (searchChain.indexOf(key) >= 0) {
          throw new Error(`Cyclic dependency:\n${searchChain.join(' -> ')} -> ${key}`);
        }

        if (binding === undefined) {
          return undefined;
        } else {
          return binding.resolve(runContext, searchChain.concat([key]));
        }
      };

      let require = key => {
        let value = optional(key);
        if (value === undefined) {
          throw new Error(`Cannot find ${key}:\n${searchChain.join(' -> ')} -> ${key}`);
        }
        return value;
      };

      runContext.set(this[__key__], this[__provider__](require, optional));
    }

    return runContext.get(this[__key__]);
  }

  get provider() {
    return this[__provider__];
  }
}

export default Binding;
