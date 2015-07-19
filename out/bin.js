(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
"use strict";

var _createClass = (function () { function defineProperties(target, props) { for (var key in props) { var prop = props[key]; prop.configurable = true; if (prop.value) prop.writable = true; } Object.defineProperties(target, props); } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };

// Private symbols.
var __values__ = Symbol("values");

var SEPARATOR = "_";

var BindingTree = (function () {

  /**
   * Represents a tree of bound values keyed by binding key.
   * @class DI.BindingTree
   * @constructor
   */

  function BindingTree() {
    _classCallCheck(this, BindingTree);

    this[__values__] = new Map();
  }

  _createClass(BindingTree, {
    add: {

      /**
       * Adds the given key and value to the tree. The tree will try to bind using the last segment of
       * the key. If this causes a conflict, it will create a subtree.
       *
       * @method add
       * @param {string} key The key to bind the value to.
       * @param {Object} value The value to be bound.
       * @param {number} [depth=0] The depth of the key to use as binding key. This should not be
       *    called from outside the class.
       */

      value: function add(key, value) {
        var depth = arguments[2] === undefined ? 0 : arguments[2];

        // TODO(gs): Remove the separator
        var segments = key.split(SEPARATOR);
        var bindingKey = segments[segments.length - 1 - depth];

        if (!this[__values__].has(bindingKey)) {
          this[__values__].set(bindingKey, {
            key: key,
            value: value
          });
        } else {
          // There is already a value corresponding to this key
          var existingValue = this[__values__].get(bindingKey);
          if (existingValue.key === key) {
            throw "Key " + key + " is already bound";
          }

          var newTree = new BindingTree();
          this[__values__].set(bindingKey, newTree);
          newTree.add(existingValue.key, existingValue.value, depth + 1);
          newTree.add(key, value, depth + 1);
        }
      }
    },
    get: {

      /**
       * Returns the value corresponding to the given key.
       *
       * @param {string} key Key of the value to return.
       * @param {number} [depth=0] The depth of the key to use as binding key. This should not be
       *    called from outside the class.
       * @return {any} The bound value, or undefined if the value cannot be found, or if the key has
       *    collision but collision cannot be resolved.
       */

      value: function get(key) {
        var depth = arguments[1] === undefined ? 0 : arguments[1];

        var segments = key.split(SEPARATOR);
        var bindingKey = segments[segments.length - 1 - depth];

        if (bindingKey === undefined) {
          return undefined;
        }

        if (!this[__values__].has(bindingKey)) {
          return undefined;
        }

        var value = this[__values__].get(bindingKey);
        if (value instanceof BindingTree) {
          return value.get(key, depth + 1);
        } else {
          return value.value;
        }
      }
    }
  });

  return BindingTree;
})();

module.exports = BindingTree;

},{}],2:[function(require,module,exports){
"use strict";

var _interopRequire = function (obj) { return obj && obj.__esModule ? obj["default"] : obj; };

var BindingTree = _interopRequire(require("./bindingtree"));

var Globals = {
  get: Symbol("get"),

  getGlobal: function getGlobal(key, scope) {
    var globalProvider = this.bindings.get(key);
    if (globalProvider === undefined) {
      return undefined;
    } else {
      return globalProvider.resolve(scope);
    }
  },

  bindings: new BindingTree()
};

module.exports = Globals;

},{"./bindingtree":1}],3:[function(require,module,exports){
"use strict";

var _interopRequire = function (obj) { return obj && obj.__esModule ? obj["default"] : obj; };

var BindingTree = _interopRequire(require("./bindingtree"));

var Globals = _interopRequire(require("./globals"));

var Provider = _interopRequire(require("./provider"));

var Scope = _interopRequire(require("./scope"));

var OldScope = _interopRequire(require("./oldscope"));

(function (window) {
  window.DIJS = new Scope();
  window.DIJS.Scope = Scope;

  window.DI = new OldScope();
  window.DI.OldScope = OldScope;

  window.DI.BindingTree = BindingTree;
  window.DI.Provider = Provider;
  window.DI.bindings = Globals.bindings;
})(window);

},{"./bindingtree":1,"./globals":2,"./oldscope":4,"./provider":5,"./scope":6}],4:[function(require,module,exports){
"use strict";

var _interopRequire = function (obj) { return obj && obj.__esModule ? obj["default"] : obj; };

var _createClass = (function () { function defineProperties(target, props) { for (var key in props) { var prop = props[key]; prop.configurable = true; if (prop.value) prop.writable = true; } Object.defineProperties(target, props); } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(object, property, receiver) { var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc && desc.writable) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _inherits = function (subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; };

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };

var Scope = _interopRequire(require("./scope"));

function wrap(keys, fn) {
  return function (require, optional) {
    var injector = {};

    var _iteratorNormalCompletion = true;
    var _didIteratorError = false;
    var _iteratorError = undefined;

    try {
      for (var _iterator = Object.keys(keys)[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
        var argName = _step.value;

        var key = keys[argName];

        // Check if the key is optional.
        var isOptional = key[key.length - 1] === "?";
        if (isOptional) {
          key = key.substring(0, key.length - 1);
        }

        // Now replace any = in the key with the argument name.
        key = key.replace("=", argName.trim());

        if (isOptional) {
          injector[argName] = optional(key);
        } else {
          injector[argName] = required(key);
        }
      }
    } catch (err) {
      _didIteratorError = true;
      _iteratorError = err;
    } finally {
      try {
        if (!_iteratorNormalCompletion && _iterator["return"]) {
          _iterator["return"]();
        }
      } finally {
        if (_didIteratorError) {
          throw _iteratorError;
        }
      }
    }

    return fn(injector);
  };
}

var OldScope = (function (_Scope) {
  function OldScope() {
    var parentScope = arguments[0] === undefined ? null : arguments[0];
    var prefix = arguments[1] === undefined ? "" : arguments[1];

    _classCallCheck(this, OldScope);

    _get(Object.getPrototypeOf(OldScope.prototype), "constructor", this).call(this, parentScope, prefix);
  }

  _inherits(OldScope, _Scope);

  _createClass(OldScope, {
    "with": {
      value: function _with(key, keys, fn) {
        return _get(Object.getPrototypeOf(OldScope.prototype), "with", this).call(this, key, wrap(keys, fn));
      }
    },
    bind: {
      value: function bind(key, keys, fn) {
        return _get(Object.getPrototypeOf(OldScope.prototype), "bind", this).call(this, key, wrap(keys, fn));
      }
    },
    run: {
      value: function run(keys, fn) {
        return _get(Object.getPrototypeOf(OldScope.prototype), "run", this).call(this, wrap(keys, fn));
      }
    },
    constant: {
      value: function constant(key, value) {
        return this["with"](key, {}, function () {
          return value;
        });
      }
    }
  });

  return OldScope;
})(Scope);

module.exports = OldScope;

},{"./scope":6}],5:[function(require,module,exports){
"use strict";

var _interopRequire = function (obj) { return obj && obj.__esModule ? obj["default"] : obj; };

var _createComputedClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var prop = props[i]; prop.configurable = true; if (prop.value) prop.writable = true; Object.defineProperty(target, prop.key, prop); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };

var Globals = _interopRequire(require("./globals"));

var __get__ = Globals.get;

// Private symbols.
var __function__ = Symbol();
var __localScope__ = Symbol("localScope");
var __name__ = Symbol();
var __normalizeKey__ = Symbol();
var __prefix__ = Symbol("prefix");
var __resolvedValues__ = Symbol();
var __searchValue__ = Symbol();

function createError(msg, cause) {
  return new Error("" + msg + "\nCaused by:\n" + cause.stack);
}

var Provider = (function () {

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

  function Provider(fn, prefix, localScope) {
    var name = arguments[3] === undefined ? null : arguments[3];

    _classCallCheck(this, Provider);

    this[__function__] = fn;
    this[__prefix__] = prefix;
    this[__localScope__] = localScope;
    this[__name__] = name;
    this[__resolvedValues__] = new Map();
  }

  _createComputedClass(Provider, [{
    key: __searchValue__,

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
    value: function (key, scope) {
      // Normalize the key.
      key = this[__normalizeKey__](key);

      // TODO(gs): Handle cyclic dependency.
      var value = undefined;

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
          throw createError("" + e + "\n\twhile providing " + this[__name__], e);
        } else {
          throw createError("" + e + "\n\twhile running expression", e);
        }
      }

      return value;
    }
  }, {
    key: __normalizeKey__,

    /**
     * Normalizes the given key.
     *
     * @method __normalizeKey__
     * @param {string} key The key to normalize.
     * @return {string} The normalized key.
     * @private
     */
    value: function (key) {
      // Check if the key is root key.
      var isRoot = key[0] === "/";
      if (isRoot) {
        return key.substring(1);
      } else if (this[__prefix__]) {
        return "" + this[__prefix__] + "." + key;
      } else {
        return key;
      }
    }
  }, {
    key: "resolve",

    /**
     * Resolves the provider. Resolved values are cached per scope.
     *
     * @method resolve
     * @param {DI.Scope} scope The scope to resolve the value in.
     * @return {Object} The resolved value for the given scope.
     */
    value: function resolve(scope) {
      var _this = this;

      if (!this[__resolvedValues__].has(scope)) {
        (function () {
          var optional = function (key) {
            return _this[__searchValue__](key, scope);
          };

          var require = function (key) {
            var value = optional(key);
            if (value === undefined) {
              if (_this[__name__]) {
                throw new Error("Cannot find " + key + " while providing " + _this[__name__]);
              } else {
                throw new Error("Cannot find " + key + " while running expression");
              }
            }
            return value;
          };

          // Now run the function
          var value = undefined;
          try {
            value = _this[__function__](require, optional);
          } catch (e) {
            if (_this[__name__]) {
              throw createError("Uncaught exception " + e + "\n\twhile running provider " + _this[__name__], e);
            } else {
              throw createError("Uncaught exception " + e + "\n\twhile running expression", e);
            }
          }

          if (value === undefined && _this[__name__]) {
            console.warn("Value of " + _this[__name__] + " is undefined");
          }

          _this[__resolvedValues__].set(scope, value);
        })();
      }

      return this[__resolvedValues__].get(scope);
    }
  }]);

  return Provider;
})();

module.exports = Provider;

},{"./globals":2}],6:[function(require,module,exports){
"use strict";

var _interopRequire = function (obj) { return obj && obj.__esModule ? obj["default"] : obj; };

var _createComputedClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var prop = props[i]; prop.configurable = true; if (prop.value) prop.writable = true; Object.defineProperty(target, prop.key, prop); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };

var BindingTree = _interopRequire(require("./bindingtree"));

var Provider = _interopRequire(require("./provider"));

var Globals = _interopRequire(require("./globals"));

// Private symbols.
var __localBindings__ = Symbol("localBindings");
var __parentScope__ = Symbol("parentScope");
var __prefix__ = Symbol("prefix");

var __createProvider__ = Symbol();

var __get__ = Globals.get;

var Scope = (function () {
  /**
   * Scope containing local bindings.
   *
   * @class DI.Scope
   * @constructor
   * @param {DI.Scope} [parentScope=null] The parent scope.
   */

  function Scope() {
    var parentScope = arguments[0] === undefined ? null : arguments[0];
    var prefix = arguments[1] === undefined ? "" : arguments[1];

    _classCallCheck(this, Scope);

    this[__localBindings__] = new BindingTree();
    this[__parentScope__] = parentScope;
    this[__prefix__] = prefix;
  }

  _createComputedClass(Scope, [{
    key: __createProvider__,
    value: function (fn) {
      var name = arguments[1] === undefined ? null : arguments[1];

      return new Provider(fn, this[__prefix__], this, name);
    }
  }, {
    key: __get__,
    value: function (key, scope) {
      var provider = this[__localBindings__].get(key);
      if (provider === undefined) {
        if (this[__parentScope__]) {
          return this[__parentScope__][__get__](key, scope);
        } else {
          return undefined;
        }
      } else {
        return provider.resolve(scope);
      }
    }
  }, {
    key: "with",

    /**
     * Creates a new child scope with the given value bound to the given key in its local binding.
     *
     * @method with
     * @param {string} key The key to bound the value to.
     * @param {Object} keys Object with mapping of variable name to the bound name.
     * @param {Function} fn The function to run. The function will have one argument, containing
     *    bound properties. Each property is named following they keys specified in the `keys`
     *    attribute.
     * @return {DI.Scope} The newly created child scope.
     */
    value: function _with(key, fn) {
      var childScope = new Scope(this, this[__prefix__]);
      childScope[__localBindings__].add(append(this[__prefix__], key), this[__createProvider__](fn, key));
      return childScope;
    }
  }, {
    key: "constant",

    /**
     * Creates a new child scope with the given value bound to the given key in its local binding.
     * This is similar to {{#crossLink "DI.Scope/with"}}{{/crossLink}}, but the value is a constant.
     *
     * @method constant
     * @param {string} key The key to bound the value to.
     * @param {Object} value The object to bind to the given key.
     * @return {DI.Scope} The newly created child scope.
     */
    value: function constant(key, value) {
      return this["with"](key, function () {
        return value;
      });
    }
  }, {
    key: "bind",

    /**
     * Globally binds the given value to the given key.
     *
     * @method bind
     * @param {string} key The key to bound the value to.
     * @param {Object} keys Object with mapping of variable name to the bound name.
     * @param {Function} fn The function to run. The function will have one argument, containing
     *    bound properties. Each property is named following they keys specified in the `keys`
     *    attribute.
     */
    value: function bind(key, fn) {
      Globals.bindings.add(append(this[__prefix__], key), this[__createProvider__](fn, key));
      return this;
    }
  }, {
    key: "get",

    /**
     * Returns the provider bound to the given key and resolve it in this scope. This will first check
     * for the local bindings, then its ancestors. If no binding is found in the ancestral path, this
     * will check for the global bindings.
     *
     * @method get
     * @param {string} key Key whose bound value should be returned.
     * @return {any} The value bound to the given key, or undefined if no values can be found.
     */
    value: function get(key) {
      var value = this[__get__](append(this[__prefix__], key));
      if (value === undefined) {
        return Globals.getGlobal(key, this);
      } else {
        return value;
      }
    }
  }, {
    key: "run",

    /**
     * Runs the given function after injecting any dependencies.
     *
     * @method run
     * @param {Function} fn The function to run. The function's arguments will be bound based on
     *    their names.
     */
    value: function run(fn) {
      this[__createProvider__](fn).resolve(this);
    }
  }, {
    key: "prefix",

    /**
     * Prefix any keys given to this scope with the given prefix.
     *
     * @method prefix
     * @param {string} prefix The prefix to add.
     * @return {DI.Scope} The newly created child scope with the given prefix.
     */
    value: (function (_prefix) {
      var _prefixWrapper = function prefix(_x) {
        return _prefix.apply(this, arguments);
      };

      _prefixWrapper.toString = function () {
        return _prefix.toString();
      };

      return _prefixWrapper;
    })(function (prefix) {
      return new Scope(this, append(prefix, this[__prefix__]));
    })
  }]);

  return Scope;
})();

function append(l, r) {
  return [l, r].filter(function (i) {
    return !!i;
  }).join(".");
}

module.exports = Scope;

},{"./bindingtree":1,"./globals":2,"./provider":5}]},{},[3])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIvVXNlcnMvZ3NvZWQvcHJvai9kaS1qcy9zcmMvYmluZGluZ3RyZWUuanMiLCIvVXNlcnMvZ3NvZWQvcHJvai9kaS1qcy9zcmMvZ2xvYmFscy5qcyIsIi9Vc2Vycy9nc29lZC9wcm9qL2RpLWpzL3NyYy9pbmRleC5qcyIsIi9Vc2Vycy9nc29lZC9wcm9qL2RpLWpzL3NyYy9vbGRzY29wZS5qcyIsIi9Vc2Vycy9nc29lZC9wcm9qL2RpLWpzL3NyYy9wcm92aWRlci5qcyIsIi9Vc2Vycy9nc29lZC9wcm9qL2RpLWpzL3NyYy9zY29wZS5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7Ozs7QUNDQSxJQUFNLFVBQVUsR0FBRyxNQUFNLENBQUMsUUFBUSxDQUFDLENBQUM7O0FBRXBDLElBQU0sU0FBUyxHQUFHLEdBQUcsQ0FBQzs7SUFFaEIsV0FBVzs7Ozs7Ozs7QUFPSixXQVBQLFdBQVcsR0FPRDswQkFQVixXQUFXOztBQVFiLFFBQUksQ0FBQyxVQUFVLENBQUMsR0FBRyxJQUFJLEdBQUcsRUFBRSxDQUFDO0dBQzlCOztlQVRHLFdBQVc7QUFxQmYsT0FBRzs7Ozs7Ozs7Ozs7OzthQUFBLGFBQUMsR0FBRyxFQUFFLEtBQUssRUFBYTtZQUFYLEtBQUssZ0NBQUcsQ0FBQzs7O0FBRXZCLFlBQUksUUFBUSxHQUFHLEdBQUcsQ0FBQyxLQUFLLENBQUMsU0FBUyxDQUFDLENBQUM7QUFDcEMsWUFBSSxVQUFVLEdBQUcsUUFBUSxDQUFDLFFBQVEsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxHQUFHLEtBQUssQ0FBQyxDQUFDOztBQUV2RCxZQUFJLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxVQUFVLENBQUMsRUFBRTtBQUNyQyxjQUFJLENBQUMsVUFBVSxDQUFDLENBQUMsR0FBRyxDQUFDLFVBQVUsRUFBRTtBQUMvQixlQUFHLEVBQUUsR0FBRztBQUNSLGlCQUFLLEVBQUUsS0FBSztXQUNiLENBQUMsQ0FBQztTQUNKLE1BQU07O0FBRUwsY0FBSSxhQUFhLEdBQUcsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxVQUFVLENBQUMsQ0FBQztBQUNyRCxjQUFJLGFBQWEsQ0FBQyxHQUFHLEtBQUssR0FBRyxFQUFFO0FBQzdCLDJCQUFhLEdBQUcsdUJBQW9CO1dBQ3JDOztBQUVELGNBQUksT0FBTyxHQUFHLElBQUksV0FBVyxFQUFFLENBQUM7QUFDaEMsY0FBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxVQUFVLEVBQUUsT0FBTyxDQUFDLENBQUM7QUFDMUMsaUJBQU8sQ0FBQyxHQUFHLENBQUMsYUFBYSxDQUFDLEdBQUcsRUFBRSxhQUFhLENBQUMsS0FBSyxFQUFFLEtBQUssR0FBRyxDQUFDLENBQUMsQ0FBQztBQUMvRCxpQkFBTyxDQUFDLEdBQUcsQ0FBQyxHQUFHLEVBQUUsS0FBSyxFQUFFLEtBQUssR0FBRyxDQUFDLENBQUMsQ0FBQztTQUNwQztPQUNGOztBQVdELE9BQUc7Ozs7Ozs7Ozs7OzthQUFBLGFBQUMsR0FBRyxFQUFhO1lBQVgsS0FBSyxnQ0FBRyxDQUFDOztBQUNoQixZQUFJLFFBQVEsR0FBRyxHQUFHLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FBQyxDQUFDO0FBQ3BDLFlBQUksVUFBVSxHQUFHLFFBQVEsQ0FBQyxRQUFRLENBQUMsTUFBTSxHQUFHLENBQUMsR0FBRyxLQUFLLENBQUMsQ0FBQzs7QUFFdkQsWUFBSSxVQUFVLEtBQUssU0FBUyxFQUFFO0FBQzVCLGlCQUFPLFNBQVMsQ0FBQztTQUNsQjs7QUFFRCxZQUFJLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxVQUFVLENBQUMsRUFBRTtBQUNyQyxpQkFBTyxTQUFTLENBQUM7U0FDbEI7O0FBRUQsWUFBSSxLQUFLLEdBQUcsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxVQUFVLENBQUMsQ0FBQztBQUM3QyxZQUFJLEtBQUssWUFBWSxXQUFXLEVBQUU7QUFDaEMsaUJBQU8sS0FBSyxDQUFDLEdBQUcsQ0FBQyxHQUFHLEVBQUUsS0FBSyxHQUFHLENBQUMsQ0FBQyxDQUFDO1NBQ2xDLE1BQU07QUFDTCxpQkFBTyxLQUFLLENBQUMsS0FBSyxDQUFDO1NBQ3BCO09BQ0Y7Ozs7U0F4RUcsV0FBVzs7O2lCQTJFRixXQUFXOzs7Ozs7O0lDaEZuQixXQUFXLDJCQUFNLGVBQWU7O0FBRXZDLElBQU0sT0FBTyxHQUFHO0FBQ2QsS0FBRyxFQUFFLE1BQU0sQ0FBQyxLQUFLLENBQUM7O0FBRWxCLFdBQVMsRUFBQSxtQkFBQyxHQUFHLEVBQUUsS0FBSyxFQUFFO0FBQ3BCLFFBQUksY0FBYyxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0FBQzVDLFFBQUksY0FBYyxLQUFLLFNBQVMsRUFBRTtBQUNoQyxhQUFPLFNBQVMsQ0FBQztLQUNsQixNQUFNO0FBQ0wsYUFBTyxjQUFjLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFDO0tBQ3RDO0dBQ0Y7O0FBRUQsVUFBUSxFQUFFLElBQUksV0FBVyxFQUFFO0NBQzVCLENBQUM7O2lCQUVhLE9BQU87Ozs7Ozs7SUNqQmYsV0FBVywyQkFBTSxlQUFlOztJQUNoQyxPQUFPLDJCQUFNLFdBQVc7O0lBQ3hCLFFBQVEsMkJBQU0sWUFBWTs7SUFDMUIsS0FBSywyQkFBTSxTQUFTOztJQUNwQixRQUFRLDJCQUFNLFlBQVk7O0FBRWpDLENBQUMsVUFBQyxNQUFNLEVBQUs7QUFDWCxRQUFNLEtBQVEsR0FBRyxJQUFJLEtBQUssRUFBRSxDQUFDO0FBQzdCLFFBQU0sS0FBUSxNQUFTLEdBQUcsS0FBSyxDQUFDOztBQUVoQyxRQUFNLEdBQU0sR0FBRyxJQUFJLFFBQVEsRUFBRSxDQUFDO0FBQzlCLFFBQU0sR0FBTSxTQUFZLEdBQUcsUUFBUSxDQUFDOztBQUVwQyxRQUFNLEdBQU0sWUFBZSxHQUFHLFdBQVcsQ0FBQztBQUMxQyxRQUFNLEdBQU0sU0FBWSxHQUFHLFFBQVEsQ0FBQztBQUNwQyxRQUFNLEdBQU0sU0FBWSxHQUFHLE9BQU8sQ0FBQyxRQUFRLENBQUM7Q0FDN0MsQ0FBQSxDQUFFLE1BQU0sQ0FBQyxDQUFDOzs7Ozs7Ozs7Ozs7Ozs7SUNoQkosS0FBSywyQkFBTSxTQUFTOztBQUUzQixTQUFTLElBQUksQ0FBQyxJQUFJLEVBQUUsRUFBRSxFQUFFO0FBQ3RCLFNBQU8sVUFBQyxPQUFPLEVBQUUsUUFBUSxFQUFLO0FBQzVCLFFBQUksUUFBUSxHQUFHLEVBQUUsQ0FBQzs7Ozs7OztBQUVsQiwyQkFBb0IsTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUM7WUFBNUIsT0FBTzs7QUFDZCxZQUFJLEdBQUcsR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7OztBQUd4QixZQUFJLFVBQVUsR0FBRyxHQUFHLENBQUMsR0FBRyxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsS0FBSyxHQUFHLENBQUM7QUFDN0MsWUFBSSxVQUFVLEVBQUU7QUFDZCxhQUFHLEdBQUcsR0FBRyxDQUFDLFNBQVMsQ0FBQyxDQUFDLEVBQUUsR0FBRyxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsQ0FBQztTQUN4Qzs7O0FBR0QsV0FBRyxHQUFHLEdBQUcsQ0FBQyxPQUFPLENBQUMsR0FBRyxFQUFFLE9BQU8sQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDOztBQUV2QyxZQUFJLFVBQVUsRUFBRTtBQUNkLGtCQUFRLENBQUMsT0FBTyxDQUFDLEdBQUcsUUFBUSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1NBQ25DLE1BQU07QUFDTCxrQkFBUSxDQUFDLE9BQU8sQ0FBQyxHQUFHLFFBQVEsQ0FBQyxHQUFHLENBQUMsQ0FBQztTQUNuQztPQUNGOzs7Ozs7Ozs7Ozs7Ozs7O0FBQ0QsV0FBTyxFQUFFLENBQUMsUUFBUSxDQUFDLENBQUM7R0FDckIsQ0FBQztDQUNIOztJQUVLLFFBQVE7QUFDRCxXQURQLFFBQVEsR0FDaUM7UUFBakMsV0FBVyxnQ0FBRyxJQUFJO1FBQUUsTUFBTSxnQ0FBRyxFQUFFOzswQkFEdkMsUUFBUTs7QUFFViwrQkFGRSxRQUFRLDZDQUVKLFdBQVcsRUFBRSxNQUFNLEVBQUU7R0FDNUI7O1lBSEcsUUFBUTs7ZUFBUixRQUFROzthQUtSLGVBQUMsR0FBRyxFQUFFLElBQUksRUFBRSxFQUFFLEVBQUU7QUFDbEIsMENBTkUsUUFBUSxzQ0FNUSxHQUFHLEVBQUUsSUFBSSxDQUFDLElBQUksRUFBRSxFQUFFLENBQUMsRUFBRTtPQUN4Qzs7QUFFRCxRQUFJO2FBQUEsY0FBQyxHQUFHLEVBQUUsSUFBSSxFQUFFLEVBQUUsRUFBRTtBQUNsQiwwQ0FWRSxRQUFRLHNDQVVRLEdBQUcsRUFBRSxJQUFJLENBQUMsSUFBSSxFQUFFLEVBQUUsQ0FBQyxFQUFFO09BQ3hDOztBQUVELE9BQUc7YUFBQSxhQUFDLElBQUksRUFBRSxFQUFFLEVBQUU7QUFDWiwwQ0FkRSxRQUFRLHFDQWNPLElBQUksQ0FBQyxJQUFJLEVBQUUsRUFBRSxDQUFDLEVBQUU7T0FDbEM7O0FBRUQsWUFBUTthQUFBLGtCQUFDLEdBQUcsRUFBRSxLQUFLLEVBQUU7QUFDbkIsZUFBTyxJQUFJLFFBQUssQ0FBQyxHQUFHLEVBQUUsRUFBRSxFQUFFO2lCQUFNLEtBQUs7U0FBQSxDQUFDLENBQUM7T0FDeEM7Ozs7U0FuQkcsUUFBUTtHQUFTLEtBQUs7O2lCQXNCYixRQUFROzs7Ozs7Ozs7OztJQ2xEaEIsT0FBTywyQkFBTSxXQUFXOztBQUUvQixJQUFNLE9BQU8sR0FBRyxPQUFPLENBQUMsR0FBRyxDQUFDOzs7QUFHNUIsSUFBTSxZQUFZLEdBQUcsTUFBTSxFQUFFLENBQUM7QUFDOUIsSUFBTSxjQUFjLEdBQUcsTUFBTSxDQUFDLFlBQVksQ0FBQyxDQUFDO0FBQzVDLElBQU0sUUFBUSxHQUFHLE1BQU0sRUFBRSxDQUFDO0FBQzFCLElBQU0sZ0JBQWdCLEdBQUcsTUFBTSxFQUFFLENBQUM7QUFDbEMsSUFBTSxVQUFVLEdBQUcsTUFBTSxDQUFDLFFBQVEsQ0FBQyxDQUFDO0FBQ3BDLElBQU0sa0JBQWtCLEdBQUcsTUFBTSxFQUFFLENBQUM7QUFDcEMsSUFBTSxlQUFlLEdBQUcsTUFBTSxFQUFFLENBQUM7O0FBRWpDLFNBQVMsV0FBVyxDQUFDLEdBQUcsRUFBRSxLQUFLLEVBQUU7QUFDL0IsU0FBTyxJQUFJLEtBQUssTUFBSSxHQUFHLHNCQUFpQixLQUFLLENBQUMsS0FBSyxDQUFHLENBQUM7Q0FDeEQ7O0lBRUssUUFBUTs7Ozs7Ozs7Ozs7Ozs7QUFhRCxXQWJQLFFBQVEsQ0FhQSxFQUFFLEVBQUUsTUFBTSxFQUFFLFVBQVUsRUFBZTtRQUFiLElBQUksZ0NBQUcsSUFBSTs7MEJBYjNDLFFBQVE7O0FBY1YsUUFBSSxDQUFDLFlBQVksQ0FBQyxHQUFHLEVBQUUsQ0FBQztBQUN4QixRQUFJLENBQUMsVUFBVSxDQUFDLEdBQUcsTUFBTSxDQUFDO0FBQzFCLFFBQUksQ0FBQyxjQUFjLENBQUMsR0FBRyxVQUFVLENBQUM7QUFDbEMsUUFBSSxDQUFDLFFBQVEsQ0FBQyxHQUFHLElBQUksQ0FBQztBQUN0QixRQUFJLENBQUMsa0JBQWtCLENBQUMsR0FBRyxJQUFJLEdBQUcsRUFBRSxDQUFDO0dBQ3RDOzt1QkFuQkcsUUFBUTtTQWdDWCxlQUFlOzs7Ozs7Ozs7Ozs7O1dBQUMsVUFBQyxHQUFHLEVBQUUsS0FBSyxFQUFFOztBQUU1QixTQUFHLEdBQUcsSUFBSSxDQUFDLGdCQUFnQixDQUFDLENBQUMsR0FBRyxDQUFDLENBQUM7OztBQUdsQyxVQUFJLEtBQUssWUFBQSxDQUFDOztBQUVWLFVBQUk7O0FBRUYsYUFBSyxHQUFHLElBQUksQ0FBQyxjQUFjLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxHQUFHLEVBQUUsS0FBSyxDQUFDLENBQUM7O0FBRWxELFlBQUksS0FBSyxLQUFLLFNBQVMsRUFBRTs7QUFFdkIsZUFBSyxHQUFHLEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQyxHQUFHLEVBQUUsS0FBSyxDQUFDLENBQUM7U0FDcEM7O0FBRUQsWUFBSSxLQUFLLEtBQUssU0FBUyxFQUFFOztBQUV2QixlQUFLLEdBQUcsT0FBTyxDQUFDLFNBQVMsQ0FBQyxHQUFHLEVBQUUsS0FBSyxDQUFDLENBQUM7U0FDdkM7T0FDRixDQUFDLE9BQU8sQ0FBQyxFQUFFOztBQUVWLFlBQUksSUFBSSxDQUFDLFFBQVEsQ0FBQyxFQUFFO0FBQ2xCLGdCQUFNLFdBQVcsTUFBSSxDQUFDLDRCQUF1QixJQUFJLENBQUMsUUFBUSxDQUFDLEVBQUksQ0FBQyxDQUFDLENBQUM7U0FDbkUsTUFBTTtBQUNMLGdCQUFNLFdBQVcsTUFBSSxDQUFDLG1DQUFnQyxDQUFDLENBQUMsQ0FBQztTQUMxRDtPQUNGOztBQUVELGFBQU8sS0FBSyxDQUFDO0tBQ2Q7O1NBVUEsZ0JBQWdCOzs7Ozs7Ozs7O1dBQUMsVUFBQyxHQUFHLEVBQUU7O0FBRXRCLFVBQUksTUFBTSxHQUFHLEdBQUcsQ0FBQyxDQUFDLENBQUMsS0FBSyxHQUFHLENBQUM7QUFDNUIsVUFBSSxNQUFNLEVBQUU7QUFDVixlQUFPLEdBQUcsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUM7T0FDekIsTUFBTSxJQUFJLElBQUksQ0FBQyxVQUFVLENBQUMsRUFBRTtBQUMzQixvQkFBVSxJQUFJLENBQUMsVUFBVSxDQUFDLFNBQUksR0FBRyxDQUFHO09BQ3JDLE1BQU07QUFDTCxlQUFPLEdBQUcsQ0FBQztPQUNaO0tBQ0Y7Ozs7Ozs7Ozs7O1dBU00saUJBQUMsS0FBSyxFQUFFOzs7QUFDYixVQUFJLENBQUMsSUFBSSxDQUFDLGtCQUFrQixDQUFDLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxFQUFFOztBQUN4QyxjQUFJLFFBQVEsR0FBRyxVQUFBLEdBQUcsRUFBSTtBQUNwQixtQkFBTyxNQUFLLGVBQWUsQ0FBQyxDQUFDLEdBQUcsRUFBRSxLQUFLLENBQUMsQ0FBQztXQUMxQyxDQUFDOztBQUVGLGNBQUksT0FBTyxHQUFHLFVBQUEsR0FBRyxFQUFJO0FBQ25CLGdCQUFJLEtBQUssR0FBRyxRQUFRLENBQUMsR0FBRyxDQUFDLENBQUM7QUFDMUIsZ0JBQUksS0FBSyxLQUFLLFNBQVMsRUFBRTtBQUN2QixrQkFBSSxNQUFLLFFBQVEsQ0FBQyxFQUFFO0FBQ2xCLHNCQUFNLElBQUksS0FBSyxrQkFBZ0IsR0FBRyx5QkFBb0IsTUFBSyxRQUFRLENBQUMsQ0FBRyxDQUFDO2VBQ3pFLE1BQU07QUFDTCxzQkFBTSxJQUFJLEtBQUssa0JBQWdCLEdBQUcsK0JBQTRCLENBQUM7ZUFDaEU7YUFDRjtBQUNELG1CQUFPLEtBQUssQ0FBQztXQUNkLENBQUM7OztBQUdGLGNBQUksS0FBSyxZQUFBLENBQUM7QUFDVixjQUFJO0FBQ0YsaUJBQUssR0FBRyxNQUFLLFlBQVksQ0FBQyxDQUFDLE9BQU8sRUFBRSxRQUFRLENBQUMsQ0FBQztXQUMvQyxDQUFDLE9BQU8sQ0FBQyxFQUFFO0FBQ1YsZ0JBQUksTUFBSyxRQUFRLENBQUMsRUFBRTtBQUNsQixvQkFBTSxXQUFXLHlCQUNTLENBQUMsbUNBQThCLE1BQUssUUFBUSxDQUFDLEVBQUksQ0FBQyxDQUFDLENBQUM7YUFDL0UsTUFBTTtBQUNMLG9CQUFNLFdBQVcseUJBQXVCLENBQUMsbUNBQWdDLENBQUMsQ0FBQyxDQUFDO2FBQzdFO1dBQ0Y7O0FBRUQsY0FBSSxLQUFLLEtBQUssU0FBUyxJQUFJLE1BQUssUUFBUSxDQUFDLEVBQUU7QUFDekMsbUJBQU8sQ0FBQyxJQUFJLGVBQWEsTUFBSyxRQUFRLENBQUMsbUJBQWdCLENBQUM7V0FDekQ7O0FBRUQsZ0JBQUssa0JBQWtCLENBQUMsQ0FBQyxHQUFHLENBQUMsS0FBSyxFQUFFLEtBQUssQ0FBQyxDQUFDOztPQUM1Qzs7QUFFRCxhQUFPLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQztLQUM1Qzs7O1NBbElHLFFBQVE7OztpQkFxSUMsUUFBUTs7Ozs7Ozs7Ozs7SUN0SmhCLFdBQVcsMkJBQU0sZUFBZTs7SUFDaEMsUUFBUSwyQkFBTSxZQUFZOztJQUMxQixPQUFPLDJCQUFNLFdBQVc7OztBQUkvQixJQUFNLGlCQUFpQixHQUFHLE1BQU0sQ0FBQyxlQUFlLENBQUMsQ0FBQztBQUNsRCxJQUFNLGVBQWUsR0FBRyxNQUFNLENBQUMsYUFBYSxDQUFDLENBQUM7QUFDOUMsSUFBTSxVQUFVLEdBQUcsTUFBTSxDQUFDLFFBQVEsQ0FBQyxDQUFDOztBQUVwQyxJQUFNLGtCQUFrQixHQUFHLE1BQU0sRUFBRSxDQUFDOztBQUVwQyxJQUFNLE9BQU8sR0FBRyxPQUFPLENBQUMsR0FBRyxDQUFDOztJQUV0QixLQUFLOzs7Ozs7Ozs7QUFRRSxXQVJQLEtBQUssR0FRb0M7UUFBakMsV0FBVyxnQ0FBRyxJQUFJO1FBQUUsTUFBTSxnQ0FBRyxFQUFFOzswQkFSdkMsS0FBSzs7QUFTUCxRQUFJLENBQUMsaUJBQWlCLENBQUMsR0FBRyxJQUFJLFdBQVcsRUFBRSxDQUFDO0FBQzVDLFFBQUksQ0FBQyxlQUFlLENBQUMsR0FBRyxXQUFXLENBQUM7QUFDcEMsUUFBSSxDQUFDLFVBQVUsQ0FBQyxHQUFHLE1BQU0sQ0FBQztHQUMzQjs7dUJBWkcsS0FBSztTQWNSLGtCQUFrQjtXQUFDLFVBQUMsRUFBRSxFQUFlO1VBQWIsSUFBSSxnQ0FBRyxJQUFJOztBQUNsQyxhQUFPLElBQUksUUFBUSxDQUFDLEVBQUUsRUFBRSxJQUFJLENBQUMsVUFBVSxDQUFDLEVBQUUsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDO0tBQ3ZEOztTQUVBLE9BQU87V0FBQyxVQUFDLEdBQUcsRUFBRSxLQUFLLEVBQUU7QUFDcEIsVUFBSSxRQUFRLEdBQUcsSUFBSSxDQUFDLGlCQUFpQixDQUFDLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0FBQ2hELFVBQUksUUFBUSxLQUFLLFNBQVMsRUFBRTtBQUMxQixZQUFJLElBQUksQ0FBQyxlQUFlLENBQUMsRUFBRTtBQUN6QixpQkFBTyxJQUFJLENBQUMsZUFBZSxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsR0FBRyxFQUFFLEtBQUssQ0FBQyxDQUFDO1NBQ25ELE1BQU07QUFDTCxpQkFBTyxTQUFTLENBQUM7U0FDbEI7T0FDRixNQUFNO0FBQ0wsZUFBTyxRQUFRLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFDO09BQ2hDO0tBQ0Y7Ozs7Ozs7Ozs7Ozs7OztXQWFHLGVBQUMsR0FBRyxFQUFFLEVBQUUsRUFBRTtBQUNaLFVBQUksVUFBVSxHQUFHLElBQUksS0FBSyxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQztBQUNuRCxnQkFBVSxDQUFDLGlCQUFpQixDQUFDLENBQ3hCLEdBQUcsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxFQUFFLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDLEVBQUUsRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDO0FBQzNFLGFBQU8sVUFBVSxDQUFDO0tBQ25COzs7Ozs7Ozs7Ozs7O1dBV08sa0JBQUMsR0FBRyxFQUFFLEtBQUssRUFBRTtBQUNuQixhQUFPLElBQUksUUFBSyxDQUFDLEdBQUcsRUFBRTtlQUFNLEtBQUs7T0FBQSxDQUFDLENBQUM7S0FDcEM7Ozs7Ozs7Ozs7Ozs7O1dBWUcsY0FBQyxHQUFHLEVBQUUsRUFBRSxFQUFFO0FBQ1osYUFBTyxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsRUFBRSxHQUFHLENBQUMsRUFBRSxJQUFJLENBQUMsa0JBQWtCLENBQUMsQ0FBQyxFQUFFLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQztBQUN2RixhQUFPLElBQUksQ0FBQztLQUNiOzs7Ozs7Ozs7Ozs7O1dBV0UsYUFBQyxHQUFHLEVBQUU7QUFDUCxVQUFJLEtBQUssR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDO0FBQ3pELFVBQUksS0FBSyxLQUFLLFNBQVMsRUFBRTtBQUN2QixlQUFPLE9BQU8sQ0FBQyxTQUFTLENBQUMsR0FBRyxFQUFFLElBQUksQ0FBQyxDQUFDO09BQ3JDLE1BQU07QUFDTCxlQUFPLEtBQUssQ0FBQztPQUNkO0tBQ0Y7Ozs7Ozs7Ozs7O1dBU0UsYUFBQyxFQUFFLEVBQUU7QUFDTixVQUFJLENBQUMsa0JBQWtCLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUM7S0FDNUM7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztPQVNLLFVBQUMsTUFBTSxFQUFFO0FBQ2IsYUFBTyxJQUFJLEtBQUssQ0FBQyxJQUFJLEVBQUUsTUFBTSxDQUFDLE1BQU0sRUFBRSxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDO0tBQzFEOzs7U0FuSEcsS0FBSzs7O0FBc0hYLFNBQVMsTUFBTSxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUU7QUFDcEIsU0FBTyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsVUFBQSxDQUFDO1dBQUksQ0FBQyxDQUFDLENBQUM7R0FBQSxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO0NBQzFDOztpQkFFYyxLQUFLIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIi8vIFByaXZhdGUgc3ltYm9scy5cbmNvbnN0IF9fdmFsdWVzX18gPSBTeW1ib2woJ3ZhbHVlcycpO1xuXG5jb25zdCBTRVBBUkFUT1IgPSAnXyc7XG5cbmNsYXNzIEJpbmRpbmdUcmVlIHtcblxuICAvKipcbiAgICogUmVwcmVzZW50cyBhIHRyZWUgb2YgYm91bmQgdmFsdWVzIGtleWVkIGJ5IGJpbmRpbmcga2V5LlxuICAgKiBAY2xhc3MgREkuQmluZGluZ1RyZWVcbiAgICogQGNvbnN0cnVjdG9yXG4gICAqL1xuICBjb25zdHJ1Y3RvcigpIHtcbiAgICB0aGlzW19fdmFsdWVzX19dID0gbmV3IE1hcCgpO1xuICB9XG5cbiAgLyoqXG4gICAqIEFkZHMgdGhlIGdpdmVuIGtleSBhbmQgdmFsdWUgdG8gdGhlIHRyZWUuIFRoZSB0cmVlIHdpbGwgdHJ5IHRvIGJpbmQgdXNpbmcgdGhlIGxhc3Qgc2VnbWVudCBvZlxuICAgKiB0aGUga2V5LiBJZiB0aGlzIGNhdXNlcyBhIGNvbmZsaWN0LCBpdCB3aWxsIGNyZWF0ZSBhIHN1YnRyZWUuXG4gICAqXG4gICAqIEBtZXRob2QgYWRkXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBrZXkgVGhlIGtleSB0byBiaW5kIHRoZSB2YWx1ZSB0by5cbiAgICogQHBhcmFtIHtPYmplY3R9IHZhbHVlIFRoZSB2YWx1ZSB0byBiZSBib3VuZC5cbiAgICogQHBhcmFtIHtudW1iZXJ9IFtkZXB0aD0wXSBUaGUgZGVwdGggb2YgdGhlIGtleSB0byB1c2UgYXMgYmluZGluZyBrZXkuIFRoaXMgc2hvdWxkIG5vdCBiZVxuICAgKiAgICBjYWxsZWQgZnJvbSBvdXRzaWRlIHRoZSBjbGFzcy5cbiAgICovXG4gIGFkZChrZXksIHZhbHVlLCBkZXB0aCA9IDApIHtcbiAgICAvLyBUT0RPKGdzKTogUmVtb3ZlIHRoZSBzZXBhcmF0b3JcbiAgICBsZXQgc2VnbWVudHMgPSBrZXkuc3BsaXQoU0VQQVJBVE9SKTtcbiAgICBsZXQgYmluZGluZ0tleSA9IHNlZ21lbnRzW3NlZ21lbnRzLmxlbmd0aCAtIDEgLSBkZXB0aF07XG5cbiAgICBpZiAoIXRoaXNbX192YWx1ZXNfX10uaGFzKGJpbmRpbmdLZXkpKSB7XG4gICAgICB0aGlzW19fdmFsdWVzX19dLnNldChiaW5kaW5nS2V5LCB7XG4gICAgICAgIGtleToga2V5LFxuICAgICAgICB2YWx1ZTogdmFsdWVcbiAgICAgIH0pO1xuICAgIH0gZWxzZSB7XG4gICAgICAvLyBUaGVyZSBpcyBhbHJlYWR5IGEgdmFsdWUgY29ycmVzcG9uZGluZyB0byB0aGlzIGtleVxuICAgICAgbGV0IGV4aXN0aW5nVmFsdWUgPSB0aGlzW19fdmFsdWVzX19dLmdldChiaW5kaW5nS2V5KTtcbiAgICAgIGlmIChleGlzdGluZ1ZhbHVlLmtleSA9PT0ga2V5KSB7XG4gICAgICAgIHRocm93IGBLZXkgJHtrZXl9IGlzIGFscmVhZHkgYm91bmRgO1xuICAgICAgfVxuXG4gICAgICBsZXQgbmV3VHJlZSA9IG5ldyBCaW5kaW5nVHJlZSgpO1xuICAgICAgdGhpc1tfX3ZhbHVlc19fXS5zZXQoYmluZGluZ0tleSwgbmV3VHJlZSk7XG4gICAgICBuZXdUcmVlLmFkZChleGlzdGluZ1ZhbHVlLmtleSwgZXhpc3RpbmdWYWx1ZS52YWx1ZSwgZGVwdGggKyAxKTtcbiAgICAgIG5ld1RyZWUuYWRkKGtleSwgdmFsdWUsIGRlcHRoICsgMSk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgdGhlIHZhbHVlIGNvcnJlc3BvbmRpbmcgdG8gdGhlIGdpdmVuIGtleS5cbiAgICpcbiAgICogQHBhcmFtIHtzdHJpbmd9IGtleSBLZXkgb2YgdGhlIHZhbHVlIHRvIHJldHVybi5cbiAgICogQHBhcmFtIHtudW1iZXJ9IFtkZXB0aD0wXSBUaGUgZGVwdGggb2YgdGhlIGtleSB0byB1c2UgYXMgYmluZGluZyBrZXkuIFRoaXMgc2hvdWxkIG5vdCBiZVxuICAgKiAgICBjYWxsZWQgZnJvbSBvdXRzaWRlIHRoZSBjbGFzcy5cbiAgICogQHJldHVybiB7YW55fSBUaGUgYm91bmQgdmFsdWUsIG9yIHVuZGVmaW5lZCBpZiB0aGUgdmFsdWUgY2Fubm90IGJlIGZvdW5kLCBvciBpZiB0aGUga2V5IGhhc1xuICAgKiAgICBjb2xsaXNpb24gYnV0IGNvbGxpc2lvbiBjYW5ub3QgYmUgcmVzb2x2ZWQuXG4gICAqL1xuICBnZXQoa2V5LCBkZXB0aCA9IDApIHtcbiAgICBsZXQgc2VnbWVudHMgPSBrZXkuc3BsaXQoU0VQQVJBVE9SKTtcbiAgICBsZXQgYmluZGluZ0tleSA9IHNlZ21lbnRzW3NlZ21lbnRzLmxlbmd0aCAtIDEgLSBkZXB0aF07XG5cbiAgICBpZiAoYmluZGluZ0tleSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgIH1cblxuICAgIGlmICghdGhpc1tfX3ZhbHVlc19fXS5oYXMoYmluZGluZ0tleSkpIHtcbiAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgfVxuXG4gICAgbGV0IHZhbHVlID0gdGhpc1tfX3ZhbHVlc19fXS5nZXQoYmluZGluZ0tleSk7XG4gICAgaWYgKHZhbHVlIGluc3RhbmNlb2YgQmluZGluZ1RyZWUpIHtcbiAgICAgIHJldHVybiB2YWx1ZS5nZXQoa2V5LCBkZXB0aCArIDEpO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gdmFsdWUudmFsdWU7XG4gICAgfVxuICB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IEJpbmRpbmdUcmVlOyIsImltcG9ydCBCaW5kaW5nVHJlZSBmcm9tICcuL2JpbmRpbmd0cmVlJztcblxuY29uc3QgR2xvYmFscyA9IHtcbiAgZ2V0OiBTeW1ib2woJ2dldCcpLFxuXG4gIGdldEdsb2JhbChrZXksIHNjb3BlKSB7XG4gICAgbGV0IGdsb2JhbFByb3ZpZGVyID0gdGhpcy5iaW5kaW5ncy5nZXQoa2V5KTtcbiAgICBpZiAoZ2xvYmFsUHJvdmlkZXIgPT09IHVuZGVmaW5lZCkge1xuICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIGdsb2JhbFByb3ZpZGVyLnJlc29sdmUoc2NvcGUpO1xuICAgIH1cbiAgfSxcblxuICBiaW5kaW5nczogbmV3IEJpbmRpbmdUcmVlKClcbn07XG5cbmV4cG9ydCBkZWZhdWx0IEdsb2JhbHM7IiwiaW1wb3J0IEJpbmRpbmdUcmVlIGZyb20gJy4vYmluZGluZ3RyZWUnO1xuaW1wb3J0IEdsb2JhbHMgZnJvbSAnLi9nbG9iYWxzJztcbmltcG9ydCBQcm92aWRlciBmcm9tICcuL3Byb3ZpZGVyJztcbmltcG9ydCBTY29wZSBmcm9tICcuL3Njb3BlJztcbmltcG9ydCBPbGRTY29wZSBmcm9tICcuL29sZHNjb3BlJztcblxuKCh3aW5kb3cpID0+IHtcbiAgd2luZG93WydESUpTJ10gPSBuZXcgU2NvcGUoKTtcbiAgd2luZG93WydESUpTJ11bJ1Njb3BlJ10gPSBTY29wZTtcblxuICB3aW5kb3dbJ0RJJ10gPSBuZXcgT2xkU2NvcGUoKTtcbiAgd2luZG93WydESSddWydPbGRTY29wZSddID0gT2xkU2NvcGU7XG5cbiAgd2luZG93WydESSddWydCaW5kaW5nVHJlZSddID0gQmluZGluZ1RyZWU7XG4gIHdpbmRvd1snREknXVsnUHJvdmlkZXInXSA9IFByb3ZpZGVyO1xuICB3aW5kb3dbJ0RJJ11bJ2JpbmRpbmdzJ10gPSBHbG9iYWxzLmJpbmRpbmdzO1xufSkod2luZG93KTtcbiIsImltcG9ydCBTY29wZSBmcm9tICcuL3Njb3BlJztcblxuZnVuY3Rpb24gd3JhcChrZXlzLCBmbikge1xuICByZXR1cm4gKHJlcXVpcmUsIG9wdGlvbmFsKSA9PiB7XG4gICAgbGV0IGluamVjdG9yID0ge307XG5cbiAgICBmb3IgKGxldCBhcmdOYW1lIG9mIE9iamVjdC5rZXlzKGtleXMpKSB7XG4gICAgICBsZXQga2V5ID0ga2V5c1thcmdOYW1lXTtcblxuICAgICAgLy8gQ2hlY2sgaWYgdGhlIGtleSBpcyBvcHRpb25hbC5cbiAgICAgIGxldCBpc09wdGlvbmFsID0ga2V5W2tleS5sZW5ndGggLSAxXSA9PT0gJz8nO1xuICAgICAgaWYgKGlzT3B0aW9uYWwpIHtcbiAgICAgICAga2V5ID0ga2V5LnN1YnN0cmluZygwLCBrZXkubGVuZ3RoIC0gMSk7XG4gICAgICB9XG5cbiAgICAgIC8vIE5vdyByZXBsYWNlIGFueSA9IGluIHRoZSBrZXkgd2l0aCB0aGUgYXJndW1lbnQgbmFtZS5cbiAgICAgIGtleSA9IGtleS5yZXBsYWNlKCc9JywgYXJnTmFtZS50cmltKCkpO1xuXG4gICAgICBpZiAoaXNPcHRpb25hbCkge1xuICAgICAgICBpbmplY3RvclthcmdOYW1lXSA9IG9wdGlvbmFsKGtleSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBpbmplY3RvclthcmdOYW1lXSA9IHJlcXVpcmVkKGtleSk7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBmbihpbmplY3Rvcik7XG4gIH07XG59XG5cbmNsYXNzIE9sZFNjb3BlIGV4dGVuZHMgU2NvcGUge1xuICBjb25zdHJ1Y3RvcihwYXJlbnRTY29wZSA9IG51bGwsIHByZWZpeCA9ICcnKSB7XG4gICAgc3VwZXIocGFyZW50U2NvcGUsIHByZWZpeCk7XG4gIH1cblxuICB3aXRoKGtleSwga2V5cywgZm4pIHtcbiAgICByZXR1cm4gc3VwZXIud2l0aChrZXksIHdyYXAoa2V5cywgZm4pKTtcbiAgfVxuXG4gIGJpbmQoa2V5LCBrZXlzLCBmbikge1xuICAgIHJldHVybiBzdXBlci5iaW5kKGtleSwgd3JhcChrZXlzLCBmbikpO1xuICB9XG5cbiAgcnVuKGtleXMsIGZuKSB7XG4gICAgcmV0dXJuIHN1cGVyLnJ1bih3cmFwKGtleXMsIGZuKSk7XG4gIH1cblxuICBjb25zdGFudChrZXksIHZhbHVlKSB7XG4gICAgcmV0dXJuIHRoaXMud2l0aChrZXksIHt9LCAoKSA9PiB2YWx1ZSk7XG4gIH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgT2xkU2NvcGU7XG4iLCJpbXBvcnQgR2xvYmFscyBmcm9tICcuL2dsb2JhbHMnO1xuXG5jb25zdCBfX2dldF9fID0gR2xvYmFscy5nZXQ7XG5cbi8vIFByaXZhdGUgc3ltYm9scy5cbmNvbnN0IF9fZnVuY3Rpb25fXyA9IFN5bWJvbCgpO1xuY29uc3QgX19sb2NhbFNjb3BlX18gPSBTeW1ib2woJ2xvY2FsU2NvcGUnKTtcbmNvbnN0IF9fbmFtZV9fID0gU3ltYm9sKCk7XG5jb25zdCBfX25vcm1hbGl6ZUtleV9fID0gU3ltYm9sKCk7XG5jb25zdCBfX3ByZWZpeF9fID0gU3ltYm9sKCdwcmVmaXgnKTtcbmNvbnN0IF9fcmVzb2x2ZWRWYWx1ZXNfXyA9IFN5bWJvbCgpO1xuY29uc3QgX19zZWFyY2hWYWx1ZV9fID0gU3ltYm9sKCk7XG5cbmZ1bmN0aW9uIGNyZWF0ZUVycm9yKG1zZywgY2F1c2UpIHtcbiAgcmV0dXJuIG5ldyBFcnJvcihgJHttc2d9XFxuQ2F1c2VkIGJ5OlxcbiR7Y2F1c2Uuc3RhY2t9YCk7XG59XG5cbmNsYXNzIFByb3ZpZGVyIHtcblxuICAvKipcbiAgICogQGNsYXNzIERJLlByb3ZpZGVyXG4gICAqIEBjb25zdHJ1Y3RvclxuICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBmbiBUaGUgZnVuY3Rpb24gdG8gcnVuLiBUaGUgZnVuY3Rpb24gc2hvdWxkIHRha2Ugb25lIGFyZ3VtZW50LCB3aGljaCBpcyBhblxuICAgKiAgICBvYmplY3QgdGhhdCB3aWxsIGNvbnRhaW4gdGhlIGluamVjdGVkIHZhbHVlcywga2V5ZWQgYnkgdGhlIGdpdmVuIGtleXMuXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBwcmVmaXggVGhlIHByZWZpeCB0byB1c2UgZm9yIHRoZSBrZXlzLlxuICAgKiBAcGFyYW0ge0RJLlNjb3BlfSBsb2NhbFNjb3BlIFRoZSBsb2NhbCBzY29wZS4gVGhpcyB3aWxsIGJlIHByaW9yaXRpemVkIHdoZW4gY2hlY2tpbmcgZm9yIGJvdW5kXG4gICAqICAgIHZhbHVlcy5cbiAgICogQHBhcmFtIHtzdHJpbmd9IFtuYW1lPW51bGxdIFJlZmVyZW5jZSBuYW1lIG9mIHRoZSBwcm92aWRlci4gVGhpcyBpcyB1c2VkIGZvciBkZXRlY3RpbmcgY3ljbGljXG4gICAqICAgIGRlcGVuZGVuY2llcy5cbiAgICovXG4gIGNvbnN0cnVjdG9yKGZuLCBwcmVmaXgsIGxvY2FsU2NvcGUsIG5hbWUgPSBudWxsKSB7XG4gICAgdGhpc1tfX2Z1bmN0aW9uX19dID0gZm47XG4gICAgdGhpc1tfX3ByZWZpeF9fXSA9IHByZWZpeDtcbiAgICB0aGlzW19fbG9jYWxTY29wZV9fXSA9IGxvY2FsU2NvcGU7XG4gICAgdGhpc1tfX25hbWVfX10gPSBuYW1lO1xuICAgIHRoaXNbX19yZXNvbHZlZFZhbHVlc19fXSA9IG5ldyBNYXAoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZWFyY2hlcyBmb3IgdGhlIHZhbHVlIHdpdGggdGhlIGdpdmVuIGtleS4gRmlyc3QsIGl0IHRyaWVzIHNlYXJjaGluZyBpbiB0aGUgbG9jYWwgc2NvcGUuIFRoZW5cbiAgICogaXQgc2VhcmNoZXMgaW4gdGhlIGdpdmVuIHNjb3BlLiBJZiB0aGUga2V5IGlzIHN0aWxsIG5vdCBmb3VuZCwgaXQgc2VhcmNoZXMgaW4gdGhlIGdsb2JhbFxuICAgKiBzY29wZS5cbiAgICpcbiAgICogQG1ldGhvZCBfX3NlYXJjaFZhbHVlX19cbiAgICogQHBhcmFtIHtzdHJpbmd9IGtleSBLZXkgdG8gc2VhcmNoIHRoZSB2YWx1ZSBieVxuICAgKiBAcGFyYW0ge1tESS5TY29wZX0gc2NvcGUgU2NvcGUgdG8gc2VhcmNoIHRoZSB2YWx1ZSBpbi5cbiAgICogQHJldHVybiB7YW55fSBWYWx1ZSBjb3JyZXNwb25kaW5nIHRvIHRoZSBnaXZlbiBrZXksIG9yIHVuZGVmaW5lZCBpZiBub25lIHdlcmUgZm91bmQuXG4gICAqIEBwcml2YXRlXG4gICAqL1xuICBbX19zZWFyY2hWYWx1ZV9fXShrZXksIHNjb3BlKSB7XG4gICAgLy8gTm9ybWFsaXplIHRoZSBrZXkuXG4gICAga2V5ID0gdGhpc1tfX25vcm1hbGl6ZUtleV9fXShrZXkpO1xuXG4gICAgLy8gVE9ETyhncyk6IEhhbmRsZSBjeWNsaWMgZGVwZW5kZW5jeS5cbiAgICBsZXQgdmFsdWU7XG5cbiAgICB0cnkge1xuICAgICAgLy8gQ2hlY2sgdGhlIGxvY2FsIHNjb3BlIGZpcnN0LlxuICAgICAgdmFsdWUgPSB0aGlzW19fbG9jYWxTY29wZV9fXVtfX2dldF9fXShrZXksIHNjb3BlKTtcblxuICAgICAgaWYgKHZhbHVlID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgLy8gSWYgdmFsdWUgY2Fubm90IGJlIHJlc29sdmVkIGluIHRoZSBsb2NhbCBzY29wZSwgY2hlY2sgdGhlIGdpdmVuIHNjb3BlLlxuICAgICAgICB2YWx1ZSA9IHNjb3BlW19fZ2V0X19dKGtleSwgc2NvcGUpO1xuICAgICAgfVxuXG4gICAgICBpZiAodmFsdWUgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAvLyBJZiB2YWx1ZSBjYW5ub3QgYmUgcmVzb2x2ZWQgaW4gdGhlIGxvY2FsIHNjb3BlLCBjaGVjayB0aGUgZ2xvYmFsIGJpbmRpbmdzLlxuICAgICAgICB2YWx1ZSA9IEdsb2JhbHMuZ2V0R2xvYmFsKGtleSwgc2NvcGUpO1xuICAgICAgfVxuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIC8vIFRPRE8oZ3MpOiBNYWtlIGEgc2hhcmVkIG1ldGhvZC5cbiAgICAgIGlmICh0aGlzW19fbmFtZV9fXSkge1xuICAgICAgICB0aHJvdyBjcmVhdGVFcnJvcihgJHtlfVxcblxcdHdoaWxlIHByb3ZpZGluZyAke3RoaXNbX19uYW1lX19dfWAsIGUpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhyb3cgY3JlYXRlRXJyb3IoYCR7ZX1cXG5cXHR3aGlsZSBydW5uaW5nIGV4cHJlc3Npb25gLCBlKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gdmFsdWU7XG4gIH1cblxuICAvKipcbiAgICogTm9ybWFsaXplcyB0aGUgZ2l2ZW4ga2V5LlxuICAgKlxuICAgKiBAbWV0aG9kIF9fbm9ybWFsaXplS2V5X19cbiAgICogQHBhcmFtIHtzdHJpbmd9IGtleSBUaGUga2V5IHRvIG5vcm1hbGl6ZS5cbiAgICogQHJldHVybiB7c3RyaW5nfSBUaGUgbm9ybWFsaXplZCBrZXkuXG4gICAqIEBwcml2YXRlXG4gICAqL1xuICBbX19ub3JtYWxpemVLZXlfX10oa2V5KSB7XG4gICAgLy8gQ2hlY2sgaWYgdGhlIGtleSBpcyByb290IGtleS5cbiAgICBsZXQgaXNSb290ID0ga2V5WzBdID09PSAnLyc7XG4gICAgaWYgKGlzUm9vdCkge1xuICAgICAgcmV0dXJuIGtleS5zdWJzdHJpbmcoMSk7XG4gICAgfSBlbHNlIGlmICh0aGlzW19fcHJlZml4X19dKSB7XG4gICAgICByZXR1cm4gYCR7dGhpc1tfX3ByZWZpeF9fXX0uJHtrZXl9YDtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIGtleTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogUmVzb2x2ZXMgdGhlIHByb3ZpZGVyLiBSZXNvbHZlZCB2YWx1ZXMgYXJlIGNhY2hlZCBwZXIgc2NvcGUuXG4gICAqXG4gICAqIEBtZXRob2QgcmVzb2x2ZVxuICAgKiBAcGFyYW0ge0RJLlNjb3BlfSBzY29wZSBUaGUgc2NvcGUgdG8gcmVzb2x2ZSB0aGUgdmFsdWUgaW4uXG4gICAqIEByZXR1cm4ge09iamVjdH0gVGhlIHJlc29sdmVkIHZhbHVlIGZvciB0aGUgZ2l2ZW4gc2NvcGUuXG4gICAqL1xuICByZXNvbHZlKHNjb3BlKSB7XG4gICAgaWYgKCF0aGlzW19fcmVzb2x2ZWRWYWx1ZXNfX10uaGFzKHNjb3BlKSkge1xuICAgICAgbGV0IG9wdGlvbmFsID0ga2V5ID0+IHtcbiAgICAgICAgcmV0dXJuIHRoaXNbX19zZWFyY2hWYWx1ZV9fXShrZXksIHNjb3BlKTtcbiAgICAgIH07XG5cbiAgICAgIGxldCByZXF1aXJlID0ga2V5ID0+IHtcbiAgICAgICAgbGV0IHZhbHVlID0gb3B0aW9uYWwoa2V5KTtcbiAgICAgICAgaWYgKHZhbHVlID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICBpZiAodGhpc1tfX25hbWVfX10pIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgQ2Fubm90IGZpbmQgJHtrZXl9IHdoaWxlIHByb3ZpZGluZyAke3RoaXNbX19uYW1lX19dfWApO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYENhbm5vdCBmaW5kICR7a2V5fSB3aGlsZSBydW5uaW5nIGV4cHJlc3Npb25gKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHZhbHVlO1xuICAgICAgfTtcblxuICAgICAgLy8gTm93IHJ1biB0aGUgZnVuY3Rpb25cbiAgICAgIGxldCB2YWx1ZTtcbiAgICAgIHRyeSB7XG4gICAgICAgIHZhbHVlID0gdGhpc1tfX2Z1bmN0aW9uX19dKHJlcXVpcmUsIG9wdGlvbmFsKTtcbiAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgaWYgKHRoaXNbX19uYW1lX19dKSB7XG4gICAgICAgICAgdGhyb3cgY3JlYXRlRXJyb3IoXG4gICAgICAgICAgICAgIGBVbmNhdWdodCBleGNlcHRpb24gJHtlfVxcblxcdHdoaWxlIHJ1bm5pbmcgcHJvdmlkZXIgJHt0aGlzW19fbmFtZV9fXX1gLCBlKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB0aHJvdyBjcmVhdGVFcnJvcihgVW5jYXVnaHQgZXhjZXB0aW9uICR7ZX1cXG5cXHR3aGlsZSBydW5uaW5nIGV4cHJlc3Npb25gLCBlKTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBpZiAodmFsdWUgPT09IHVuZGVmaW5lZCAmJiB0aGlzW19fbmFtZV9fXSkge1xuICAgICAgICBjb25zb2xlLndhcm4oYFZhbHVlIG9mICR7dGhpc1tfX25hbWVfX119IGlzIHVuZGVmaW5lZGApO1xuICAgICAgfVxuXG4gICAgICB0aGlzW19fcmVzb2x2ZWRWYWx1ZXNfX10uc2V0KHNjb3BlLCB2YWx1ZSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXNbX19yZXNvbHZlZFZhbHVlc19fXS5nZXQoc2NvcGUpO1xuICB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IFByb3ZpZGVyO1xuIiwiaW1wb3J0IEJpbmRpbmdUcmVlIGZyb20gJy4vYmluZGluZ3RyZWUnO1xuaW1wb3J0IFByb3ZpZGVyIGZyb20gJy4vcHJvdmlkZXInO1xuaW1wb3J0IEdsb2JhbHMgZnJvbSAnLi9nbG9iYWxzJztcblxuXG4vLyBQcml2YXRlIHN5bWJvbHMuXG5jb25zdCBfX2xvY2FsQmluZGluZ3NfXyA9IFN5bWJvbCgnbG9jYWxCaW5kaW5ncycpO1xuY29uc3QgX19wYXJlbnRTY29wZV9fID0gU3ltYm9sKCdwYXJlbnRTY29wZScpO1xuY29uc3QgX19wcmVmaXhfXyA9IFN5bWJvbCgncHJlZml4Jyk7XG5cbmNvbnN0IF9fY3JlYXRlUHJvdmlkZXJfXyA9IFN5bWJvbCgpO1xuXG5jb25zdCBfX2dldF9fID0gR2xvYmFscy5nZXQ7XG5cbmNsYXNzIFNjb3BlIHtcbiAgLyoqXG4gICAqIFNjb3BlIGNvbnRhaW5pbmcgbG9jYWwgYmluZGluZ3MuXG4gICAqXG4gICAqIEBjbGFzcyBESS5TY29wZVxuICAgKiBAY29uc3RydWN0b3JcbiAgICogQHBhcmFtIHtESS5TY29wZX0gW3BhcmVudFNjb3BlPW51bGxdIFRoZSBwYXJlbnQgc2NvcGUuXG4gICAqL1xuICBjb25zdHJ1Y3RvcihwYXJlbnRTY29wZSA9IG51bGwsIHByZWZpeCA9ICcnKSB7XG4gICAgdGhpc1tfX2xvY2FsQmluZGluZ3NfX10gPSBuZXcgQmluZGluZ1RyZWUoKTtcbiAgICB0aGlzW19fcGFyZW50U2NvcGVfX10gPSBwYXJlbnRTY29wZTtcbiAgICB0aGlzW19fcHJlZml4X19dID0gcHJlZml4O1xuICB9XG5cbiAgW19fY3JlYXRlUHJvdmlkZXJfX10oZm4sIG5hbWUgPSBudWxsKSB7XG4gICAgcmV0dXJuIG5ldyBQcm92aWRlcihmbiwgdGhpc1tfX3ByZWZpeF9fXSwgdGhpcywgbmFtZSk7XG4gIH1cblxuICBbX19nZXRfX10oa2V5LCBzY29wZSkge1xuICAgIGxldCBwcm92aWRlciA9IHRoaXNbX19sb2NhbEJpbmRpbmdzX19dLmdldChrZXkpO1xuICAgIGlmIChwcm92aWRlciA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICBpZiAodGhpc1tfX3BhcmVudFNjb3BlX19dKSB7XG4gICAgICAgIHJldHVybiB0aGlzW19fcGFyZW50U2NvcGVfX11bX19nZXRfX10oa2V5LCBzY29wZSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gcHJvdmlkZXIucmVzb2x2ZShzY29wZSk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYSBuZXcgY2hpbGQgc2NvcGUgd2l0aCB0aGUgZ2l2ZW4gdmFsdWUgYm91bmQgdG8gdGhlIGdpdmVuIGtleSBpbiBpdHMgbG9jYWwgYmluZGluZy5cbiAgICpcbiAgICogQG1ldGhvZCB3aXRoXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBrZXkgVGhlIGtleSB0byBib3VuZCB0aGUgdmFsdWUgdG8uXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBrZXlzIE9iamVjdCB3aXRoIG1hcHBpbmcgb2YgdmFyaWFibGUgbmFtZSB0byB0aGUgYm91bmQgbmFtZS5cbiAgICogQHBhcmFtIHtGdW5jdGlvbn0gZm4gVGhlIGZ1bmN0aW9uIHRvIHJ1bi4gVGhlIGZ1bmN0aW9uIHdpbGwgaGF2ZSBvbmUgYXJndW1lbnQsIGNvbnRhaW5pbmdcbiAgICogICAgYm91bmQgcHJvcGVydGllcy4gRWFjaCBwcm9wZXJ0eSBpcyBuYW1lZCBmb2xsb3dpbmcgdGhleSBrZXlzIHNwZWNpZmllZCBpbiB0aGUgYGtleXNgXG4gICAqICAgIGF0dHJpYnV0ZS5cbiAgICogQHJldHVybiB7REkuU2NvcGV9IFRoZSBuZXdseSBjcmVhdGVkIGNoaWxkIHNjb3BlLlxuICAgKi9cbiAgd2l0aChrZXksIGZuKSB7XG4gICAgbGV0IGNoaWxkU2NvcGUgPSBuZXcgU2NvcGUodGhpcywgdGhpc1tfX3ByZWZpeF9fXSk7XG4gICAgY2hpbGRTY29wZVtfX2xvY2FsQmluZGluZ3NfX11cbiAgICAgICAgLmFkZChhcHBlbmQodGhpc1tfX3ByZWZpeF9fXSwga2V5KSwgdGhpc1tfX2NyZWF0ZVByb3ZpZGVyX19dKGZuLCBrZXkpKTtcbiAgICByZXR1cm4gY2hpbGRTY29wZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgbmV3IGNoaWxkIHNjb3BlIHdpdGggdGhlIGdpdmVuIHZhbHVlIGJvdW5kIHRvIHRoZSBnaXZlbiBrZXkgaW4gaXRzIGxvY2FsIGJpbmRpbmcuXG4gICAqIFRoaXMgaXMgc2ltaWxhciB0byB7eyNjcm9zc0xpbmsgXCJESS5TY29wZS93aXRoXCJ9fXt7L2Nyb3NzTGlua319LCBidXQgdGhlIHZhbHVlIGlzIGEgY29uc3RhbnQuXG4gICAqXG4gICAqIEBtZXRob2QgY29uc3RhbnRcbiAgICogQHBhcmFtIHtzdHJpbmd9IGtleSBUaGUga2V5IHRvIGJvdW5kIHRoZSB2YWx1ZSB0by5cbiAgICogQHBhcmFtIHtPYmplY3R9IHZhbHVlIFRoZSBvYmplY3QgdG8gYmluZCB0byB0aGUgZ2l2ZW4ga2V5LlxuICAgKiBAcmV0dXJuIHtESS5TY29wZX0gVGhlIG5ld2x5IGNyZWF0ZWQgY2hpbGQgc2NvcGUuXG4gICAqL1xuICBjb25zdGFudChrZXksIHZhbHVlKSB7XG4gICAgcmV0dXJuIHRoaXMud2l0aChrZXksICgpID0+IHZhbHVlKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHbG9iYWxseSBiaW5kcyB0aGUgZ2l2ZW4gdmFsdWUgdG8gdGhlIGdpdmVuIGtleS5cbiAgICpcbiAgICogQG1ldGhvZCBiaW5kXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBrZXkgVGhlIGtleSB0byBib3VuZCB0aGUgdmFsdWUgdG8uXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBrZXlzIE9iamVjdCB3aXRoIG1hcHBpbmcgb2YgdmFyaWFibGUgbmFtZSB0byB0aGUgYm91bmQgbmFtZS5cbiAgICogQHBhcmFtIHtGdW5jdGlvbn0gZm4gVGhlIGZ1bmN0aW9uIHRvIHJ1bi4gVGhlIGZ1bmN0aW9uIHdpbGwgaGF2ZSBvbmUgYXJndW1lbnQsIGNvbnRhaW5pbmdcbiAgICogICAgYm91bmQgcHJvcGVydGllcy4gRWFjaCBwcm9wZXJ0eSBpcyBuYW1lZCBmb2xsb3dpbmcgdGhleSBrZXlzIHNwZWNpZmllZCBpbiB0aGUgYGtleXNgXG4gICAqICAgIGF0dHJpYnV0ZS5cbiAgICovXG4gIGJpbmQoa2V5LCBmbikge1xuICAgIEdsb2JhbHMuYmluZGluZ3MuYWRkKGFwcGVuZCh0aGlzW19fcHJlZml4X19dLCBrZXkpLCB0aGlzW19fY3JlYXRlUHJvdmlkZXJfX10oZm4sIGtleSkpO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgdGhlIHByb3ZpZGVyIGJvdW5kIHRvIHRoZSBnaXZlbiBrZXkgYW5kIHJlc29sdmUgaXQgaW4gdGhpcyBzY29wZS4gVGhpcyB3aWxsIGZpcnN0IGNoZWNrXG4gICAqIGZvciB0aGUgbG9jYWwgYmluZGluZ3MsIHRoZW4gaXRzIGFuY2VzdG9ycy4gSWYgbm8gYmluZGluZyBpcyBmb3VuZCBpbiB0aGUgYW5jZXN0cmFsIHBhdGgsIHRoaXNcbiAgICogd2lsbCBjaGVjayBmb3IgdGhlIGdsb2JhbCBiaW5kaW5ncy5cbiAgICpcbiAgICogQG1ldGhvZCBnZXRcbiAgICogQHBhcmFtIHtzdHJpbmd9IGtleSBLZXkgd2hvc2UgYm91bmQgdmFsdWUgc2hvdWxkIGJlIHJldHVybmVkLlxuICAgKiBAcmV0dXJuIHthbnl9IFRoZSB2YWx1ZSBib3VuZCB0byB0aGUgZ2l2ZW4ga2V5LCBvciB1bmRlZmluZWQgaWYgbm8gdmFsdWVzIGNhbiBiZSBmb3VuZC5cbiAgICovXG4gIGdldChrZXkpIHtcbiAgICBsZXQgdmFsdWUgPSB0aGlzW19fZ2V0X19dKGFwcGVuZCh0aGlzW19fcHJlZml4X19dLCBrZXkpKTtcbiAgICBpZiAodmFsdWUgPT09IHVuZGVmaW5lZCkge1xuICAgICAgcmV0dXJuIEdsb2JhbHMuZ2V0R2xvYmFsKGtleSwgdGhpcyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiB2YWx1ZTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogUnVucyB0aGUgZ2l2ZW4gZnVuY3Rpb24gYWZ0ZXIgaW5qZWN0aW5nIGFueSBkZXBlbmRlbmNpZXMuXG4gICAqXG4gICAqIEBtZXRob2QgcnVuXG4gICAqIEBwYXJhbSB7RnVuY3Rpb259IGZuIFRoZSBmdW5jdGlvbiB0byBydW4uIFRoZSBmdW5jdGlvbidzIGFyZ3VtZW50cyB3aWxsIGJlIGJvdW5kIGJhc2VkIG9uXG4gICAqICAgIHRoZWlyIG5hbWVzLlxuICAgKi9cbiAgcnVuKGZuKSB7XG4gICAgdGhpc1tfX2NyZWF0ZVByb3ZpZGVyX19dKGZuKS5yZXNvbHZlKHRoaXMpO1xuICB9XG5cbiAgLyoqXG4gICAqIFByZWZpeCBhbnkga2V5cyBnaXZlbiB0byB0aGlzIHNjb3BlIHdpdGggdGhlIGdpdmVuIHByZWZpeC5cbiAgICpcbiAgICogQG1ldGhvZCBwcmVmaXhcbiAgICogQHBhcmFtIHtzdHJpbmd9IHByZWZpeCBUaGUgcHJlZml4IHRvIGFkZC5cbiAgICogQHJldHVybiB7REkuU2NvcGV9IFRoZSBuZXdseSBjcmVhdGVkIGNoaWxkIHNjb3BlIHdpdGggdGhlIGdpdmVuIHByZWZpeC5cbiAgICovXG4gIHByZWZpeChwcmVmaXgpIHtcbiAgICByZXR1cm4gbmV3IFNjb3BlKHRoaXMsIGFwcGVuZChwcmVmaXgsIHRoaXNbX19wcmVmaXhfX10pKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBhcHBlbmQobCwgcikge1xuICByZXR1cm4gW2wsIHJdLmZpbHRlcihpID0+ICEhaSkuam9pbignLicpO1xufVxuXG5leHBvcnQgZGVmYXVsdCBTY29wZTtcbiJdfQ==
