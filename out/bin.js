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

(function (window) {
  window.DI = new Scope();

  window.DI.BindingTree = BindingTree;
  window.DI.Provider = Provider;
  window.DI.Scope = Scope;
  window.DI.bindings = Globals.bindings;
})(window);

},{"./bindingtree":1,"./globals":2,"./provider":4,"./scope":5}],4:[function(require,module,exports){
"use strict";

var _interopRequire = function (obj) { return obj && obj.__esModule ? obj["default"] : obj; };

var _createClass = (function () { function defineProperties(target, props) { for (var key in props) { var prop = props[key]; prop.configurable = true; if (prop.value) prop.writable = true; } Object.defineProperties(target, props); } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };

var Globals = _interopRequire(require("./globals"));

var __get__ = Globals.get;

// Private symbols.
var __function__ = Symbol();
var __localScope__ = Symbol("localScope");
var __name__ = Symbol();
var __prefix__ = Symbol("prefix");
var __keys__ = Symbol();
var __resolvedValues__ = Symbol();

var FN_ARGS = /^function\s*[^\(]*\(\s*([^\)]*)\)/m;

var Provider = (function () {

  /**
   * @class DI.Provider
   * @constructor
   * @param {Function} fn The function whose arguments should be resolved. The names will be used as
   *    the key.
   * @param {Array} keys Array of keys for the given function's argument's names.
   * @param {string} prefix The prefix to use for the keys.
   * @param {DI.Scope} localScope The local scope. This will be prioritized when checking for bound
   *    values.
   * @param {string} [name=null] Reference name of the provider. This is used for detecting cyclic
   *    dependencies.
   */

  function Provider(fn, keys, prefix, localScope) {
    var name = arguments[4] === undefined ? null : arguments[4];

    _classCallCheck(this, Provider);

    this[__function__] = fn;
    this[__keys__] = keys;
    this[__localScope__] = localScope;
    this[__name__] = name;
    this[__resolvedValues__] = new Map();
  }

  _createClass(Provider, {
    resolve: {

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
            var argsString = _this[__function__].toString().match(FN_ARGS)[1];
            var args = argsString ? argsString.split(",") : [];

            var resolvedArgs = _this[__keys__].map(function (key, i) {

              // Check if the key is optional.
              var optional = key[key.length - 1] === "?";
              if (optional) {
                key = key.substring(0, key.length - 1);
              }

              // Check if the key is root key.
              var isRoot = key[0] === "/";
              if (isRoot) {
                key = key.substring(1);
              }

              // Now replace any = in the key with the argument name.
              key = key.replace("=", args[i] ? args[i].trim() : "");

              // TODO(gs): Handle cyclic dependency.
              var value = undefined;

              try {
                // Check the local scope first.
                value = _this[__localScope__][__get__](key, scope);

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
                if (_this[__name__]) {
                  throw "" + e + "\n\twhile providing " + _this[__name__];
                } else {
                  throw "" + e + "\n\twhile running expression";
                }
              }

              if (value === undefined) {
                if (optional) {
                  return undefined;
                } else if (_this[__name__]) {
                  throw "Cannot find " + key + " while providing " + _this[__name__];
                } else {
                  throw "Cannot find " + key + " while running expression";
                }
              }

              return value;
            });

            var value = undefined;

            try {
              value = _this[__function__].apply(null, resolvedArgs);
            } catch (e) {
              if (_this[__name__]) {
                throw "Uncaught exception " + e + "\n\twhile running provider " + _this[__name__];
              } else {
                throw "Uncaught exception " + e + "\n\twhile running expression";
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
    }
  });

  return Provider;
})();

module.exports = Provider;

},{"./globals":2}],5:[function(require,module,exports){
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
var bindings = Globals.bindings;

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
    value: function (value) {
      var name = arguments[1] === undefined ? null : arguments[1];

      var fn = value.splice(value.length - 1)[0];
      return new Provider(fn, value, this[__prefix__], this, name);
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
     * @param {Function} fn The function to run. The function's arguments will be bound based on
     *    their names.
     * @return {DI.Scope} The newly created child scope.
     */
    value: function _with(key, value) {
      var childScope = new Scope(this, this[__prefix__]);
      childScope[__localBindings__].add(append(this[__prefix__], key), this[__createProvider__](value, key));
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
      return this["with"](key, [function () {
        return value;
      }]);
    }
  }, {
    key: "bind",

    /**
     * Globally binds the given value to the given key.
     *
     * @method bind
     * @param {string} key The key to bound the value to.
     * @param {Function} fn The function to run. The function's arguments will be bound based on
     *    their names.
     */
    value: function bind(key, value) {
      bindings.add(append(this[__prefix__], key), this[__createProvider__](value, key));
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

},{"./bindingtree":1,"./globals":2,"./provider":4}]},{},[3])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIvVXNlcnMvZ3NvZWQvcHJvai9kaS9zcmMvYmluZGluZ3RyZWUuanMiLCIvVXNlcnMvZ3NvZWQvcHJvai9kaS9zcmMvZ2xvYmFscy5qcyIsIi9Vc2Vycy9nc29lZC9wcm9qL2RpL3NyYy9pbmRleC5qcyIsIi9Vc2Vycy9nc29lZC9wcm9qL2RpL3NyYy9wcm92aWRlci5qcyIsIi9Vc2Vycy9nc29lZC9wcm9qL2RpL3NyYy9zY29wZS5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7Ozs7QUNDQSxJQUFNLFVBQVUsR0FBRyxNQUFNLENBQUMsUUFBUSxDQUFDLENBQUM7O0FBRXBDLElBQU0sU0FBUyxHQUFHLEdBQUcsQ0FBQzs7SUFFaEIsV0FBVzs7Ozs7Ozs7QUFPSixXQVBQLFdBQVcsR0FPRDswQkFQVixXQUFXOztBQVFiLFFBQUksQ0FBQyxVQUFVLENBQUMsR0FBRyxJQUFJLEdBQUcsRUFBRSxDQUFDO0dBQzlCOztlQVRHLFdBQVc7QUFxQmYsT0FBRzs7Ozs7Ozs7Ozs7OzthQUFBLGFBQUMsR0FBRyxFQUFFLEtBQUssRUFBYTtZQUFYLEtBQUssZ0NBQUcsQ0FBQzs7O0FBRXZCLFlBQUksUUFBUSxHQUFHLEdBQUcsQ0FBQyxLQUFLLENBQUMsU0FBUyxDQUFDLENBQUM7QUFDcEMsWUFBSSxVQUFVLEdBQUcsUUFBUSxDQUFDLFFBQVEsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxHQUFHLEtBQUssQ0FBQyxDQUFDOztBQUV2RCxZQUFJLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxVQUFVLENBQUMsRUFBRTtBQUNyQyxjQUFJLENBQUMsVUFBVSxDQUFDLENBQUMsR0FBRyxDQUFDLFVBQVUsRUFBRTtBQUMvQixlQUFHLEVBQUUsR0FBRztBQUNSLGlCQUFLLEVBQUUsS0FBSztXQUNiLENBQUMsQ0FBQztTQUNKLE1B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Q0FBQyxDQUFDO0FBQ2xGLGFBQU8sSUFBSSxDQUFDO0tBQ2I7Ozs7Ozs7Ozs7Ozs7V0FXRSxhQUFDLEdBQUcsRUFBRTtBQUNQLFVBQUksS0FBSyxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxDQUFDLENBQUM7QUFDekQsVUFBSSxLQUFLLEtBQUssU0FBUyxFQUFFO0FBQ3ZCLGVBQU8sT0FBTyxDQUFDLFNBQVMsQ0FBQyxHQUFHLEVBQUUsSUFBSSxDQUFDLENBQUM7T0FDckMsTUFBTTtBQUNMLGVBQU8sS0FBSyxDQUFDO09BQ2Q7S0FDRjs7Ozs7Ozs7Ozs7V0FTRSxhQUFDLEVBQUUsRUFBRTtBQUNOLFVBQUksQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQztLQUM1Qzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O09BU0ssVUFBQyxNQUFNLEVBQUU7QUFDYixhQUFPLElBQUksS0FBSyxDQUFDLElBQUksRUFBRSxNQUFNLENBQUMsTUFBTSxFQUFFLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUM7S0FDMUQ7OztTQWhIRyxLQUFLOzs7QUFtSFgsU0FBUyxNQUFNLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRTtBQUNwQixTQUFPLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxVQUFBLENBQUM7V0FBSSxDQUFDLENBQUMsQ0FBQztHQUFBLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7Q0FDMUM7O2lCQUVjLEtBQUsiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiLy8gUHJpdmF0ZSBzeW1ib2xzLlxuY29uc3QgX192YWx1ZXNfXyA9IFN5bWJvbCgndmFsdWVzJyk7XG5cbmNvbnN0IFNFUEFSQVRPUiA9ICdfJztcblxuY2xhc3MgQmluZGluZ1RyZWUge1xuXG4gIC8qKlxuICAgKiBSZXByZXNlbnRzIGEgdHJlZSBvZiBib3VuZCB2YWx1ZXMga2V5ZWQgYnkgYmluZGluZyBrZXkuXG4gICAqIEBjbGFzcyBESS5CaW5kaW5nVHJlZVxuICAgKiBAY29uc3RydWN0b3JcbiAgICovXG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHRoaXNbX192YWx1ZXNfX10gPSBuZXcgTWFwKCk7XG4gIH1cblxuICAvKipcbiAgICogQWRkcyB0aGUgZ2l2ZW4ga2V5IGFuZCB2YWx1ZSB0byB0aGUgdHJlZS4gVGhlIHRyZWUgd2lsbCB0cnkgdG8gYmluZCB1c2luZyB0aGUgbGFzdCBzZWdtZW50IG9mXG4gICAqIHRoZSBrZXkuIElmIHRoaXMgY2F1c2VzIGEgY29uZmxpY3QsIGl0IHdpbGwgY3JlYXRlIGEgc3VidHJlZS5cbiAgICpcbiAgICogQG1ldGhvZCBhZGRcbiAgICogQHBhcmFtIHtzdHJpbmd9IGtleSBUaGUga2V5IHRvIGJpbmQgdGhlIHZhbHVlIHRvLlxuICAgKiBAcGFyYW0ge09iamVjdH0gdmFsdWUgVGhlIHZhbHVlIHRvIGJlIGJvdW5kLlxuICAgKiBAcGFyYW0ge251bWJlcn0gW2RlcHRoPTBdIFRoZSBkZXB0aCBvZiB0aGUga2V5IHRvIHVzZSBhcyBiaW5kaW5nIGtleS4gVGhpcyBzaG91bGQgbm90IGJlXG4gICAqICAgIGNhbGxlZCBmcm9tIG91dHNpZGUgdGhlIGNsYXNzLlxuICAgKi9cbiAgYWRkKGtleSwgdmFsdWUsIGRlcHRoID0gMCkge1xuICAgIC8vIFRPRE8oZ3MpOiBSZW1vdmUgdGhlIHNlcGFyYXRvclxuICAgIGxldCBzZWdtZW50cyA9IGtleS5zcGxpdChTRVBBUkFUT1IpO1xuICAgIGxldCBiaW5kaW5nS2V5ID0gc2VnbWVudHNbc2VnbWVudHMubGVuZ3RoIC0gMSAtIGRlcHRoXTtcblxuICAgIGlmICghdGhpc1tfX3ZhbHVlc19fXS5oYXMoYmluZGluZ0tleSkpIHtcbiAgICAgIHRoaXNbX192YWx1ZXNfX10uc2V0KGJpbmRpbmdLZXksIHtcbiAgICAgICAga2V5OiBrZXksXG4gICAgICAgIHZhbHVlOiB2YWx1ZVxuICAgICAgfSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIFRoZXJlIGlzIGFscmVhZHkgYSB2YWx1ZSBjb3JyZXNwb25kaW5nIHRvIHRoaXMga2V5XG4gICAgICBsZXQgZXhpc3RpbmdWYWx1ZSA9IHRoaXNbX192YWx1ZXNfX10uZ2V0KGJpbmRpbmdLZXkpO1xuICAgICAgaWYgKGV4aXN0aW5nVmFsdWUua2V5ID09PSBrZXkpIHtcbiAgICAgICAgdGhyb3cgYEtleSAke2tleX0gaXMgYWxyZWFkeSBib3VuZGA7XG4gICAgICB9XG5cbiAgICAgIGxldCBuZXdUcmVlID0gbmV3IEJpbmRpbmdUcmVlKCk7XG4gICAgICB0aGlzW19fdmFsdWVzX19dLnNldChiaW5kaW5nS2V5LCBuZXdUcmVlKTtcbiAgICAgIG5ld1RyZWUuYWRkKGV4aXN0aW5nVmFsdWUua2V5LCBleGlzdGluZ1ZhbHVlLnZhbHVlLCBkZXB0aCArIDEpO1xuICAgICAgbmV3VHJlZS5hZGQoa2V5LCB2YWx1ZSwgZGVwdGggKyAxKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyB0aGUgdmFsdWUgY29ycmVzcG9uZGluZyB0byB0aGUgZ2l2ZW4ga2V5LlxuICAgKlxuICAgKiBAcGFyYW0ge3N0cmluZ30ga2V5IEtleSBvZiB0aGUgdmFsdWUgdG8gcmV0dXJuLlxuICAgKiBAcGFyYW0ge251bWJlcn0gW2RlcHRoPTBdIFRoZSBkZXB0aCBvZiB0aGUga2V5IHRvIHVzZSBhcyBiaW5kaW5nIGtleS4gVGhpcyBzaG91bGQgbm90IGJlXG4gICAqICAgIGNhbGxlZCBmcm9tIG91dHNpZGUgdGhlIGNsYXNzLlxuICAgKiBAcmV0dXJuIHthbnl9IFRoZSBib3VuZCB2YWx1ZSwgb3IgdW5kZWZpbmVkIGlmIHRoZSB2YWx1ZSBjYW5ub3QgYmUgZm91bmQsIG9yIGlmIHRoZSBrZXkgaGFzXG4gICAqICAgIGNvbGxpc2lvbiBidXQgY29sbGlzaW9uIGNhbm5vdCBiZSByZXNvbHZlZC5cbiAgICovXG4gIGdldChrZXksIGRlcHRoID0gMCkge1xuICAgIGxldCBzZWdtZW50cyA9IGtleS5zcGxpdChTRVBBUkFUT1IpO1xuICAgIGxldCBiaW5kaW5nS2V5ID0gc2VnbWVudHNbc2VnbWVudHMubGVuZ3RoIC0gMSAtIGRlcHRoXTtcblxuICAgIGlmIChiaW5kaW5nS2V5ID09PSB1bmRlZmluZWQpIHtcbiAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgfVxuXG4gICAgaWYgKCF0aGlzW19fdmFsdWVzX19dLmhhcyhiaW5kaW5nS2V5KSkge1xuICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICB9XG5cbiAgICBsZXQgdmFsdWUgPSB0aGlzW19fdmFsdWVzX19dLmdldChiaW5kaW5nS2V5KTtcbiAgICBpZiAodmFsdWUgaW5zdGFuY2VvZiBCaW5kaW5nVHJlZSkge1xuICAgICAgcmV0dXJuIHZhbHVlLmdldChrZXksIGRlcHRoICsgMSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiB2YWx1ZS52YWx1ZTtcbiAgICB9XG4gIH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgQmluZGluZ1RyZWU7IiwiaW1wb3J0IEJpbmRpbmdUcmVlIGZyb20gJy4vYmluZGluZ3RyZWUnO1xuXG5jb25zdCBHbG9iYWxzID0ge1xuICBnZXQ6IFN5bWJvbCgnZ2V0JyksXG5cbiAgZ2V0R2xvYmFsKGtleSwgc2NvcGUpIHtcbiAgICBsZXQgZ2xvYmFsUHJvdmlkZXIgPSB0aGlzLmJpbmRpbmdzLmdldChrZXkpO1xuICAgIGlmIChnbG9iYWxQcm92aWRlciA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gZ2xvYmFsUHJvdmlkZXIucmVzb2x2ZShzY29wZSk7XG4gICAgfVxuICB9LFxuXG4gIGJpbmRpbmdzOiBuZXcgQmluZGluZ1RyZWUoKVxufTtcblxuZXhwb3J0IGRlZmF1bHQgR2xvYmFsczsiLCJpbXBvcnQgQmluZGluZ1RyZWUgZnJvbSAnLi9iaW5kaW5ndHJlZSc7XG5pbXBvcnQgR2xvYmFscyBmcm9tICcuL2dsb2JhbHMnO1xuaW1wb3J0IFByb3ZpZGVyIGZyb20gJy4vcHJvdmlkZXInO1xuaW1wb3J0IFNjb3BlIGZyb20gJy4vc2NvcGUnO1xuXG4oKHdpbmRvdykgPT4ge1xuICB3aW5kb3dbJ0RJJ10gPSBuZXcgU2NvcGUoKTtcblxuICB3aW5kb3dbJ0RJJ11bJ0JpbmRpbmdUcmVlJ10gPSBCaW5kaW5nVHJlZTtcbiAgd2luZG93WydESSddWydQcm92aWRlciddID0gUHJvdmlkZXI7XG4gIHdpbmRvd1snREknXVsnU2NvcGUnXSA9IFNjb3BlO1xuICB3aW5kb3dbJ0RJJ11bJ2JpbmRpbmdzJ10gPSBHbG9iYWxzLmJpbmRpbmdzO1xufSkod2luZG93KTsiLCJpbXBvcnQgR2xvYmFscyBmcm9tICcuL2dsb2JhbHMnO1xuXG5jb25zdCBfX2dldF9fID0gR2xvYmFscy5nZXQ7XG5cbi8vIFByaXZhdGUgc3ltYm9scy5cbmNvbnN0IF9fZnVuY3Rpb25fXyA9IFN5bWJvbCgpO1xuY29uc3QgX19sb2NhbFNjb3BlX18gPSBTeW1ib2woJ2xvY2FsU2NvcGUnKTtcbmNvbnN0IF9fbmFtZV9fID0gU3ltYm9sKCk7XG5jb25zdCBfX3ByZWZpeF9fID0gU3ltYm9sKCdwcmVmaXgnKTtcbmNvbnN0IF9fa2V5c19fID0gU3ltYm9sKCk7XG5jb25zdCBfX3Jlc29sdmVkVmFsdWVzX18gPSBTeW1ib2woKTtcblxuY29uc3QgRk5fQVJHUyA9IC9eZnVuY3Rpb25cXHMqW15cXChdKlxcKFxccyooW15cXCldKilcXCkvbTtcblxuY2xhc3MgUHJvdmlkZXIge1xuXG4gIC8qKlxuICAgKiBAY2xhc3MgREkuUHJvdmlkZXJcbiAgICogQGNvbnN0cnVjdG9yXG4gICAqIEBwYXJhbSB7RnVuY3Rpb259IGZuIFRoZSBmdW5jdGlvbiB3aG9zZSBhcmd1bWVudHMgc2hvdWxkIGJlIHJlc29sdmVkLiBUaGUgbmFtZXMgd2lsbCBiZSB1c2VkIGFzXG4gICAqICAgIHRoZSBrZXkuXG4gICAqIEBwYXJhbSB7QXJyYXl9IGtleXMgQXJyYXkgb2Yga2V5cyBmb3IgdGhlIGdpdmVuIGZ1bmN0aW9uJ3MgYXJndW1lbnQncyBuYW1lcy5cbiAgICogQHBhcmFtIHtzdHJpbmd9IHByZWZpeCBUaGUgcHJlZml4IHRvIHVzZSBmb3IgdGhlIGtleXMuXG4gICAqIEBwYXJhbSB7REkuU2NvcGV9IGxvY2FsU2NvcGUgVGhlIGxvY2FsIHNjb3BlLiBUaGlzIHdpbGwgYmUgcHJpb3JpdGl6ZWQgd2hlbiBjaGVja2luZyBmb3IgYm91bmRcbiAgICogICAgdmFsdWVzLlxuICAgKiBAcGFyYW0ge3N0cmluZ30gW25hbWU9bnVsbF0gUmVmZXJlbmNlIG5hbWUgb2YgdGhlIHByb3ZpZGVyLiBUaGlzIGlzIHVzZWQgZm9yIGRldGVjdGluZyBjeWNsaWNcbiAgICogICAgZGVwZW5kZW5jaWVzLlxuICAgKi9cbiAgY29uc3RydWN0b3IoZm4sIGtleXMsIHByZWZpeCwgbG9jYWxTY29wZSwgbmFtZSA9IG51bGwpIHtcbiAgICB0aGlzW19fZnVuY3Rpb25fX10gPSBmbjtcbiAgICB0aGlzW19fa2V5c19fXSA9IGtleXM7XG4gICAgdGhpc1tfX2xvY2FsU2NvcGVfX10gPSBsb2NhbFNjb3BlO1xuICAgIHRoaXNbX19uYW1lX19dID0gbmFtZTtcbiAgICB0aGlzW19fcmVzb2x2ZWRWYWx1ZXNfX10gPSBuZXcgTWFwKCk7XG4gIH1cblxuICAvKipcbiAgICogUmVzb2x2ZXMgdGhlIHByb3ZpZGVyLiBSZXNvbHZlZCB2YWx1ZXMgYXJlIGNhY2hlZCBwZXIgc2NvcGUuXG4gICAqXG4gICAqIEBtZXRob2QgcmVzb2x2ZVxuICAgKiBAcGFyYW0ge0RJLlNjb3BlfSBzY29wZSBUaGUgc2NvcGUgdG8gcmVzb2x2ZSB0aGUgdmFsdWUgaW4uXG4gICAqIEByZXR1cm4ge09iamVjdH0gVGhlIHJlc29sdmVkIHZhbHVlIGZvciB0aGUgZ2l2ZW4gc2NvcGUuXG4gICAqL1xuICByZXNvbHZlKHNjb3BlKSB7XG4gICAgaWYgKCF0aGlzW19fcmVzb2x2ZWRWYWx1ZXNfX10uaGFzKHNjb3BlKSkge1xuICAgICAgbGV0IGFyZ3NTdHJpbmcgPSB0aGlzW19fZnVuY3Rpb25fX10udG9TdHJpbmcoKS5tYXRjaChGTl9BUkdTKVsxXTtcbiAgICAgIGxldCBhcmdzID0gYXJnc1N0cmluZyA/IGFyZ3NTdHJpbmcuc3BsaXQoJywnKSA6IFtdO1xuXG4gICAgICBsZXQgcmVzb2x2ZWRBcmdzID0gdGhpc1tfX2tleXNfX10ubWFwKChrZXksIGkpID0+IHtcblxuICAgICAgICAvLyBDaGVjayBpZiB0aGUga2V5IGlzIG9wdGlvbmFsLlxuICAgICAgICBsZXQgb3B0aW9uYWwgPSBrZXlba2V5Lmxlbmd0aCAtIDFdID09PSAnPyc7XG4gICAgICAgIGlmIChvcHRpb25hbCkge1xuICAgICAgICAgIGtleSA9IGtleS5zdWJzdHJpbmcoMCwga2V5Lmxlbmd0aCAtIDEpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gQ2hlY2sgaWYgdGhlIGtleSBpcyByb290IGtleS5cbiAgICAgICAgbGV0IGlzUm9vdCA9IGtleVswXSA9PT0gJy8nO1xuICAgICAgICBpZiAoaXNSb290KSB7XG4gICAgICAgICAga2V5ID0ga2V5LnN1YnN0cmluZygxKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIE5vdyByZXBsYWNlIGFueSA9IGluIHRoZSBrZXkgd2l0aCB0aGUgYXJndW1lbnQgbmFtZS5cbiAgICAgICAga2V5ID0ga2V5LnJlcGxhY2UoJz0nLCBhcmdzW2ldID8gYXJnc1tpXS50cmltKCkgOiAnJyk7XG5cbiAgICAgICAgLy8gVE9ETyhncyk6IEhhbmRsZSBjeWNsaWMgZGVwZW5kZW5jeS5cbiAgICAgICAgbGV0IHZhbHVlO1xuXG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgLy8gQ2hlY2sgdGhlIGxvY2FsIHNjb3BlIGZpcnN0LlxuICAgICAgICAgIHZhbHVlID0gdGhpc1tfX2xvY2FsU2NvcGVfX11bX19nZXRfX10oa2V5LCBzY29wZSk7XG5cbiAgICAgICAgICBpZiAodmFsdWUgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgLy8gSWYgdmFsdWUgY2Fubm90IGJlIHJlc29sdmVkIGluIHRoZSBsb2NhbCBzY29wZSwgY2hlY2sgdGhlIGdpdmVuIHNjb3BlLlxuICAgICAgICAgICAgdmFsdWUgPSBzY29wZVtfX2dldF9fXShrZXksIHNjb3BlKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBpZiAodmFsdWUgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgLy8gSWYgdmFsdWUgY2Fubm90IGJlIHJlc29sdmVkIGluIHRoZSBsb2NhbCBzY29wZSwgY2hlY2sgdGhlIGdsb2JhbCBiaW5kaW5ncy5cbiAgICAgICAgICAgIHZhbHVlID0gR2xvYmFscy5nZXRHbG9iYWwoa2V5LCBzY29wZSk7XG4gICAgICAgICAgfVxuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgLy8gVE9ETyhncyk6IE1ha2UgYSBzaGFyZWQgbWV0aG9kLlxuICAgICAgICAgIGlmICh0aGlzW19fbmFtZV9fXSkge1xuICAgICAgICAgICAgdGhyb3cgYCR7ZX1cXG5cXHR3aGlsZSBwcm92aWRpbmcgJHt0aGlzW19fbmFtZV9fXX1gO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aHJvdyBgJHtlfVxcblxcdHdoaWxlIHJ1bm5pbmcgZXhwcmVzc2lvbmA7XG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHZhbHVlID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICBpZiAob3B0aW9uYWwpIHtcbiAgICAgICAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgICAgICAgfSBlbHNlIGlmICh0aGlzW19fbmFtZV9fXSkge1xuICAgICAgICAgICAgdGhyb3cgYENhbm5vdCBmaW5kICR7a2V5fSB3aGlsZSBwcm92aWRpbmcgJHt0aGlzW19fbmFtZV9fXX1gO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aHJvdyBgQ2Fubm90IGZpbmQgJHtrZXl9IHdoaWxlIHJ1bm5pbmcgZXhwcmVzc2lvbmA7XG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHZhbHVlO1xuICAgICAgfSk7XG5cbiAgICAgIGxldCB2YWx1ZTtcblxuICAgICAgdHJ5IHtcbiAgICAgICAgdmFsdWUgPSB0aGlzW19fZnVuY3Rpb25fX10uYXBwbHkobnVsbCwgcmVzb2x2ZWRBcmdzKTtcbiAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgaWYgKHRoaXNbX19uYW1lX19dKSB7XG4gICAgICAgICAgdGhyb3cgYFVuY2F1Z2h0IGV4Y2VwdGlvbiAke2V9XFxuXFx0d2hpbGUgcnVubmluZyBwcm92aWRlciAke3RoaXNbX19uYW1lX19dfWA7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdGhyb3cgYFVuY2F1Z2h0IGV4Y2VwdGlvbiAke2V9XFxuXFx0d2hpbGUgcnVubmluZyBleHByZXNzaW9uYDtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBpZiAodmFsdWUgPT09IHVuZGVmaW5lZCAmJiB0aGlzW19fbmFtZV9fXSkge1xuICAgICAgICBjb25zb2xlLndhcm4oYFZhbHVlIG9mICR7dGhpc1tfX25hbWVfX119IGlzIHVuZGVmaW5lZGApO1xuICAgICAgfVxuXG4gICAgICB0aGlzW19fcmVzb2x2ZWRWYWx1ZXNfX10uc2V0KHNjb3BlLCB2YWx1ZSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXNbX19yZXNvbHZlZFZhbHVlc19fXS5nZXQoc2NvcGUpO1xuICB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IFByb3ZpZGVyOyIsImltcG9ydCBCaW5kaW5nVHJlZSBmcm9tICcuL2JpbmRpbmd0cmVlJztcbmltcG9ydCBQcm92aWRlciBmcm9tICcuL3Byb3ZpZGVyJztcbmltcG9ydCBHbG9iYWxzIGZyb20gJy4vZ2xvYmFscyc7XG5cblxuLy8gUHJpdmF0ZSBzeW1ib2xzLlxuY29uc3QgX19sb2NhbEJpbmRpbmdzX18gPSBTeW1ib2woJ2xvY2FsQmluZGluZ3MnKTtcbmNvbnN0IF9fcGFyZW50U2NvcGVfXyA9IFN5bWJvbCgncGFyZW50U2NvcGUnKTtcbmNvbnN0IF9fcHJlZml4X18gPSBTeW1ib2woJ3ByZWZpeCcpO1xuXG5jb25zdCBfX2NyZWF0ZVByb3ZpZGVyX18gPSBTeW1ib2woKTtcblxuY29uc3QgX19nZXRfXyA9IEdsb2JhbHMuZ2V0O1xuY29uc3QgYmluZGluZ3MgPSBHbG9iYWxzLmJpbmRpbmdzO1xuXG5jbGFzcyBTY29wZSB7XG4gIC8qKlxuICAgKiBTY29wZSBjb250YWluaW5nIGxvY2FsIGJpbmRpbmdzLlxuICAgKlxuICAgKiBAY2xhc3MgREkuU2NvcGVcbiAgICogQGNvbnN0cnVjdG9yXG4gICAqIEBwYXJhbSB7REkuU2NvcGV9IFtwYXJlbnRTY29wZT1udWxsXSBUaGUgcGFyZW50IHNjb3BlLlxuICAgKi9cbiAgY29uc3RydWN0b3IocGFyZW50U2NvcGUgPSBudWxsLCBwcmVmaXggPSAnJykge1xuICAgIHRoaXNbX19sb2NhbEJpbmRpbmdzX19dID0gbmV3IEJpbmRpbmdUcmVlKCk7XG4gICAgdGhpc1tfX3BhcmVudFNjb3BlX19dID0gcGFyZW50U2NvcGU7XG4gICAgdGhpc1tfX3ByZWZpeF9fXSA9IHByZWZpeDtcbiAgfVxuXG4gIFtfX2NyZWF0ZVByb3ZpZGVyX19dKHZhbHVlLCBuYW1lID0gbnVsbCkge1xuICAgIGxldCBmbiA9IHZhbHVlLnNwbGljZSh2YWx1ZS5sZW5ndGggLSAxKVswXTtcbiAgICByZXR1cm4gbmV3IFByb3ZpZGVyKGZuLCB2YWx1ZSwgdGhpc1tfX3ByZWZpeF9fXSwgdGhpcywgbmFtZSk7XG4gIH1cblxuICBbX19nZXRfX10oa2V5LCBzY29wZSkge1xuICAgIGxldCBwcm92aWRlciA9IHRoaXNbX19sb2NhbEJpbmRpbmdzX19dLmdldChrZXkpO1xuICAgIGlmIChwcm92aWRlciA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICBpZiAodGhpc1tfX3BhcmVudFNjb3BlX19dKSB7XG4gICAgICAgIHJldHVybiB0aGlzW19fcGFyZW50U2NvcGVfX11bX19nZXRfX10oa2V5LCBzY29wZSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gcHJvdmlkZXIucmVzb2x2ZShzY29wZSk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYSBuZXcgY2hpbGQgc2NvcGUgd2l0aCB0aGUgZ2l2ZW4gdmFsdWUgYm91bmQgdG8gdGhlIGdpdmVuIGtleSBpbiBpdHMgbG9jYWwgYmluZGluZy5cbiAgICpcbiAgICogQG1ldGhvZCB3aXRoXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBrZXkgVGhlIGtleSB0byBib3VuZCB0aGUgdmFsdWUgdG8uXG4gICAqIEBwYXJhbSB7RnVuY3Rpb259IGZuIFRoZSBmdW5jdGlvbiB0byBydW4uIFRoZSBmdW5jdGlvbidzIGFyZ3VtZW50cyB3aWxsIGJlIGJvdW5kIGJhc2VkIG9uXG4gICAqICAgIHRoZWlyIG5hbWVzLlxuICAgKiBAcmV0dXJuIHtESS5TY29wZX0gVGhlIG5ld2x5IGNyZWF0ZWQgY2hpbGQgc2NvcGUuXG4gICAqL1xuICB3aXRoKGtleSwgdmFsdWUpIHtcbiAgICBsZXQgY2hpbGRTY29wZSA9IG5ldyBTY29wZSh0aGlzLCB0aGlzW19fcHJlZml4X19dKTtcbiAgICBjaGlsZFNjb3BlW19fbG9jYWxCaW5kaW5nc19fXVxuICAgICAgICAuYWRkKGFwcGVuZCh0aGlzW19fcHJlZml4X19dLCBrZXkpLCB0aGlzW19fY3JlYXRlUHJvdmlkZXJfX10odmFsdWUsIGtleSkpO1xuICAgIHJldHVybiBjaGlsZFNjb3BlO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYSBuZXcgY2hpbGQgc2NvcGUgd2l0aCB0aGUgZ2l2ZW4gdmFsdWUgYm91bmQgdG8gdGhlIGdpdmVuIGtleSBpbiBpdHMgbG9jYWwgYmluZGluZy5cbiAgICogVGhpcyBpcyBzaW1pbGFyIHRvIHt7I2Nyb3NzTGluayBcIkRJLlNjb3BlL3dpdGhcIn19e3svY3Jvc3NMaW5rfX0sIGJ1dCB0aGUgdmFsdWUgaXMgYSBjb25zdGFudC5cbiAgICpcbiAgICogQG1ldGhvZCBjb25zdGFudFxuICAgKiBAcGFyYW0ge3N0cmluZ30ga2V5IFRoZSBrZXkgdG8gYm91bmQgdGhlIHZhbHVlIHRvLlxuICAgKiBAcGFyYW0ge09iamVjdH0gdmFsdWUgVGhlIG9iamVjdCB0byBiaW5kIHRvIHRoZSBnaXZlbiBrZXkuXG4gICAqIEByZXR1cm4ge0RJLlNjb3BlfSBUaGUgbmV3bHkgY3JlYXRlZCBjaGlsZCBzY29wZS5cbiAgICovXG4gIGNvbnN0YW50KGtleSwgdmFsdWUpIHtcbiAgICByZXR1cm4gdGhpcy53aXRoKGtleSwgWygpID0+IHZhbHVlXSk7XG4gIH1cblxuICAvKipcbiAgICogR2xvYmFsbHkgYmluZHMgdGhlIGdpdmVuIHZhbHVlIHRvIHRoZSBnaXZlbiBrZXkuXG4gICAqXG4gICAqIEBtZXRob2QgYmluZFxuICAgKiBAcGFyYW0ge3N0cmluZ30ga2V5IFRoZSBrZXkgdG8gYm91bmQgdGhlIHZhbHVlIHRvLlxuICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBmbiBUaGUgZnVuY3Rpb24gdG8gcnVuLiBUaGUgZnVuY3Rpb24ncyBhcmd1bWVudHMgd2lsbCBiZSBib3VuZCBiYXNlZCBvblxuICAgKiAgICB0aGVpciBuYW1lcy5cbiAgICovXG4gIGJpbmQoa2V5LCB2YWx1ZSkge1xuICAgIGJpbmRpbmdzLmFkZChhcHBlbmQodGhpc1tfX3ByZWZpeF9fXSwga2V5KSwgdGhpc1tfX2NyZWF0ZVByb3ZpZGVyX19dKHZhbHVlLCBrZXkpKTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIHRoZSBwcm92aWRlciBib3VuZCB0byB0aGUgZ2l2ZW4ga2V5IGFuZCByZXNvbHZlIGl0IGluIHRoaXMgc2NvcGUuIFRoaXMgd2lsbCBmaXJzdCBjaGVja1xuICAgKiBmb3IgdGhlIGxvY2FsIGJpbmRpbmdzLCB0aGVuIGl0cyBhbmNlc3RvcnMuIElmIG5vIGJpbmRpbmcgaXMgZm91bmQgaW4gdGhlIGFuY2VzdHJhbCBwYXRoLCB0aGlzXG4gICAqIHdpbGwgY2hlY2sgZm9yIHRoZSBnbG9iYWwgYmluZGluZ3MuXG4gICAqXG4gICAqIEBtZXRob2QgZ2V0XG4gICAqIEBwYXJhbSB7c3RyaW5nfSBrZXkgS2V5IHdob3NlIGJvdW5kIHZhbHVlIHNob3VsZCBiZSByZXR1cm5lZC5cbiAgICogQHJldHVybiB7YW55fSBUaGUgdmFsdWUgYm91bmQgdG8gdGhlIGdpdmVuIGtleSwgb3IgdW5kZWZpbmVkIGlmIG5vIHZhbHVlcyBjYW4gYmUgZm91bmQuXG4gICAqL1xuICBnZXQoa2V5KSB7XG4gICAgbGV0IHZhbHVlID0gdGhpc1tfX2dldF9fXShhcHBlbmQodGhpc1tfX3ByZWZpeF9fXSwga2V5KSk7XG4gICAgaWYgKHZhbHVlID09PSB1bmRlZmluZWQpIHtcbiAgICAgIHJldHVybiBHbG9iYWxzLmdldEdsb2JhbChrZXksIHRoaXMpO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gdmFsdWU7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFJ1bnMgdGhlIGdpdmVuIGZ1bmN0aW9uIGFmdGVyIGluamVjdGluZyBhbnkgZGVwZW5kZW5jaWVzLlxuICAgKlxuICAgKiBAbWV0aG9kIHJ1blxuICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBmbiBUaGUgZnVuY3Rpb24gdG8gcnVuLiBUaGUgZnVuY3Rpb24ncyBhcmd1bWVudHMgd2lsbCBiZSBib3VuZCBiYXNlZCBvblxuICAgKiAgICB0aGVpciBuYW1lcy5cbiAgICovXG4gIHJ1bihmbikge1xuICAgIHRoaXNbX19jcmVhdGVQcm92aWRlcl9fXShmbikucmVzb2x2ZSh0aGlzKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBQcmVmaXggYW55IGtleXMgZ2l2ZW4gdG8gdGhpcyBzY29wZSB3aXRoIHRoZSBnaXZlbiBwcmVmaXguXG4gICAqXG4gICAqIEBtZXRob2QgcHJlZml4XG4gICAqIEBwYXJhbSB7c3RyaW5nfSBwcmVmaXggVGhlIHByZWZpeCB0byBhZGQuXG4gICAqIEByZXR1cm4ge0RJLlNjb3BlfSBUaGUgbmV3bHkgY3JlYXRlZCBjaGlsZCBzY29wZSB3aXRoIHRoZSBnaXZlbiBwcmVmaXguXG4gICAqL1xuICBwcmVmaXgocHJlZml4KSB7XG4gICAgcmV0dXJuIG5ldyBTY29wZSh0aGlzLCBhcHBlbmQocHJlZml4LCB0aGlzW19fcHJlZml4X19dKSk7XG4gIH1cbn1cblxuZnVuY3Rpb24gYXBwZW5kKGwsIHIpIHtcbiAgcmV0dXJuIFtsLCByXS5maWx0ZXIoaSA9PiAhIWkpLmpvaW4oJy4nKTtcbn1cblxuZXhwb3J0IGRlZmF1bHQgU2NvcGU7Il19
