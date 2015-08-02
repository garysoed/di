const __data__ = Symbol();

class RunContext {
  constructor() {
    this[__data__] = new Map();
  }

  add(scope, key, value) {
    if (!this[__data__].has(scope)) {
      this[__data__].set(scope, new Map());
    }

    this[__data__].get(scope).set(key, value);
  }

  get(scope, key) {
    if (this.has(scope, key)) {
      return this[__data__].get(scope).get(key);
    } else {
      return undefined;
    }
  }

  has(scope, key) {
    return this[__data__].has(scope) && this[__data__].get(scope).has(key);
  }
}

export default RunContext;
