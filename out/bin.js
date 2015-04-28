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
   * @param {Function} fn The function to run. The function should take one argument, which is an
   *    object that will contain the injected values, keyed by the given keys.
   * @param {Object} keys Mapping of objects to inject to the function.
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
    this[__prefix__] = prefix;
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
        if (!this[__resolvedValues__].has(scope)) {
          var resolvedArgs = {};
          for (var argName in this[__keys__]) {
            var key = this[__keys__][argName];

            // Check if the key is optional.
            var optional = key[key.length - 1] === "?";
            if (optional) {
              key = key.substring(0, key.length - 1);
            }

            // Check if the key is root key.
            var isRoot = key[0] === "/";
            if (isRoot) {
              key = key.substring(1);
            } else if (this[__prefix__]) {
              key = "" + this[__prefix__] + "." + key;
            }

            // Now replace any = in the key with the argument name.
            key = key.replace("=", argName.trim());

            // TODO(gs): Handle cyclic dependency.
            var _value = undefined;

            try {
              // Check the local scope first.
              _value = this[__localScope__][__get__](key, scope);

              if (_value === undefined) {
                // If value cannot be resolved in the local scope, check the given scope.
                _value = scope[__get__](key, scope);
              }

              if (_value === undefined) {
                // If value cannot be resolved in the local scope, check the global bindings.
                _value = Globals.getGlobal(key, scope);
              }
            } catch (e) {
              // TODO(gs): Make a shared method.
              if (this[__name__]) {
                throw "" + e + "\n\twhile providing " + this[__name__];
              } else {
                throw "" + e + "\n\twhile running expression";
              }
            }

            if (_value === undefined) {
              if (optional) {
                resolvedArgs[argName] = undefined;
              } else if (this[__name__]) {
                throw "Cannot find " + key + " while providing " + this[__name__];
              } else {
                throw "Cannot find " + key + " while running expression";
              }
            } else {
              resolvedArgs[argName] = _value;
            }
          }

          var value = undefined;

          try {
            value = this[__function__](resolvedArgs);
          } catch (e) {
            if (this[__name__]) {
              throw "Uncaught exception " + e + "\n\twhile running provider " + this[__name__];
            } else {
              throw "Uncaught exception " + e + "\n\twhile running expression";
            }
          }

          if (value === undefined && this[__name__]) {
            console.warn("Value of " + this[__name__] + " is undefined");
          }

          this[__resolvedValues__].set(scope, value);
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
    value: function (fn, keys) {
      var name = arguments[2] === undefined ? null : arguments[2];

      return new Provider(fn, keys, this[__prefix__], this, name);
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
    value: function _with(key, keys, fn) {
      var childScope = new Scope(this, this[__prefix__]);
      childScope[__localBindings__].add(append(this[__prefix__], key), this[__createProvider__](fn, keys, key));
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
      return this["with"](key, {}, function () {
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
    value: function bind(key, keys, fn) {
      bindings.add(append(this[__prefix__], key), this[__createProvider__](fn, keys, key));
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
    value: function run(keys, fn) {
      this[__createProvider__](fn, keys).resolve(this);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIvVXNlcnMvZ3NvZWQvcHJvai9kaS9zcmMvYmluZGluZ3RyZWUuanMiLCIvVXNlcnMvZ3NvZWQvcHJvai9kaS9zcmMvZ2xvYmFscy5qcyIsIi9Vc2Vycy9nc29lZC9wcm9qL2RpL3NyYy9pbmRleC5qcyIsIi9Vc2Vycy9nc29lZC9wcm9qL2RpL3NyYy9wcm92aWRlci5qcyIsIi9Vc2Vycy9nc29lZC9wcm9qL2RpL3NyYy9zY29wZS5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7Ozs7QUNDQSxJQUFNLFVBQVUsR0FBRyxNQUFNLENBQUMsUUFBUSxDQUFDLENBQUM7O0FBRXBDLElBQU0sU0FBUyxHQUFHLEdBQUcsQ0FBQzs7SUFFaEIsV0FBVzs7Ozs7Ozs7QUFPSixXQVBQLFdBQVcsR0FPRDswQkFQVixXQUFXOztBQVFiLFFBQUksQ0FBQyxVQUFVLENBQUMsR0FBRyxJQUFJLEdBQUcsRUFBRSxDQUFDO0dBQzlCOztlQVRHLFdBQVc7QUFxQmYsT0FBRzs7Ozs7Ozs7Ozs7OzthQUFBLGFBQUMsR0FBRyxFQUFFLEtBQUssRUFBYTtZQUFYLEtBQUssZ0NBQUcsQ0FBQzs7O0FBRXZCLFlBQUksUUFBUSxHQUFHLEdBQUcsQ0FBQyxLQUFLLENBQUMsU0FBUyxDQUFDLENBQUM7QUFDcEMsWUFBSSxVQUFVLEdBQUcsUUFBUSxDQUFDLFFBQVEsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxHQUFHLEtBQUssQ0FBQyxDQUFDOztBQUV2RCxZQUFJLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxVQUFVLENBQUMsRUFBRTtBQUNyQyxjQUFJLENBQUMsVUFBVSxDQUFDLENBQUMsR0FBRyxDQUFDLFVBQVUsRUFBRTtBQUMvQixlQUFHLEVBQUUsR0FBRztBQUNSLGlCQUFLLEVBQUUsS0FBSztXQUNiLENBQUMsQ0FBQztTQUNKLE1B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Q0FBQyxDQUFDLENBQUM7QUFDckYsYUFBTyxJQUFJLENBQUM7S0FDYjs7Ozs7Ozs7Ozs7OztXQVdFLGFBQUMsR0FBRyxFQUFFO0FBQ1AsVUFBSSxLQUFLLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQztBQUN6RCxVQUFJLEtBQUssS0FBSyxTQUFTLEVBQUU7QUFDdkIsZUFBTyxPQUFPLENBQUMsU0FBUyxDQUFDLEdBQUcsRUFBRSxJQUFJLENBQUMsQ0FBQztPQUNyQyxNQUFNO0FBQ0wsZUFBTyxLQUFLLENBQUM7T0FDZDtLQUNGOzs7Ozs7Ozs7OztXQVNFLGFBQUMsSUFBSSxFQUFFLEVBQUUsRUFBRTtBQUNaLFVBQUksQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDLEVBQUUsRUFBRSxJQUFJLENBQUMsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUM7S0FDbEQ7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztPQVNLLFVBQUMsTUFBTSxFQUFFO0FBQ2IsYUFBTyxJQUFJLEtBQUssQ0FBQyxJQUFJLEVBQUUsTUFBTSxDQUFDLE1BQU0sRUFBRSxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDO0tBQzFEOzs7U0FuSEcsS0FBSzs7O0FBc0hYLFNBQVMsTUFBTSxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUU7QUFDcEIsU0FBTyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsVUFBQSxDQUFDO1dBQUksQ0FBQyxDQUFDLENBQUM7R0FBQSxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO0NBQzFDOztpQkFFYyxLQUFLIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIi8vIFByaXZhdGUgc3ltYm9scy5cbmNvbnN0IF9fdmFsdWVzX18gPSBTeW1ib2woJ3ZhbHVlcycpO1xuXG5jb25zdCBTRVBBUkFUT1IgPSAnXyc7XG5cbmNsYXNzIEJpbmRpbmdUcmVlIHtcblxuICAvKipcbiAgICogUmVwcmVzZW50cyBhIHRyZWUgb2YgYm91bmQgdmFsdWVzIGtleWVkIGJ5IGJpbmRpbmcga2V5LlxuICAgKiBAY2xhc3MgREkuQmluZGluZ1RyZWVcbiAgICogQGNvbnN0cnVjdG9yXG4gICAqL1xuICBjb25zdHJ1Y3RvcigpIHtcbiAgICB0aGlzW19fdmFsdWVzX19dID0gbmV3IE1hcCgpO1xuICB9XG5cbiAgLyoqXG4gICAqIEFkZHMgdGhlIGdpdmVuIGtleSBhbmQgdmFsdWUgdG8gdGhlIHRyZWUuIFRoZSB0cmVlIHdpbGwgdHJ5IHRvIGJpbmQgdXNpbmcgdGhlIGxhc3Qgc2VnbWVudCBvZlxuICAgKiB0aGUga2V5LiBJZiB0aGlzIGNhdXNlcyBhIGNvbmZsaWN0LCBpdCB3aWxsIGNyZWF0ZSBhIHN1YnRyZWUuXG4gICAqXG4gICAqIEBtZXRob2QgYWRkXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBrZXkgVGhlIGtleSB0byBiaW5kIHRoZSB2YWx1ZSB0by5cbiAgICogQHBhcmFtIHtPYmplY3R9IHZhbHVlIFRoZSB2YWx1ZSB0byBiZSBib3VuZC5cbiAgICogQHBhcmFtIHtudW1iZXJ9IFtkZXB0aD0wXSBUaGUgZGVwdGggb2YgdGhlIGtleSB0byB1c2UgYXMgYmluZGluZyBrZXkuIFRoaXMgc2hvdWxkIG5vdCBiZVxuICAgKiAgICBjYWxsZWQgZnJvbSBvdXRzaWRlIHRoZSBjbGFzcy5cbiAgICovXG4gIGFkZChrZXksIHZhbHVlLCBkZXB0aCA9IDApIHtcbiAgICAvLyBUT0RPKGdzKTogUmVtb3ZlIHRoZSBzZXBhcmF0b3JcbiAgICBsZXQgc2VnbWVudHMgPSBrZXkuc3BsaXQoU0VQQVJBVE9SKTtcbiAgICBsZXQgYmluZGluZ0tleSA9IHNlZ21lbnRzW3NlZ21lbnRzLmxlbmd0aCAtIDEgLSBkZXB0aF07XG5cbiAgICBpZiAoIXRoaXNbX192YWx1ZXNfX10uaGFzKGJpbmRpbmdLZXkpKSB7XG4gICAgICB0aGlzW19fdmFsdWVzX19dLnNldChiaW5kaW5nS2V5LCB7XG4gICAgICAgIGtleToga2V5LFxuICAgICAgICB2YWx1ZTogdmFsdWVcbiAgICAgIH0pO1xuICAgIH0gZWxzZSB7XG4gICAgICAvLyBUaGVyZSBpcyBhbHJlYWR5IGEgdmFsdWUgY29ycmVzcG9uZGluZyB0byB0aGlzIGtleVxuICAgICAgbGV0IGV4aXN0aW5nVmFsdWUgPSB0aGlzW19fdmFsdWVzX19dLmdldChiaW5kaW5nS2V5KTtcbiAgICAgIGlmIChleGlzdGluZ1ZhbHVlLmtleSA9PT0ga2V5KSB7XG4gICAgICAgIHRocm93IGBLZXkgJHtrZXl9IGlzIGFscmVhZHkgYm91bmRgO1xuICAgICAgfVxuXG4gICAgICBsZXQgbmV3VHJlZSA9IG5ldyBCaW5kaW5nVHJlZSgpO1xuICAgICAgdGhpc1tfX3ZhbHVlc19fXS5zZXQoYmluZGluZ0tleSwgbmV3VHJlZSk7XG4gICAgICBuZXdUcmVlLmFkZChleGlzdGluZ1ZhbHVlLmtleSwgZXhpc3RpbmdWYWx1ZS52YWx1ZSwgZGVwdGggKyAxKTtcbiAgICAgIG5ld1RyZWUuYWRkKGtleSwgdmFsdWUsIGRlcHRoICsgMSk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgdGhlIHZhbHVlIGNvcnJlc3BvbmRpbmcgdG8gdGhlIGdpdmVuIGtleS5cbiAgICpcbiAgICogQHBhcmFtIHtzdHJpbmd9IGtleSBLZXkgb2YgdGhlIHZhbHVlIHRvIHJldHVybi5cbiAgICogQHBhcmFtIHtudW1iZXJ9IFtkZXB0aD0wXSBUaGUgZGVwdGggb2YgdGhlIGtleSB0byB1c2UgYXMgYmluZGluZyBrZXkuIFRoaXMgc2hvdWxkIG5vdCBiZVxuICAgKiAgICBjYWxsZWQgZnJvbSBvdXRzaWRlIHRoZSBjbGFzcy5cbiAgICogQHJldHVybiB7YW55fSBUaGUgYm91bmQgdmFsdWUsIG9yIHVuZGVmaW5lZCBpZiB0aGUgdmFsdWUgY2Fubm90IGJlIGZvdW5kLCBvciBpZiB0aGUga2V5IGhhc1xuICAgKiAgICBjb2xsaXNpb24gYnV0IGNvbGxpc2lvbiBjYW5ub3QgYmUgcmVzb2x2ZWQuXG4gICAqL1xuICBnZXQoa2V5LCBkZXB0aCA9IDApIHtcbiAgICBsZXQgc2VnbWVudHMgPSBrZXkuc3BsaXQoU0VQQVJBVE9SKTtcbiAgICBsZXQgYmluZGluZ0tleSA9IHNlZ21lbnRzW3NlZ21lbnRzLmxlbmd0aCAtIDEgLSBkZXB0aF07XG5cbiAgICBpZiAoYmluZGluZ0tleSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgIH1cblxuICAgIGlmICghdGhpc1tfX3ZhbHVlc19fXS5oYXMoYmluZGluZ0tleSkpIHtcbiAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgfVxuXG4gICAgbGV0IHZhbHVlID0gdGhpc1tfX3ZhbHVlc19fXS5nZXQoYmluZGluZ0tleSk7XG4gICAgaWYgKHZhbHVlIGluc3RhbmNlb2YgQmluZGluZ1RyZWUpIHtcbiAgICAgIHJldHVybiB2YWx1ZS5nZXQoa2V5LCBkZXB0aCArIDEpO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gdmFsdWUudmFsdWU7XG4gICAgfVxuICB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IEJpbmRpbmdUcmVlOyIsImltcG9ydCBCaW5kaW5nVHJlZSBmcm9tICcuL2JpbmRpbmd0cmVlJztcblxuY29uc3QgR2xvYmFscyA9IHtcbiAgZ2V0OiBTeW1ib2woJ2dldCcpLFxuXG4gIGdldEdsb2JhbChrZXksIHNjb3BlKSB7XG4gICAgbGV0IGdsb2JhbFByb3ZpZGVyID0gdGhpcy5iaW5kaW5ncy5nZXQoa2V5KTtcbiAgICBpZiAoZ2xvYmFsUHJvdmlkZXIgPT09IHVuZGVmaW5lZCkge1xuICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIGdsb2JhbFByb3ZpZGVyLnJlc29sdmUoc2NvcGUpO1xuICAgIH1cbiAgfSxcblxuICBiaW5kaW5nczogbmV3IEJpbmRpbmdUcmVlKClcbn07XG5cbmV4cG9ydCBkZWZhdWx0IEdsb2JhbHM7IiwiaW1wb3J0IEJpbmRpbmdUcmVlIGZyb20gJy4vYmluZGluZ3RyZWUnO1xuaW1wb3J0IEdsb2JhbHMgZnJvbSAnLi9nbG9iYWxzJztcbmltcG9ydCBQcm92aWRlciBmcm9tICcuL3Byb3ZpZGVyJztcbmltcG9ydCBTY29wZSBmcm9tICcuL3Njb3BlJztcblxuKCh3aW5kb3cpID0+IHtcbiAgd2luZG93WydESSddID0gbmV3IFNjb3BlKCk7XG5cbiAgd2luZG93WydESSddWydCaW5kaW5nVHJlZSddID0gQmluZGluZ1RyZWU7XG4gIHdpbmRvd1snREknXVsnUHJvdmlkZXInXSA9IFByb3ZpZGVyO1xuICB3aW5kb3dbJ0RJJ11bJ1Njb3BlJ10gPSBTY29wZTtcbiAgd2luZG93WydESSddWydiaW5kaW5ncyddID0gR2xvYmFscy5iaW5kaW5ncztcbn0pKHdpbmRvdyk7IiwiaW1wb3J0IEdsb2JhbHMgZnJvbSAnLi9nbG9iYWxzJztcblxuY29uc3QgX19nZXRfXyA9IEdsb2JhbHMuZ2V0O1xuXG4vLyBQcml2YXRlIHN5bWJvbHMuXG5jb25zdCBfX2Z1bmN0aW9uX18gPSBTeW1ib2woKTtcbmNvbnN0IF9fbG9jYWxTY29wZV9fID0gU3ltYm9sKCdsb2NhbFNjb3BlJyk7XG5jb25zdCBfX25hbWVfXyA9IFN5bWJvbCgpO1xuY29uc3QgX19wcmVmaXhfXyA9IFN5bWJvbCgncHJlZml4Jyk7XG5jb25zdCBfX2tleXNfXyA9IFN5bWJvbCgpO1xuY29uc3QgX19yZXNvbHZlZFZhbHVlc19fID0gU3ltYm9sKCk7XG5cbmNvbnN0IEZOX0FSR1MgPSAvXmZ1bmN0aW9uXFxzKlteXFwoXSpcXChcXHMqKFteXFwpXSopXFwpL207XG5cbmNsYXNzIFByb3ZpZGVyIHtcblxuICAvKipcbiAgICogQGNsYXNzIERJLlByb3ZpZGVyXG4gICAqIEBjb25zdHJ1Y3RvclxuICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBmbiBUaGUgZnVuY3Rpb24gdG8gcnVuLiBUaGUgZnVuY3Rpb24gc2hvdWxkIHRha2Ugb25lIGFyZ3VtZW50LCB3aGljaCBpcyBhblxuICAgKiAgICBvYmplY3QgdGhhdCB3aWxsIGNvbnRhaW4gdGhlIGluamVjdGVkIHZhbHVlcywga2V5ZWQgYnkgdGhlIGdpdmVuIGtleXMuXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBrZXlzIE1hcHBpbmcgb2Ygb2JqZWN0cyB0byBpbmplY3QgdG8gdGhlIGZ1bmN0aW9uLlxuICAgKiBAcGFyYW0ge3N0cmluZ30gcHJlZml4IFRoZSBwcmVmaXggdG8gdXNlIGZvciB0aGUga2V5cy5cbiAgICogQHBhcmFtIHtESS5TY29wZX0gbG9jYWxTY29wZSBUaGUgbG9jYWwgc2NvcGUuIFRoaXMgd2lsbCBiZSBwcmlvcml0aXplZCB3aGVuIGNoZWNraW5nIGZvciBib3VuZFxuICAgKiAgICB2YWx1ZXMuXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBbbmFtZT1udWxsXSBSZWZlcmVuY2UgbmFtZSBvZiB0aGUgcHJvdmlkZXIuIFRoaXMgaXMgdXNlZCBmb3IgZGV0ZWN0aW5nIGN5Y2xpY1xuICAgKiAgICBkZXBlbmRlbmNpZXMuXG4gICAqL1xuICBjb25zdHJ1Y3Rvcihmbiwga2V5cywgcHJlZml4LCBsb2NhbFNjb3BlLCBuYW1lID0gbnVsbCkge1xuICAgIHRoaXNbX19mdW5jdGlvbl9fXSA9IGZuO1xuICAgIHRoaXNbX19rZXlzX19dID0ga2V5cztcbiAgICB0aGlzW19fcHJlZml4X19dID0gcHJlZml4O1xuICAgIHRoaXNbX19sb2NhbFNjb3BlX19dID0gbG9jYWxTY29wZTtcbiAgICB0aGlzW19fbmFtZV9fXSA9IG5hbWU7XG4gICAgdGhpc1tfX3Jlc29sdmVkVmFsdWVzX19dID0gbmV3IE1hcCgpO1xuICB9XG5cbiAgLyoqXG4gICAqIFJlc29sdmVzIHRoZSBwcm92aWRlci4gUmVzb2x2ZWQgdmFsdWVzIGFyZSBjYWNoZWQgcGVyIHNjb3BlLlxuICAgKlxuICAgKiBAbWV0aG9kIHJlc29sdmVcbiAgICogQHBhcmFtIHtESS5TY29wZX0gc2NvcGUgVGhlIHNjb3BlIHRvIHJlc29sdmUgdGhlIHZhbHVlIGluLlxuICAgKiBAcmV0dXJuIHtPYmplY3R9IFRoZSByZXNvbHZlZCB2YWx1ZSBmb3IgdGhlIGdpdmVuIHNjb3BlLlxuICAgKi9cbiAgcmVzb2x2ZShzY29wZSkge1xuICAgIGlmICghdGhpc1tfX3Jlc29sdmVkVmFsdWVzX19dLmhhcyhzY29wZSkpIHtcbiAgICAgIGxldCByZXNvbHZlZEFyZ3MgPSB7fTtcbiAgICAgIGZvciAobGV0IGFyZ05hbWUgaW4gdGhpc1tfX2tleXNfX10pIHtcbiAgICAgICAgbGV0IGtleSA9IHRoaXNbX19rZXlzX19dW2FyZ05hbWVdO1xuXG4gICAgICAgIC8vIENoZWNrIGlmIHRoZSBrZXkgaXMgb3B0aW9uYWwuXG4gICAgICAgIGxldCBvcHRpb25hbCA9IGtleVtrZXkubGVuZ3RoIC0gMV0gPT09ICc/JztcbiAgICAgICAgaWYgKG9wdGlvbmFsKSB7XG4gICAgICAgICAga2V5ID0ga2V5LnN1YnN0cmluZygwLCBrZXkubGVuZ3RoIC0gMSk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBDaGVjayBpZiB0aGUga2V5IGlzIHJvb3Qga2V5LlxuICAgICAgICBsZXQgaXNSb290ID0ga2V5WzBdID09PSAnLyc7XG4gICAgICAgIGlmIChpc1Jvb3QpIHtcbiAgICAgICAgICBrZXkgPSBrZXkuc3Vic3RyaW5nKDEpO1xuICAgICAgICB9IGVsc2UgaWYgKHRoaXNbX19wcmVmaXhfX10pIHtcbiAgICAgICAgICBrZXkgPSBgJHt0aGlzW19fcHJlZml4X19dfS4ke2tleX1gO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gTm93IHJlcGxhY2UgYW55ID0gaW4gdGhlIGtleSB3aXRoIHRoZSBhcmd1bWVudCBuYW1lLlxuICAgICAgICBrZXkgPSBrZXkucmVwbGFjZSgnPScsIGFyZ05hbWUudHJpbSgpKTtcblxuICAgICAgICAvLyBUT0RPKGdzKTogSGFuZGxlIGN5Y2xpYyBkZXBlbmRlbmN5LlxuICAgICAgICBsZXQgdmFsdWU7XG5cbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAvLyBDaGVjayB0aGUgbG9jYWwgc2NvcGUgZmlyc3QuXG4gICAgICAgICAgdmFsdWUgPSB0aGlzW19fbG9jYWxTY29wZV9fXVtfX2dldF9fXShrZXksIHNjb3BlKTtcblxuICAgICAgICAgIGlmICh2YWx1ZSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAvLyBJZiB2YWx1ZSBjYW5ub3QgYmUgcmVzb2x2ZWQgaW4gdGhlIGxvY2FsIHNjb3BlLCBjaGVjayB0aGUgZ2l2ZW4gc2NvcGUuXG4gICAgICAgICAgICB2YWx1ZSA9IHNjb3BlW19fZ2V0X19dKGtleSwgc2NvcGUpO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGlmICh2YWx1ZSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAvLyBJZiB2YWx1ZSBjYW5ub3QgYmUgcmVzb2x2ZWQgaW4gdGhlIGxvY2FsIHNjb3BlLCBjaGVjayB0aGUgZ2xvYmFsIGJpbmRpbmdzLlxuICAgICAgICAgICAgdmFsdWUgPSBHbG9iYWxzLmdldEdsb2JhbChrZXksIHNjb3BlKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAvLyBUT0RPKGdzKTogTWFrZSBhIHNoYXJlZCBtZXRob2QuXG4gICAgICAgICAgaWYgKHRoaXNbX19uYW1lX19dKSB7XG4gICAgICAgICAgICB0aHJvdyBgJHtlfVxcblxcdHdoaWxlIHByb3ZpZGluZyAke3RoaXNbX19uYW1lX19dfWA7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRocm93IGAke2V9XFxuXFx0d2hpbGUgcnVubmluZyBleHByZXNzaW9uYDtcbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodmFsdWUgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgIGlmIChvcHRpb25hbCkge1xuICAgICAgICAgICAgcmVzb2x2ZWRBcmdzW2FyZ05hbWVdID0gdW5kZWZpbmVkO1xuICAgICAgICAgIH0gZWxzZSBpZiAodGhpc1tfX25hbWVfX10pIHtcbiAgICAgICAgICAgIHRocm93IGBDYW5ub3QgZmluZCAke2tleX0gd2hpbGUgcHJvdmlkaW5nICR7dGhpc1tfX25hbWVfX119YDtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhyb3cgYENhbm5vdCBmaW5kICR7a2V5fSB3aGlsZSBydW5uaW5nIGV4cHJlc3Npb25gO1xuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXNvbHZlZEFyZ3NbYXJnTmFtZV0gPSB2YWx1ZTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBsZXQgdmFsdWU7XG5cbiAgICAgIHRyeSB7XG4gICAgICAgIHZhbHVlID0gdGhpc1tfX2Z1bmN0aW9uX19dKHJlc29sdmVkQXJncyk7XG4gICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgIGlmICh0aGlzW19fbmFtZV9fXSkge1xuICAgICAgICAgIHRocm93IGBVbmNhdWdodCBleGNlcHRpb24gJHtlfVxcblxcdHdoaWxlIHJ1bm5pbmcgcHJvdmlkZXIgJHt0aGlzW19fbmFtZV9fXX1gO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHRocm93IGBVbmNhdWdodCBleGNlcHRpb24gJHtlfVxcblxcdHdoaWxlIHJ1bm5pbmcgZXhwcmVzc2lvbmA7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgaWYgKHZhbHVlID09PSB1bmRlZmluZWQgJiYgdGhpc1tfX25hbWVfX10pIHtcbiAgICAgICAgY29uc29sZS53YXJuKGBWYWx1ZSBvZiAke3RoaXNbX19uYW1lX19dfSBpcyB1bmRlZmluZWRgKTtcbiAgICAgIH1cblxuICAgICAgdGhpc1tfX3Jlc29sdmVkVmFsdWVzX19dLnNldChzY29wZSwgdmFsdWUpO1xuICAgIH1cblxuICAgIHJldHVybiB0aGlzW19fcmVzb2x2ZWRWYWx1ZXNfX10uZ2V0KHNjb3BlKTtcbiAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBQcm92aWRlcjsiLCJpbXBvcnQgQmluZGluZ1RyZWUgZnJvbSAnLi9iaW5kaW5ndHJlZSc7XG5pbXBvcnQgUHJvdmlkZXIgZnJvbSAnLi9wcm92aWRlcic7XG5pbXBvcnQgR2xvYmFscyBmcm9tICcuL2dsb2JhbHMnO1xuXG5cbi8vIFByaXZhdGUgc3ltYm9scy5cbmNvbnN0IF9fbG9jYWxCaW5kaW5nc19fID0gU3ltYm9sKCdsb2NhbEJpbmRpbmdzJyk7XG5jb25zdCBfX3BhcmVudFNjb3BlX18gPSBTeW1ib2woJ3BhcmVudFNjb3BlJyk7XG5jb25zdCBfX3ByZWZpeF9fID0gU3ltYm9sKCdwcmVmaXgnKTtcblxuY29uc3QgX19jcmVhdGVQcm92aWRlcl9fID0gU3ltYm9sKCk7XG5cbmNvbnN0IF9fZ2V0X18gPSBHbG9iYWxzLmdldDtcbmNvbnN0IGJpbmRpbmdzID0gR2xvYmFscy5iaW5kaW5ncztcblxuY2xhc3MgU2NvcGUge1xuICAvKipcbiAgICogU2NvcGUgY29udGFpbmluZyBsb2NhbCBiaW5kaW5ncy5cbiAgICpcbiAgICogQGNsYXNzIERJLlNjb3BlXG4gICAqIEBjb25zdHJ1Y3RvclxuICAgKiBAcGFyYW0ge0RJLlNjb3BlfSBbcGFyZW50U2NvcGU9bnVsbF0gVGhlIHBhcmVudCBzY29wZS5cbiAgICovXG4gIGNvbnN0cnVjdG9yKHBhcmVudFNjb3BlID0gbnVsbCwgcHJlZml4ID0gJycpIHtcbiAgICB0aGlzW19fbG9jYWxCaW5kaW5nc19fXSA9IG5ldyBCaW5kaW5nVHJlZSgpO1xuICAgIHRoaXNbX19wYXJlbnRTY29wZV9fXSA9IHBhcmVudFNjb3BlO1xuICAgIHRoaXNbX19wcmVmaXhfX10gPSBwcmVmaXg7XG4gIH1cblxuICBbX19jcmVhdGVQcm92aWRlcl9fXShmbiwga2V5cywgbmFtZSA9IG51bGwpIHtcbiAgICByZXR1cm4gbmV3IFByb3ZpZGVyKGZuLCBrZXlzLCB0aGlzW19fcHJlZml4X19dLCB0aGlzLCBuYW1lKTtcbiAgfVxuXG4gIFtfX2dldF9fXShrZXksIHNjb3BlKSB7XG4gICAgbGV0IHByb3ZpZGVyID0gdGhpc1tfX2xvY2FsQmluZGluZ3NfX10uZ2V0KGtleSk7XG4gICAgaWYgKHByb3ZpZGVyID09PSB1bmRlZmluZWQpIHtcbiAgICAgIGlmICh0aGlzW19fcGFyZW50U2NvcGVfX10pIHtcbiAgICAgICAgcmV0dXJuIHRoaXNbX19wYXJlbnRTY29wZV9fXVtfX2dldF9fXShrZXksIHNjb3BlKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBwcm92aWRlci5yZXNvbHZlKHNjb3BlKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlcyBhIG5ldyBjaGlsZCBzY29wZSB3aXRoIHRoZSBnaXZlbiB2YWx1ZSBib3VuZCB0byB0aGUgZ2l2ZW4ga2V5IGluIGl0cyBsb2NhbCBiaW5kaW5nLlxuICAgKlxuICAgKiBAbWV0aG9kIHdpdGhcbiAgICogQHBhcmFtIHtzdHJpbmd9IGtleSBUaGUga2V5IHRvIGJvdW5kIHRoZSB2YWx1ZSB0by5cbiAgICogQHBhcmFtIHtPYmplY3R9IGtleXMgT2JqZWN0IHdpdGggbWFwcGluZyBvZiB2YXJpYWJsZSBuYW1lIHRvIHRoZSBib3VuZCBuYW1lLlxuICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBmbiBUaGUgZnVuY3Rpb24gdG8gcnVuLiBUaGUgZnVuY3Rpb24gd2lsbCBoYXZlIG9uZSBhcmd1bWVudCwgY29udGFpbmluZ1xuICAgKiAgICBib3VuZCBwcm9wZXJ0aWVzLiBFYWNoIHByb3BlcnR5IGlzIG5hbWVkIGZvbGxvd2luZyB0aGV5IGtleXMgc3BlY2lmaWVkIGluIHRoZSBga2V5c2BcbiAgICogICAgYXR0cmlidXRlLlxuICAgKiBAcmV0dXJuIHtESS5TY29wZX0gVGhlIG5ld2x5IGNyZWF0ZWQgY2hpbGQgc2NvcGUuXG4gICAqL1xuICB3aXRoKGtleSwga2V5cywgZm4pIHtcbiAgICBsZXQgY2hpbGRTY29wZSA9IG5ldyBTY29wZSh0aGlzLCB0aGlzW19fcHJlZml4X19dKTtcbiAgICBjaGlsZFNjb3BlW19fbG9jYWxCaW5kaW5nc19fXVxuICAgICAgICAuYWRkKGFwcGVuZCh0aGlzW19fcHJlZml4X19dLCBrZXkpLCB0aGlzW19fY3JlYXRlUHJvdmlkZXJfX10oZm4sIGtleXMsIGtleSkpO1xuICAgIHJldHVybiBjaGlsZFNjb3BlO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYSBuZXcgY2hpbGQgc2NvcGUgd2l0aCB0aGUgZ2l2ZW4gdmFsdWUgYm91bmQgdG8gdGhlIGdpdmVuIGtleSBpbiBpdHMgbG9jYWwgYmluZGluZy5cbiAgICogVGhpcyBpcyBzaW1pbGFyIHRvIHt7I2Nyb3NzTGluayBcIkRJLlNjb3BlL3dpdGhcIn19e3svY3Jvc3NMaW5rfX0sIGJ1dCB0aGUgdmFsdWUgaXMgYSBjb25zdGFudC5cbiAgICpcbiAgICogQG1ldGhvZCBjb25zdGFudFxuICAgKiBAcGFyYW0ge3N0cmluZ30ga2V5IFRoZSBrZXkgdG8gYm91bmQgdGhlIHZhbHVlIHRvLlxuICAgKiBAcGFyYW0ge09iamVjdH0gdmFsdWUgVGhlIG9iamVjdCB0byBiaW5kIHRvIHRoZSBnaXZlbiBrZXkuXG4gICAqIEByZXR1cm4ge0RJLlNjb3BlfSBUaGUgbmV3bHkgY3JlYXRlZCBjaGlsZCBzY29wZS5cbiAgICovXG4gIGNvbnN0YW50KGtleSwgdmFsdWUpIHtcbiAgICByZXR1cm4gdGhpcy53aXRoKGtleSwge30sICgpID0+IHZhbHVlKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHbG9iYWxseSBiaW5kcyB0aGUgZ2l2ZW4gdmFsdWUgdG8gdGhlIGdpdmVuIGtleS5cbiAgICpcbiAgICogQG1ldGhvZCBiaW5kXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBrZXkgVGhlIGtleSB0byBib3VuZCB0aGUgdmFsdWUgdG8uXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBrZXlzIE9iamVjdCB3aXRoIG1hcHBpbmcgb2YgdmFyaWFibGUgbmFtZSB0byB0aGUgYm91bmQgbmFtZS5cbiAgICogQHBhcmFtIHtGdW5jdGlvbn0gZm4gVGhlIGZ1bmN0aW9uIHRvIHJ1bi4gVGhlIGZ1bmN0aW9uIHdpbGwgaGF2ZSBvbmUgYXJndW1lbnQsIGNvbnRhaW5pbmdcbiAgICogICAgYm91bmQgcHJvcGVydGllcy4gRWFjaCBwcm9wZXJ0eSBpcyBuYW1lZCBmb2xsb3dpbmcgdGhleSBrZXlzIHNwZWNpZmllZCBpbiB0aGUgYGtleXNgXG4gICAqICAgIGF0dHJpYnV0ZS5cbiAgICovXG4gIGJpbmQoa2V5LCBrZXlzLCBmbikge1xuICAgIGJpbmRpbmdzLmFkZChhcHBlbmQodGhpc1tfX3ByZWZpeF9fXSwga2V5KSwgdGhpc1tfX2NyZWF0ZVByb3ZpZGVyX19dKGZuLCBrZXlzLCBrZXkpKTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIHRoZSBwcm92aWRlciBib3VuZCB0byB0aGUgZ2l2ZW4ga2V5IGFuZCByZXNvbHZlIGl0IGluIHRoaXMgc2NvcGUuIFRoaXMgd2lsbCBmaXJzdCBjaGVja1xuICAgKiBmb3IgdGhlIGxvY2FsIGJpbmRpbmdzLCB0aGVuIGl0cyBhbmNlc3RvcnMuIElmIG5vIGJpbmRpbmcgaXMgZm91bmQgaW4gdGhlIGFuY2VzdHJhbCBwYXRoLCB0aGlzXG4gICAqIHdpbGwgY2hlY2sgZm9yIHRoZSBnbG9iYWwgYmluZGluZ3MuXG4gICAqXG4gICAqIEBtZXRob2QgZ2V0XG4gICAqIEBwYXJhbSB7c3RyaW5nfSBrZXkgS2V5IHdob3NlIGJvdW5kIHZhbHVlIHNob3VsZCBiZSByZXR1cm5lZC5cbiAgICogQHJldHVybiB7YW55fSBUaGUgdmFsdWUgYm91bmQgdG8gdGhlIGdpdmVuIGtleSwgb3IgdW5kZWZpbmVkIGlmIG5vIHZhbHVlcyBjYW4gYmUgZm91bmQuXG4gICAqL1xuICBnZXQoa2V5KSB7XG4gICAgbGV0IHZhbHVlID0gdGhpc1tfX2dldF9fXShhcHBlbmQodGhpc1tfX3ByZWZpeF9fXSwga2V5KSk7XG4gICAgaWYgKHZhbHVlID09PSB1bmRlZmluZWQpIHtcbiAgICAgIHJldHVybiBHbG9iYWxzLmdldEdsb2JhbChrZXksIHRoaXMpO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gdmFsdWU7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFJ1bnMgdGhlIGdpdmVuIGZ1bmN0aW9uIGFmdGVyIGluamVjdGluZyBhbnkgZGVwZW5kZW5jaWVzLlxuICAgKlxuICAgKiBAbWV0aG9kIHJ1blxuICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBmbiBUaGUgZnVuY3Rpb24gdG8gcnVuLiBUaGUgZnVuY3Rpb24ncyBhcmd1bWVudHMgd2lsbCBiZSBib3VuZCBiYXNlZCBvblxuICAgKiAgICB0aGVpciBuYW1lcy5cbiAgICovXG4gIHJ1bihrZXlzLCBmbikge1xuICAgIHRoaXNbX19jcmVhdGVQcm92aWRlcl9fXShmbiwga2V5cykucmVzb2x2ZSh0aGlzKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBQcmVmaXggYW55IGtleXMgZ2l2ZW4gdG8gdGhpcyBzY29wZSB3aXRoIHRoZSBnaXZlbiBwcmVmaXguXG4gICAqXG4gICAqIEBtZXRob2QgcHJlZml4XG4gICAqIEBwYXJhbSB7c3RyaW5nfSBwcmVmaXggVGhlIHByZWZpeCB0byBhZGQuXG4gICAqIEByZXR1cm4ge0RJLlNjb3BlfSBUaGUgbmV3bHkgY3JlYXRlZCBjaGlsZCBzY29wZSB3aXRoIHRoZSBnaXZlbiBwcmVmaXguXG4gICAqL1xuICBwcmVmaXgocHJlZml4KSB7XG4gICAgcmV0dXJuIG5ldyBTY29wZSh0aGlzLCBhcHBlbmQocHJlZml4LCB0aGlzW19fcHJlZml4X19dKSk7XG4gIH1cbn1cblxuZnVuY3Rpb24gYXBwZW5kKGwsIHIpIHtcbiAgcmV0dXJuIFtsLCByXS5maWx0ZXIoaSA9PiAhIWkpLmpvaW4oJy4nKTtcbn1cblxuZXhwb3J0IGRlZmF1bHQgU2NvcGU7Il19
