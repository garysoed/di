import Scope from './scope';

function wrap(keys, fn) {
  return (require, optional) => {
    let injector = {};

    for (let argName of Object.keys(keys)) {
      let key = keys[argName];

      // Check if the key is optional.
      let isOptional = key[key.length - 1] === '?';
      if (isOptional) {
        key = key.substring(0, key.length - 1);
      }

      // Now replace any = in the key with the argument name.
      key = key.replace('=', argName.trim());

      if (isOptional) {
        injector[argName] = optional(key);
      } else {
        injector[argName] = require(key);
      }
    }
    return fn(injector);
  };
}

class OldScope extends Scope {
  constructor(parentScope = null, prefix = '') {
    super(parentScope, prefix);
  }

  with(key, keys, fn) {
    return super.with(key, wrap(keys, fn));
  }

  bind(key, keys, fn) {
    return super.bind(key, wrap(keys, fn));
  }

  run(keys, fn) {
    return super.run(wrap(keys, fn));
  }

  constant(key, value) {
    return this.with(key, {}, () => value);
  }
}

export default OldScope;
