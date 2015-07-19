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
  return function (require, optional, load) {
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

          var load = function (key) {
            optional(key);
          };

          // Now run the function
          var value = undefined;
          try {
            value = _this[__function__](require, optional, load);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIvVXNlcnMvZ3NvZWQvcHJvai9kaS1qcy9zcmMvYmluZGluZ3RyZWUuanMiLCIvVXNlcnMvZ3NvZWQvcHJvai9kaS1qcy9zcmMvZ2xvYmFscy5qcyIsIi9Vc2Vycy9nc29lZC9wcm9qL2RpLWpzL3NyYy9pbmRleC5qcyIsIi9Vc2Vycy9nc29lZC9wcm9qL2RpLWpzL3NyYy9vbGRzY29wZS5qcyIsIi9Vc2Vycy9nc29lZC9wcm9qL2RpLWpzL3NyYy9wcm92aWRlci5qcyIsIi9Vc2Vycy9nc29lZC9wcm9qL2RpLWpzL3NyYy9zY29wZS5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7Ozs7QUNDQSxJQUFNLFVBQVUsR0FBRyxNQUFNLENBQUMsUUFBUSxDQUFDLENBQUM7O0FBRXBDLElBQU0sU0FBUyxHQUFHLEdBQUcsQ0FBQzs7SUFFaEIsV0FBVzs7Ozs7Ozs7QUFPSixXQVBQLFdBQVcsR0FPRDswQkFQVixXQUFXOztBQVFiLFFBQUksQ0FBQyxVQUFVLENBQUMsR0FBRyxJQUFJLEdBQUcsRUFBRSxDQUFDO0dBQzlCOztlQVRHLFdBQVc7QUFxQmYsT0FBRzs7Ozs7Ozs7Ozs7OzthQUFBLGFBQUMsR0FBRyxFQUFFLEtBQUssRUFBYTtZQUFYLEtBQUssZ0NBQUcsQ0FBQzs7O0FBRXZCLFlBQUksUUFBUSxHQUFHLEdBQUcsQ0FBQyxLQUFLLENBQUMsU0FBUyxDQUFDLENBQUM7QUFDcEMsWUFBSSxVQUFVLEdBQUcsUUFBUSxDQUFDLFFBQVEsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxHQUFHLEtBQUssQ0FBQyxDQUFDOztBQUV2RCxZQUFJLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxVQUFVLENBQUMsRUFBRTtBQUNyQyxjQUFJLENBQUMsVUFBVSxDQUFDLENBQUMsR0FBRyxDQUFDLFVBQVUsRUFBRTtBQUMvQixl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Q3ZCLGVBQU8sT0FBTyxDQUFDLFNBQVMsQ0FBQyxHQUFHLEVBQUUsSUFBSSxDQUFDLENBQUM7T0FDckMsTUFBTTtBQUNMLGVBQU8sS0FBSyxDQUFDO09BQ2Q7S0FDRjs7Ozs7Ozs7Ozs7V0FTRSxhQUFDLEVBQUUsRUFBRTtBQUNOLFVBQUksQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQztLQUM1Qzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O09BU0ssVUFBQyxNQUFNLEVBQUU7QUFDYixhQUFPLElBQUksS0FBSyxDQUFDLElBQUksRUFBRSxNQUFNLENBQUMsTUFBTSxFQUFFLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUM7S0FDMUQ7OztTQW5IRyxLQUFLOzs7QUFzSFgsU0FBUyxNQUFNLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRTtBQUNwQixTQUFPLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxVQUFBLENBQUM7V0FBSSxDQUFDLENBQUMsQ0FBQztHQUFBLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7Q0FDMUM7O2lCQUVjLEtBQUsiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiLy8gUHJpdmF0ZSBzeW1ib2xzLlxuY29uc3QgX192YWx1ZXNfXyA9IFN5bWJvbCgndmFsdWVzJyk7XG5cbmNvbnN0IFNFUEFSQVRPUiA9ICdfJztcblxuY2xhc3MgQmluZGluZ1RyZWUge1xuXG4gIC8qKlxuICAgKiBSZXByZXNlbnRzIGEgdHJlZSBvZiBib3VuZCB2YWx1ZXMga2V5ZWQgYnkgYmluZGluZyBrZXkuXG4gICAqIEBjbGFzcyBESS5CaW5kaW5nVHJlZVxuICAgKiBAY29uc3RydWN0b3JcbiAgICovXG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHRoaXNbX192YWx1ZXNfX10gPSBuZXcgTWFwKCk7XG4gIH1cblxuICAvKipcbiAgICogQWRkcyB0aGUgZ2l2ZW4ga2V5IGFuZCB2YWx1ZSB0byB0aGUgdHJlZS4gVGhlIHRyZWUgd2lsbCB0cnkgdG8gYmluZCB1c2luZyB0aGUgbGFzdCBzZWdtZW50IG9mXG4gICAqIHRoZSBrZXkuIElmIHRoaXMgY2F1c2VzIGEgY29uZmxpY3QsIGl0IHdpbGwgY3JlYXRlIGEgc3VidHJlZS5cbiAgICpcbiAgICogQG1ldGhvZCBhZGRcbiAgICogQHBhcmFtIHtzdHJpbmd9IGtleSBUaGUga2V5IHRvIGJpbmQgdGhlIHZhbHVlIHRvLlxuICAgKiBAcGFyYW0ge09iamVjdH0gdmFsdWUgVGhlIHZhbHVlIHRvIGJlIGJvdW5kLlxuICAgKiBAcGFyYW0ge251bWJlcn0gW2RlcHRoPTBdIFRoZSBkZXB0aCBvZiB0aGUga2V5IHRvIHVzZSBhcyBiaW5kaW5nIGtleS4gVGhpcyBzaG91bGQgbm90IGJlXG4gICAqICAgIGNhbGxlZCBmcm9tIG91dHNpZGUgdGhlIGNsYXNzLlxuICAgKi9cbiAgYWRkKGtleSwgdmFsdWUsIGRlcHRoID0gMCkge1xuICAgIC8vIFRPRE8oZ3MpOiBSZW1vdmUgdGhlIHNlcGFyYXRvclxuICAgIGxldCBzZWdtZW50cyA9IGtleS5zcGxpdChTRVBBUkFUT1IpO1xuICAgIGxldCBiaW5kaW5nS2V5ID0gc2VnbWVudHNbc2VnbWVudHMubGVuZ3RoIC0gMSAtIGRlcHRoXTtcblxuICAgIGlmICghdGhpc1tfX3ZhbHVlc19fXS5oYXMoYmluZGluZ0tleSkpIHtcbiAgICAgIHRoaXNbX192YWx1ZXNfX10uc2V0KGJpbmRpbmdLZXksIHtcbiAgICAgICAga2V5OiBrZXksXG4gICAgICAgIHZhbHVlOiB2YWx1ZVxuICAgICAgfSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIFRoZXJlIGlzIGFscmVhZHkgYSB2YWx1ZSBjb3JyZXNwb25kaW5nIHRvIHRoaXMga2V5XG4gICAgICBsZXQgZXhpc3RpbmdWYWx1ZSA9IHRoaXNbX192YWx1ZXNfX10uZ2V0KGJpbmRpbmdLZXkpO1xuICAgICAgaWYgKGV4aXN0aW5nVmFsdWUua2V5ID09PSBrZXkpIHtcbiAgICAgICAgdGhyb3cgYEtleSAke2tleX0gaXMgYWxyZWFkeSBib3VuZGA7XG4gICAgICB9XG5cbiAgICAgIGxldCBuZXdUcmVlID0gbmV3IEJpbmRpbmdUcmVlKCk7XG4gICAgICB0aGlzW19fdmFsdWVzX19dLnNldChiaW5kaW5nS2V5LCBuZXdUcmVlKTtcbiAgICAgIG5ld1RyZWUuYWRkKGV4aXN0aW5nVmFsdWUua2V5LCBleGlzdGluZ1ZhbHVlLnZhbHVlLCBkZXB0aCArIDEpO1xuICAgICAgbmV3VHJlZS5hZGQoa2V5LCB2YWx1ZSwgZGVwdGggKyAxKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyB0aGUgdmFsdWUgY29ycmVzcG9uZGluZyB0byB0aGUgZ2l2ZW4ga2V5LlxuICAgKlxuICAgKiBAcGFyYW0ge3N0cmluZ30ga2V5IEtleSBvZiB0aGUgdmFsdWUgdG8gcmV0dXJuLlxuICAgKiBAcGFyYW0ge251bWJlcn0gW2RlcHRoPTBdIFRoZSBkZXB0aCBvZiB0aGUga2V5IHRvIHVzZSBhcyBiaW5kaW5nIGtleS4gVGhpcyBzaG91bGQgbm90IGJlXG4gICAqICAgIGNhbGxlZCBmcm9tIG91dHNpZGUgdGhlIGNsYXNzLlxuICAgKiBAcmV0dXJuIHthbnl9IFRoZSBib3VuZCB2YWx1ZSwgb3IgdW5kZWZpbmVkIGlmIHRoZSB2YWx1ZSBjYW5ub3QgYmUgZm91bmQsIG9yIGlmIHRoZSBrZXkgaGFzXG4gICAqICAgIGNvbGxpc2lvbiBidXQgY29sbGlzaW9uIGNhbm5vdCBiZSByZXNvbHZlZC5cbiAgICovXG4gIGdldChrZXksIGRlcHRoID0gMCkge1xuICAgIGxldCBzZWdtZW50cyA9IGtleS5zcGxpdChTRVBBUkFUT1IpO1xuICAgIGxldCBiaW5kaW5nS2V5ID0gc2VnbWVudHNbc2VnbWVudHMubGVuZ3RoIC0gMSAtIGRlcHRoXTtcblxuICAgIGlmIChiaW5kaW5nS2V5ID09PSB1bmRlZmluZWQpIHtcbiAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgfVxuXG4gICAgaWYgKCF0aGlzW19fdmFsdWVzX19dLmhhcyhiaW5kaW5nS2V5KSkge1xuICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICB9XG5cbiAgICBsZXQgdmFsdWUgPSB0aGlzW19fdmFsdWVzX19dLmdldChiaW5kaW5nS2V5KTtcbiAgICBpZiAodmFsdWUgaW5zdGFuY2VvZiBCaW5kaW5nVHJlZSkge1xuICAgICAgcmV0dXJuIHZhbHVlLmdldChrZXksIGRlcHRoICsgMSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiB2YWx1ZS52YWx1ZTtcbiAgICB9XG4gIH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgQmluZGluZ1RyZWU7IiwiaW1wb3J0IEJpbmRpbmdUcmVlIGZyb20gJy4vYmluZGluZ3RyZWUnO1xuXG5jb25zdCBHbG9iYWxzID0ge1xuICBnZXQ6IFN5bWJvbCgnZ2V0JyksXG5cbiAgZ2V0R2xvYmFsKGtleSwgc2NvcGUpIHtcbiAgICBsZXQgZ2xvYmFsUHJvdmlkZXIgPSB0aGlzLmJpbmRpbmdzLmdldChrZXkpO1xuICAgIGlmIChnbG9iYWxQcm92aWRlciA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gZ2xvYmFsUHJvdmlkZXIucmVzb2x2ZShzY29wZSk7XG4gICAgfVxuICB9LFxuXG4gIGJpbmRpbmdzOiBuZXcgQmluZGluZ1RyZWUoKVxufTtcblxuZXhwb3J0IGRlZmF1bHQgR2xvYmFsczsiLCJpbXBvcnQgQmluZGluZ1RyZWUgZnJvbSAnLi9iaW5kaW5ndHJlZSc7XG5pbXBvcnQgR2xvYmFscyBmcm9tICcuL2dsb2JhbHMnO1xuaW1wb3J0IFByb3ZpZGVyIGZyb20gJy4vcHJvdmlkZXInO1xuaW1wb3J0IFNjb3BlIGZyb20gJy4vc2NvcGUnO1xuaW1wb3J0IE9sZFNjb3BlIGZyb20gJy4vb2xkc2NvcGUnO1xuXG4oKHdpbmRvdykgPT4ge1xuICB3aW5kb3dbJ0RJSlMnXSA9IG5ldyBTY29wZSgpO1xuICB3aW5kb3dbJ0RJSlMnXVsnU2NvcGUnXSA9IFNjb3BlO1xuXG4gIHdpbmRvd1snREknXSA9IG5ldyBPbGRTY29wZSgpO1xuICB3aW5kb3dbJ0RJJ11bJ09sZFNjb3BlJ10gPSBPbGRTY29wZTtcblxuICB3aW5kb3dbJ0RJJ11bJ0JpbmRpbmdUcmVlJ10gPSBCaW5kaW5nVHJlZTtcbiAgd2luZG93WydESSddWydQcm92aWRlciddID0gUHJvdmlkZXI7XG4gIHdpbmRvd1snREknXVsnYmluZGluZ3MnXSA9IEdsb2JhbHMuYmluZGluZ3M7XG59KSh3aW5kb3cpO1xuIiwiaW1wb3J0IFNjb3BlIGZyb20gJy4vc2NvcGUnO1xuXG5mdW5jdGlvbiB3cmFwKGtleXMsIGZuKSB7XG4gIHJldHVybiAocmVxdWlyZSwgb3B0aW9uYWwsIGxvYWQpID0+IHtcbiAgICBsZXQgaW5qZWN0b3IgPSB7fTtcblxuICAgIGZvciAobGV0IGFyZ05hbWUgb2YgT2JqZWN0LmtleXMoa2V5cykpIHtcbiAgICAgIGxldCBrZXkgPSBrZXlzW2FyZ05hbWVdO1xuXG4gICAgICAvLyBDaGVjayBpZiB0aGUga2V5IGlzIG9wdGlvbmFsLlxuICAgICAgbGV0IGlzT3B0aW9uYWwgPSBrZXlba2V5Lmxlbmd0aCAtIDFdID09PSAnPyc7XG4gICAgICBpZiAoaXNPcHRpb25hbCkge1xuICAgICAgICBrZXkgPSBrZXkuc3Vic3RyaW5nKDAsIGtleS5sZW5ndGggLSAxKTtcbiAgICAgIH1cblxuICAgICAgLy8gTm93IHJlcGxhY2UgYW55ID0gaW4gdGhlIGtleSB3aXRoIHRoZSBhcmd1bWVudCBuYW1lLlxuICAgICAga2V5ID0ga2V5LnJlcGxhY2UoJz0nLCBhcmdOYW1lLnRyaW0oKSk7XG5cbiAgICAgIGlmIChpc09wdGlvbmFsKSB7XG4gICAgICAgIGluamVjdG9yW2FyZ05hbWVdID0gb3B0aW9uYWwoa2V5KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGluamVjdG9yW2FyZ05hbWVdID0gcmVxdWlyZWQoa2V5KTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGZuKGluamVjdG9yKTtcbiAgfTtcbn1cblxuY2xhc3MgT2xkU2NvcGUgZXh0ZW5kcyBTY29wZSB7XG4gIGNvbnN0cnVjdG9yKHBhcmVudFNjb3BlID0gbnVsbCwgcHJlZml4ID0gJycpIHtcbiAgICBzdXBlcihwYXJlbnRTY29wZSwgcHJlZml4KTtcbiAgfVxuXG4gIHdpdGgoa2V5LCBrZXlzLCBmbikge1xuICAgIHJldHVybiBzdXBlci53aXRoKGtleSwgd3JhcChrZXlzLCBmbikpO1xuICB9XG5cbiAgYmluZChrZXksIGtleXMsIGZuKSB7XG4gICAgcmV0dXJuIHN1cGVyLmJpbmQoa2V5LCB3cmFwKGtleXMsIGZuKSk7XG4gIH1cblxuICBydW4oa2V5cywgZm4pIHtcbiAgICByZXR1cm4gc3VwZXIucnVuKHdyYXAoa2V5cywgZm4pKTtcbiAgfVxuXG4gIGNvbnN0YW50KGtleSwgdmFsdWUpIHtcbiAgICByZXR1cm4gdGhpcy53aXRoKGtleSwge30sICgpID0+IHZhbHVlKTtcbiAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBPbGRTY29wZTtcbiIsImltcG9ydCBHbG9iYWxzIGZyb20gJy4vZ2xvYmFscyc7XG5cbmNvbnN0IF9fZ2V0X18gPSBHbG9iYWxzLmdldDtcblxuLy8gUHJpdmF0ZSBzeW1ib2xzLlxuY29uc3QgX19mdW5jdGlvbl9fID0gU3ltYm9sKCk7XG5jb25zdCBfX2xvY2FsU2NvcGVfXyA9IFN5bWJvbCgnbG9jYWxTY29wZScpO1xuY29uc3QgX19uYW1lX18gPSBTeW1ib2woKTtcbmNvbnN0IF9fbm9ybWFsaXplS2V5X18gPSBTeW1ib2woKTtcbmNvbnN0IF9fcHJlZml4X18gPSBTeW1ib2woJ3ByZWZpeCcpO1xuY29uc3QgX19yZXNvbHZlZFZhbHVlc19fID0gU3ltYm9sKCk7XG5jb25zdCBfX3NlYXJjaFZhbHVlX18gPSBTeW1ib2woKTtcblxuZnVuY3Rpb24gY3JlYXRlRXJyb3IobXNnLCBjYXVzZSkge1xuICByZXR1cm4gbmV3IEVycm9yKGAke21zZ31cXG5DYXVzZWQgYnk6XFxuJHtjYXVzZS5zdGFja31gKTtcbn1cblxuY2xhc3MgUHJvdmlkZXIge1xuXG4gIC8qKlxuICAgKiBAY2xhc3MgREkuUHJvdmlkZXJcbiAgICogQGNvbnN0cnVjdG9yXG4gICAqIEBwYXJhbSB7RnVuY3Rpb259IGZuIFRoZSBmdW5jdGlvbiB0byBydW4uIFRoZSBmdW5jdGlvbiBzaG91bGQgdGFrZSBvbmUgYXJndW1lbnQsIHdoaWNoIGlzIGFuXG4gICAqICAgIG9iamVjdCB0aGF0IHdpbGwgY29udGFpbiB0aGUgaW5qZWN0ZWQgdmFsdWVzLCBrZXllZCBieSB0aGUgZ2l2ZW4ga2V5cy5cbiAgICogQHBhcmFtIHtzdHJpbmd9IHByZWZpeCBUaGUgcHJlZml4IHRvIHVzZSBmb3IgdGhlIGtleXMuXG4gICAqIEBwYXJhbSB7REkuU2NvcGV9IGxvY2FsU2NvcGUgVGhlIGxvY2FsIHNjb3BlLiBUaGlzIHdpbGwgYmUgcHJpb3JpdGl6ZWQgd2hlbiBjaGVja2luZyBmb3IgYm91bmRcbiAgICogICAgdmFsdWVzLlxuICAgKiBAcGFyYW0ge3N0cmluZ30gW25hbWU9bnVsbF0gUmVmZXJlbmNlIG5hbWUgb2YgdGhlIHByb3ZpZGVyLiBUaGlzIGlzIHVzZWQgZm9yIGRldGVjdGluZyBjeWNsaWNcbiAgICogICAgZGVwZW5kZW5jaWVzLlxuICAgKi9cbiAgY29uc3RydWN0b3IoZm4sIHByZWZpeCwgbG9jYWxTY29wZSwgbmFtZSA9IG51bGwpIHtcbiAgICB0aGlzW19fZnVuY3Rpb25fX10gPSBmbjtcbiAgICB0aGlzW19fcHJlZml4X19dID0gcHJlZml4O1xuICAgIHRoaXNbX19sb2NhbFNjb3BlX19dID0gbG9jYWxTY29wZTtcbiAgICB0aGlzW19fbmFtZV9fXSA9IG5hbWU7XG4gICAgdGhpc1tfX3Jlc29sdmVkVmFsdWVzX19dID0gbmV3IE1hcCgpO1xuICB9XG5cbiAgLyoqXG4gICAqIFNlYXJjaGVzIGZvciB0aGUgdmFsdWUgd2l0aCB0aGUgZ2l2ZW4ga2V5LiBGaXJzdCwgaXQgdHJpZXMgc2VhcmNoaW5nIGluIHRoZSBsb2NhbCBzY29wZS4gVGhlblxuICAgKiBpdCBzZWFyY2hlcyBpbiB0aGUgZ2l2ZW4gc2NvcGUuIElmIHRoZSBrZXkgaXMgc3RpbGwgbm90IGZvdW5kLCBpdCBzZWFyY2hlcyBpbiB0aGUgZ2xvYmFsXG4gICAqIHNjb3BlLlxuICAgKlxuICAgKiBAbWV0aG9kIF9fc2VhcmNoVmFsdWVfX1xuICAgKiBAcGFyYW0ge3N0cmluZ30ga2V5IEtleSB0byBzZWFyY2ggdGhlIHZhbHVlIGJ5XG4gICAqIEBwYXJhbSB7W0RJLlNjb3BlfSBzY29wZSBTY29wZSB0byBzZWFyY2ggdGhlIHZhbHVlIGluLlxuICAgKiBAcmV0dXJuIHthbnl9IFZhbHVlIGNvcnJlc3BvbmRpbmcgdG8gdGhlIGdpdmVuIGtleSwgb3IgdW5kZWZpbmVkIGlmIG5vbmUgd2VyZSBmb3VuZC5cbiAgICogQHByaXZhdGVcbiAgICovXG4gIFtfX3NlYXJjaFZhbHVlX19dKGtleSwgc2NvcGUpIHtcbiAgICAvLyBOb3JtYWxpemUgdGhlIGtleS5cbiAgICBrZXkgPSB0aGlzW19fbm9ybWFsaXplS2V5X19dKGtleSk7XG5cbiAgICAvLyBUT0RPKGdzKTogSGFuZGxlIGN5Y2xpYyBkZXBlbmRlbmN5LlxuICAgIGxldCB2YWx1ZTtcblxuICAgIHRyeSB7XG4gICAgICAvLyBDaGVjayB0aGUgbG9jYWwgc2NvcGUgZmlyc3QuXG4gICAgICB2YWx1ZSA9IHRoaXNbX19sb2NhbFNjb3BlX19dW19fZ2V0X19dKGtleSwgc2NvcGUpO1xuXG4gICAgICBpZiAodmFsdWUgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAvLyBJZiB2YWx1ZSBjYW5ub3QgYmUgcmVzb2x2ZWQgaW4gdGhlIGxvY2FsIHNjb3BlLCBjaGVjayB0aGUgZ2l2ZW4gc2NvcGUuXG4gICAgICAgIHZhbHVlID0gc2NvcGVbX19nZXRfX10oa2V5LCBzY29wZSk7XG4gICAgICB9XG5cbiAgICAgIGlmICh2YWx1ZSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIC8vIElmIHZhbHVlIGNhbm5vdCBiZSByZXNvbHZlZCBpbiB0aGUgbG9jYWwgc2NvcGUsIGNoZWNrIHRoZSBnbG9iYWwgYmluZGluZ3MuXG4gICAgICAgIHZhbHVlID0gR2xvYmFscy5nZXRHbG9iYWwoa2V5LCBzY29wZSk7XG4gICAgICB9XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgLy8gVE9ETyhncyk6IE1ha2UgYSBzaGFyZWQgbWV0aG9kLlxuICAgICAgaWYgKHRoaXNbX19uYW1lX19dKSB7XG4gICAgICAgIHRocm93IGNyZWF0ZUVycm9yKGAke2V9XFxuXFx0d2hpbGUgcHJvdmlkaW5nICR7dGhpc1tfX25hbWVfX119YCwgZSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aHJvdyBjcmVhdGVFcnJvcihgJHtlfVxcblxcdHdoaWxlIHJ1bm5pbmcgZXhwcmVzc2lvbmAsIGUpO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiB2YWx1ZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBOb3JtYWxpemVzIHRoZSBnaXZlbiBrZXkuXG4gICAqXG4gICAqIEBtZXRob2QgX19ub3JtYWxpemVLZXlfX1xuICAgKiBAcGFyYW0ge3N0cmluZ30ga2V5IFRoZSBrZXkgdG8gbm9ybWFsaXplLlxuICAgKiBAcmV0dXJuIHtzdHJpbmd9IFRoZSBub3JtYWxpemVkIGtleS5cbiAgICogQHByaXZhdGVcbiAgICovXG4gIFtfX25vcm1hbGl6ZUtleV9fXShrZXkpIHtcbiAgICAvLyBDaGVjayBpZiB0aGUga2V5IGlzIHJvb3Qga2V5LlxuICAgIGxldCBpc1Jvb3QgPSBrZXlbMF0gPT09ICcvJztcbiAgICBpZiAoaXNSb290KSB7XG4gICAgICByZXR1cm4ga2V5LnN1YnN0cmluZygxKTtcbiAgICB9IGVsc2UgaWYgKHRoaXNbX19wcmVmaXhfX10pIHtcbiAgICAgIHJldHVybiBgJHt0aGlzW19fcHJlZml4X19dfS4ke2tleX1gO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4ga2V5O1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBSZXNvbHZlcyB0aGUgcHJvdmlkZXIuIFJlc29sdmVkIHZhbHVlcyBhcmUgY2FjaGVkIHBlciBzY29wZS5cbiAgICpcbiAgICogQG1ldGhvZCByZXNvbHZlXG4gICAqIEBwYXJhbSB7REkuU2NvcGV9IHNjb3BlIFRoZSBzY29wZSB0byByZXNvbHZlIHRoZSB2YWx1ZSBpbi5cbiAgICogQHJldHVybiB7T2JqZWN0fSBUaGUgcmVzb2x2ZWQgdmFsdWUgZm9yIHRoZSBnaXZlbiBzY29wZS5cbiAgICovXG4gIHJlc29sdmUoc2NvcGUpIHtcbiAgICBpZiAoIXRoaXNbX19yZXNvbHZlZFZhbHVlc19fXS5oYXMoc2NvcGUpKSB7XG4gICAgICBsZXQgb3B0aW9uYWwgPSBrZXkgPT4ge1xuICAgICAgICByZXR1cm4gdGhpc1tfX3NlYXJjaFZhbHVlX19dKGtleSwgc2NvcGUpO1xuICAgICAgfTtcblxuICAgICAgbGV0IHJlcXVpcmUgPSBrZXkgPT4ge1xuICAgICAgICBsZXQgdmFsdWUgPSBvcHRpb25hbChrZXkpO1xuICAgICAgICBpZiAodmFsdWUgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgIGlmICh0aGlzW19fbmFtZV9fXSkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBDYW5ub3QgZmluZCAke2tleX0gd2hpbGUgcHJvdmlkaW5nICR7dGhpc1tfX25hbWVfX119YCk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgQ2Fubm90IGZpbmQgJHtrZXl9IHdoaWxlIHJ1bm5pbmcgZXhwcmVzc2lvbmApO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdmFsdWU7XG4gICAgICB9O1xuXG4gICAgICBsZXQgbG9hZCA9IGtleSA9PiB7XG4gICAgICAgIG9wdGlvbmFsKGtleSk7XG4gICAgICB9O1xuXG4gICAgICAvLyBOb3cgcnVuIHRoZSBmdW5jdGlvblxuICAgICAgbGV0IHZhbHVlO1xuICAgICAgdHJ5IHtcbiAgICAgICAgdmFsdWUgPSB0aGlzW19fZnVuY3Rpb25fX10ocmVxdWlyZSwgb3B0aW9uYWwsIGxvYWQpO1xuICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICBpZiAodGhpc1tfX25hbWVfX10pIHtcbiAgICAgICAgICB0aHJvdyBjcmVhdGVFcnJvcihcbiAgICAgICAgICAgICAgYFVuY2F1Z2h0IGV4Y2VwdGlvbiAke2V9XFxuXFx0d2hpbGUgcnVubmluZyBwcm92aWRlciAke3RoaXNbX19uYW1lX19dfWAsIGUpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHRocm93IGNyZWF0ZUVycm9yKGBVbmNhdWdodCBleGNlcHRpb24gJHtlfVxcblxcdHdoaWxlIHJ1bm5pbmcgZXhwcmVzc2lvbmAsIGUpO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGlmICh2YWx1ZSA9PT0gdW5kZWZpbmVkICYmIHRoaXNbX19uYW1lX19dKSB7XG4gICAgICAgIGNvbnNvbGUud2FybihgVmFsdWUgb2YgJHt0aGlzW19fbmFtZV9fXX0gaXMgdW5kZWZpbmVkYCk7XG4gICAgICB9XG5cbiAgICAgIHRoaXNbX19yZXNvbHZlZFZhbHVlc19fXS5zZXQoc2NvcGUsIHZhbHVlKTtcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpc1tfX3Jlc29sdmVkVmFsdWVzX19dLmdldChzY29wZSk7XG4gIH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgUHJvdmlkZXI7XG4iLCJpbXBvcnQgQmluZGluZ1RyZWUgZnJvbSAnLi9iaW5kaW5ndHJlZSc7XG5pbXBvcnQgUHJvdmlkZXIgZnJvbSAnLi9wcm92aWRlcic7XG5pbXBvcnQgR2xvYmFscyBmcm9tICcuL2dsb2JhbHMnO1xuXG5cbi8vIFByaXZhdGUgc3ltYm9scy5cbmNvbnN0IF9fbG9jYWxCaW5kaW5nc19fID0gU3ltYm9sKCdsb2NhbEJpbmRpbmdzJyk7XG5jb25zdCBfX3BhcmVudFNjb3BlX18gPSBTeW1ib2woJ3BhcmVudFNjb3BlJyk7XG5jb25zdCBfX3ByZWZpeF9fID0gU3ltYm9sKCdwcmVmaXgnKTtcblxuY29uc3QgX19jcmVhdGVQcm92aWRlcl9fID0gU3ltYm9sKCk7XG5cbmNvbnN0IF9fZ2V0X18gPSBHbG9iYWxzLmdldDtcblxuY2xhc3MgU2NvcGUge1xuICAvKipcbiAgICogU2NvcGUgY29udGFpbmluZyBsb2NhbCBiaW5kaW5ncy5cbiAgICpcbiAgICogQGNsYXNzIERJLlNjb3BlXG4gICAqIEBjb25zdHJ1Y3RvclxuICAgKiBAcGFyYW0ge0RJLlNjb3BlfSBbcGFyZW50U2NvcGU9bnVsbF0gVGhlIHBhcmVudCBzY29wZS5cbiAgICovXG4gIGNvbnN0cnVjdG9yKHBhcmVudFNjb3BlID0gbnVsbCwgcHJlZml4ID0gJycpIHtcbiAgICB0aGlzW19fbG9jYWxCaW5kaW5nc19fXSA9IG5ldyBCaW5kaW5nVHJlZSgpO1xuICAgIHRoaXNbX19wYXJlbnRTY29wZV9fXSA9IHBhcmVudFNjb3BlO1xuICAgIHRoaXNbX19wcmVmaXhfX10gPSBwcmVmaXg7XG4gIH1cblxuICBbX19jcmVhdGVQcm92aWRlcl9fXShmbiwgbmFtZSA9IG51bGwpIHtcbiAgICByZXR1cm4gbmV3IFByb3ZpZGVyKGZuLCB0aGlzW19fcHJlZml4X19dLCB0aGlzLCBuYW1lKTtcbiAgfVxuXG4gIFtfX2dldF9fXShrZXksIHNjb3BlKSB7XG4gICAgbGV0IHByb3ZpZGVyID0gdGhpc1tfX2xvY2FsQmluZGluZ3NfX10uZ2V0KGtleSk7XG4gICAgaWYgKHByb3ZpZGVyID09PSB1bmRlZmluZWQpIHtcbiAgICAgIGlmICh0aGlzW19fcGFyZW50U2NvcGVfX10pIHtcbiAgICAgICAgcmV0dXJuIHRoaXNbX19wYXJlbnRTY29wZV9fXVtfX2dldF9fXShrZXksIHNjb3BlKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBwcm92aWRlci5yZXNvbHZlKHNjb3BlKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlcyBhIG5ldyBjaGlsZCBzY29wZSB3aXRoIHRoZSBnaXZlbiB2YWx1ZSBib3VuZCB0byB0aGUgZ2l2ZW4ga2V5IGluIGl0cyBsb2NhbCBiaW5kaW5nLlxuICAgKlxuICAgKiBAbWV0aG9kIHdpdGhcbiAgICogQHBhcmFtIHtzdHJpbmd9IGtleSBUaGUga2V5IHRvIGJvdW5kIHRoZSB2YWx1ZSB0by5cbiAgICogQHBhcmFtIHtPYmplY3R9IGtleXMgT2JqZWN0IHdpdGggbWFwcGluZyBvZiB2YXJpYWJsZSBuYW1lIHRvIHRoZSBib3VuZCBuYW1lLlxuICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBmbiBUaGUgZnVuY3Rpb24gdG8gcnVuLiBUaGUgZnVuY3Rpb24gd2lsbCBoYXZlIG9uZSBhcmd1bWVudCwgY29udGFpbmluZ1xuICAgKiAgICBib3VuZCBwcm9wZXJ0aWVzLiBFYWNoIHByb3BlcnR5IGlzIG5hbWVkIGZvbGxvd2luZyB0aGV5IGtleXMgc3BlY2lmaWVkIGluIHRoZSBga2V5c2BcbiAgICogICAgYXR0cmlidXRlLlxuICAgKiBAcmV0dXJuIHtESS5TY29wZX0gVGhlIG5ld2x5IGNyZWF0ZWQgY2hpbGQgc2NvcGUuXG4gICAqL1xuICB3aXRoKGtleSwgZm4pIHtcbiAgICBsZXQgY2hpbGRTY29wZSA9IG5ldyBTY29wZSh0aGlzLCB0aGlzW19fcHJlZml4X19dKTtcbiAgICBjaGlsZFNjb3BlW19fbG9jYWxCaW5kaW5nc19fXVxuICAgICAgICAuYWRkKGFwcGVuZCh0aGlzW19fcHJlZml4X19dLCBrZXkpLCB0aGlzW19fY3JlYXRlUHJvdmlkZXJfX10oZm4sIGtleSkpO1xuICAgIHJldHVybiBjaGlsZFNjb3BlO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYSBuZXcgY2hpbGQgc2NvcGUgd2l0aCB0aGUgZ2l2ZW4gdmFsdWUgYm91bmQgdG8gdGhlIGdpdmVuIGtleSBpbiBpdHMgbG9jYWwgYmluZGluZy5cbiAgICogVGhpcyBpcyBzaW1pbGFyIHRvIHt7I2Nyb3NzTGluayBcIkRJLlNjb3BlL3dpdGhcIn19e3svY3Jvc3NMaW5rfX0sIGJ1dCB0aGUgdmFsdWUgaXMgYSBjb25zdGFudC5cbiAgICpcbiAgICogQG1ldGhvZCBjb25zdGFudFxuICAgKiBAcGFyYW0ge3N0cmluZ30ga2V5IFRoZSBrZXkgdG8gYm91bmQgdGhlIHZhbHVlIHRvLlxuICAgKiBAcGFyYW0ge09iamVjdH0gdmFsdWUgVGhlIG9iamVjdCB0byBiaW5kIHRvIHRoZSBnaXZlbiBrZXkuXG4gICAqIEByZXR1cm4ge0RJLlNjb3BlfSBUaGUgbmV3bHkgY3JlYXRlZCBjaGlsZCBzY29wZS5cbiAgICovXG4gIGNvbnN0YW50KGtleSwgdmFsdWUpIHtcbiAgICByZXR1cm4gdGhpcy53aXRoKGtleSwgKCkgPT4gdmFsdWUpO1xuICB9XG5cbiAgLyoqXG4gICAqIEdsb2JhbGx5IGJpbmRzIHRoZSBnaXZlbiB2YWx1ZSB0byB0aGUgZ2l2ZW4ga2V5LlxuICAgKlxuICAgKiBAbWV0aG9kIGJpbmRcbiAgICogQHBhcmFtIHtzdHJpbmd9IGtleSBUaGUga2V5IHRvIGJvdW5kIHRoZSB2YWx1ZSB0by5cbiAgICogQHBhcmFtIHtPYmplY3R9IGtleXMgT2JqZWN0IHdpdGggbWFwcGluZyBvZiB2YXJpYWJsZSBuYW1lIHRvIHRoZSBib3VuZCBuYW1lLlxuICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBmbiBUaGUgZnVuY3Rpb24gdG8gcnVuLiBUaGUgZnVuY3Rpb24gd2lsbCBoYXZlIG9uZSBhcmd1bWVudCwgY29udGFpbmluZ1xuICAgKiAgICBib3VuZCBwcm9wZXJ0aWVzLiBFYWNoIHByb3BlcnR5IGlzIG5hbWVkIGZvbGxvd2luZyB0aGV5IGtleXMgc3BlY2lmaWVkIGluIHRoZSBga2V5c2BcbiAgICogICAgYXR0cmlidXRlLlxuICAgKi9cbiAgYmluZChrZXksIGZuKSB7XG4gICAgR2xvYmFscy5iaW5kaW5ncy5hZGQoYXBwZW5kKHRoaXNbX19wcmVmaXhfX10sIGtleSksIHRoaXNbX19jcmVhdGVQcm92aWRlcl9fXShmbiwga2V5KSk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyB0aGUgcHJvdmlkZXIgYm91bmQgdG8gdGhlIGdpdmVuIGtleSBhbmQgcmVzb2x2ZSBpdCBpbiB0aGlzIHNjb3BlLiBUaGlzIHdpbGwgZmlyc3QgY2hlY2tcbiAgICogZm9yIHRoZSBsb2NhbCBiaW5kaW5ncywgdGhlbiBpdHMgYW5jZXN0b3JzLiBJZiBubyBiaW5kaW5nIGlzIGZvdW5kIGluIHRoZSBhbmNlc3RyYWwgcGF0aCwgdGhpc1xuICAgKiB3aWxsIGNoZWNrIGZvciB0aGUgZ2xvYmFsIGJpbmRpbmdzLlxuICAgKlxuICAgKiBAbWV0aG9kIGdldFxuICAgKiBAcGFyYW0ge3N0cmluZ30ga2V5IEtleSB3aG9zZSBib3VuZCB2YWx1ZSBzaG91bGQgYmUgcmV0dXJuZWQuXG4gICAqIEByZXR1cm4ge2FueX0gVGhlIHZhbHVlIGJvdW5kIHRvIHRoZSBnaXZlbiBrZXksIG9yIHVuZGVmaW5lZCBpZiBubyB2YWx1ZXMgY2FuIGJlIGZvdW5kLlxuICAgKi9cbiAgZ2V0KGtleSkge1xuICAgIGxldCB2YWx1ZSA9IHRoaXNbX19nZXRfX10oYXBwZW5kKHRoaXNbX19wcmVmaXhfX10sIGtleSkpO1xuICAgIGlmICh2YWx1ZSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICByZXR1cm4gR2xvYmFscy5nZXRHbG9iYWwoa2V5LCB0aGlzKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIHZhbHVlO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBSdW5zIHRoZSBnaXZlbiBmdW5jdGlvbiBhZnRlciBpbmplY3RpbmcgYW55IGRlcGVuZGVuY2llcy5cbiAgICpcbiAgICogQG1ldGhvZCBydW5cbiAgICogQHBhcmFtIHtGdW5jdGlvbn0gZm4gVGhlIGZ1bmN0aW9uIHRvIHJ1bi4gVGhlIGZ1bmN0aW9uJ3MgYXJndW1lbnRzIHdpbGwgYmUgYm91bmQgYmFzZWQgb25cbiAgICogICAgdGhlaXIgbmFtZXMuXG4gICAqL1xuICBydW4oZm4pIHtcbiAgICB0aGlzW19fY3JlYXRlUHJvdmlkZXJfX10oZm4pLnJlc29sdmUodGhpcyk7XG4gIH1cblxuICAvKipcbiAgICogUHJlZml4IGFueSBrZXlzIGdpdmVuIHRvIHRoaXMgc2NvcGUgd2l0aCB0aGUgZ2l2ZW4gcHJlZml4LlxuICAgKlxuICAgKiBAbWV0aG9kIHByZWZpeFxuICAgKiBAcGFyYW0ge3N0cmluZ30gcHJlZml4IFRoZSBwcmVmaXggdG8gYWRkLlxuICAgKiBAcmV0dXJuIHtESS5TY29wZX0gVGhlIG5ld2x5IGNyZWF0ZWQgY2hpbGQgc2NvcGUgd2l0aCB0aGUgZ2l2ZW4gcHJlZml4LlxuICAgKi9cbiAgcHJlZml4KHByZWZpeCkge1xuICAgIHJldHVybiBuZXcgU2NvcGUodGhpcywgYXBwZW5kKHByZWZpeCwgdGhpc1tfX3ByZWZpeF9fXSkpO1xuICB9XG59XG5cbmZ1bmN0aW9uIGFwcGVuZChsLCByKSB7XG4gIHJldHVybiBbbCwgcl0uZmlsdGVyKGkgPT4gISFpKS5qb2luKCcuJyk7XG59XG5cbmV4cG9ydCBkZWZhdWx0IFNjb3BlO1xuIl19
