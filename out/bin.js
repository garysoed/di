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
   * @param {DI.Scope} localScope The local scope. This will be prioritized when checking for bound
   *    values.
   * @param {string} [name=null] Reference name of the provider. This is used for detecting cyclic
   *    dependencies.
   */

  function Provider(fn, keys, localScope) {
    var name = arguments[3] === undefined ? null : arguments[3];

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
      var _this = this;

      var name = arguments[1] === undefined ? null : arguments[1];

      var fn = value.splice(value.length - 1)[0];
      var prefixes = value.map(function (prefix) {
        return [_this[__prefix__], prefix].filter(function (i) {
          return !!i;
        }).join(".");
      });

      return new Provider(fn, prefixes, this, name);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIvVXNlcnMvZ3NvZWQvcHJvai9kaS9zcmMvYmluZGluZ3RyZWUuanMiLCIvVXNlcnMvZ3NvZWQvcHJvai9kaS9zcmMvZ2xvYmFscy5qcyIsIi9Vc2Vycy9nc29lZC9wcm9qL2RpL3NyYy9pbmRleC5qcyIsIi9Vc2Vycy9nc29lZC9wcm9qL2RpL3NyYy9wcm92aWRlci5qcyIsIi9Vc2Vycy9nc29lZC9wcm9qL2RpL3NyYy9zY29wZS5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7Ozs7QUNDQSxJQUFNLFVBQVUsR0FBRyxNQUFNLENBQUMsUUFBUSxDQUFDLENBQUM7O0FBRXBDLElBQU0sU0FBUyxHQUFHLEdBQUcsQ0FBQzs7SUFFaEIsV0FBVzs7Ozs7Ozs7QUFPSixXQVBQLFdBQVcsR0FPRDswQkFQVixXQUFXOztBQVFiLFFBQUksQ0FBQyxVQUFVLENBQUMsR0FBRyxJQUFJLEdBQUcsRUFBRSxDQUFDO0dBQzlCOztlQVRHLFdBQVc7QUFxQmYsT0FBRzs7Ozs7Ozs7Ozs7OzthQUFBLGFBQUMsR0FBRyxFQUFFLEtBQUssRUFBYTtZQUFYLEtBQUssZ0NBQUcsQ0FBQzs7O0FBRXZCLFlBQUksUUFBUSxHQUFHLEdBQUcsQ0FBQyxLQUFLLENBQUMsU0FBUyxDQUFDLENBQUM7QUFDcEMsWUFBSSxVQUFVLEdBQUcsUUFBUSxDQUFDLFFBQVEsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxHQUFHLEtBQUssQ0FBQyxDQUFDOztBQUV2RCxZQUFJLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxVQUFVLENBQUMsRUFBRTtBQUNyQyxjQUFJLENBQUMsVUFBVSxDQUFDLENBQUMsR0FBRyxDQUFDLFVBQVUsRUFBRTtBQUMvQixlQUFHLEVBQUUsR0FBRztBQUNSLGlCQUFLLEVBQUUsS0FBSztXQUNiLENBQUMsQ0FBQztTQUNKLE1B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S0FBSyIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCIvLyBQcml2YXRlIHN5bWJvbHMuXG5jb25zdCBfX3ZhbHVlc19fID0gU3ltYm9sKCd2YWx1ZXMnKTtcblxuY29uc3QgU0VQQVJBVE9SID0gJ18nO1xuXG5jbGFzcyBCaW5kaW5nVHJlZSB7XG5cbiAgLyoqXG4gICAqIFJlcHJlc2VudHMgYSB0cmVlIG9mIGJvdW5kIHZhbHVlcyBrZXllZCBieSBiaW5kaW5nIGtleS5cbiAgICogQGNsYXNzIERJLkJpbmRpbmdUcmVlXG4gICAqIEBjb25zdHJ1Y3RvclxuICAgKi9cbiAgY29uc3RydWN0b3IoKSB7XG4gICAgdGhpc1tfX3ZhbHVlc19fXSA9IG5ldyBNYXAoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBZGRzIHRoZSBnaXZlbiBrZXkgYW5kIHZhbHVlIHRvIHRoZSB0cmVlLiBUaGUgdHJlZSB3aWxsIHRyeSB0byBiaW5kIHVzaW5nIHRoZSBsYXN0IHNlZ21lbnQgb2ZcbiAgICogdGhlIGtleS4gSWYgdGhpcyBjYXVzZXMgYSBjb25mbGljdCwgaXQgd2lsbCBjcmVhdGUgYSBzdWJ0cmVlLlxuICAgKlxuICAgKiBAbWV0aG9kIGFkZFxuICAgKiBAcGFyYW0ge3N0cmluZ30ga2V5IFRoZSBrZXkgdG8gYmluZCB0aGUgdmFsdWUgdG8uXG4gICAqIEBwYXJhbSB7T2JqZWN0fSB2YWx1ZSBUaGUgdmFsdWUgdG8gYmUgYm91bmQuXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBbZGVwdGg9MF0gVGhlIGRlcHRoIG9mIHRoZSBrZXkgdG8gdXNlIGFzIGJpbmRpbmcga2V5LiBUaGlzIHNob3VsZCBub3QgYmVcbiAgICogICAgY2FsbGVkIGZyb20gb3V0c2lkZSB0aGUgY2xhc3MuXG4gICAqL1xuICBhZGQoa2V5LCB2YWx1ZSwgZGVwdGggPSAwKSB7XG4gICAgLy8gVE9ETyhncyk6IFJlbW92ZSB0aGUgc2VwYXJhdG9yXG4gICAgbGV0IHNlZ21lbnRzID0ga2V5LnNwbGl0KFNFUEFSQVRPUik7XG4gICAgbGV0IGJpbmRpbmdLZXkgPSBzZWdtZW50c1tzZWdtZW50cy5sZW5ndGggLSAxIC0gZGVwdGhdO1xuXG4gICAgaWYgKCF0aGlzW19fdmFsdWVzX19dLmhhcyhiaW5kaW5nS2V5KSkge1xuICAgICAgdGhpc1tfX3ZhbHVlc19fXS5zZXQoYmluZGluZ0tleSwge1xuICAgICAgICBrZXk6IGtleSxcbiAgICAgICAgdmFsdWU6IHZhbHVlXG4gICAgICB9KTtcbiAgICB9IGVsc2Uge1xuICAgICAgLy8gVGhlcmUgaXMgYWxyZWFkeSBhIHZhbHVlIGNvcnJlc3BvbmRpbmcgdG8gdGhpcyBrZXlcbiAgICAgIGxldCBleGlzdGluZ1ZhbHVlID0gdGhpc1tfX3ZhbHVlc19fXS5nZXQoYmluZGluZ0tleSk7XG4gICAgICBpZiAoZXhpc3RpbmdWYWx1ZS5rZXkgPT09IGtleSkge1xuICAgICAgICB0aHJvdyBgS2V5ICR7a2V5fSBpcyBhbHJlYWR5IGJvdW5kYDtcbiAgICAgIH1cblxuICAgICAgbGV0IG5ld1RyZWUgPSBuZXcgQmluZGluZ1RyZWUoKTtcbiAgICAgIHRoaXNbX192YWx1ZXNfX10uc2V0KGJpbmRpbmdLZXksIG5ld1RyZWUpO1xuICAgICAgbmV3VHJlZS5hZGQoZXhpc3RpbmdWYWx1ZS5rZXksIGV4aXN0aW5nVmFsdWUudmFsdWUsIGRlcHRoICsgMSk7XG4gICAgICBuZXdUcmVlLmFkZChrZXksIHZhbHVlLCBkZXB0aCArIDEpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIHRoZSB2YWx1ZSBjb3JyZXNwb25kaW5nIHRvIHRoZSBnaXZlbiBrZXkuXG4gICAqXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBrZXkgS2V5IG9mIHRoZSB2YWx1ZSB0byByZXR1cm4uXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBbZGVwdGg9MF0gVGhlIGRlcHRoIG9mIHRoZSBrZXkgdG8gdXNlIGFzIGJpbmRpbmcga2V5LiBUaGlzIHNob3VsZCBub3QgYmVcbiAgICogICAgY2FsbGVkIGZyb20gb3V0c2lkZSB0aGUgY2xhc3MuXG4gICAqIEByZXR1cm4ge2FueX0gVGhlIGJvdW5kIHZhbHVlLCBvciB1bmRlZmluZWQgaWYgdGhlIHZhbHVlIGNhbm5vdCBiZSBmb3VuZCwgb3IgaWYgdGhlIGtleSBoYXNcbiAgICogICAgY29sbGlzaW9uIGJ1dCBjb2xsaXNpb24gY2Fubm90IGJlIHJlc29sdmVkLlxuICAgKi9cbiAgZ2V0KGtleSwgZGVwdGggPSAwKSB7XG4gICAgbGV0IHNlZ21lbnRzID0ga2V5LnNwbGl0KFNFUEFSQVRPUik7XG4gICAgbGV0IGJpbmRpbmdLZXkgPSBzZWdtZW50c1tzZWdtZW50cy5sZW5ndGggLSAxIC0gZGVwdGhdO1xuXG4gICAgaWYgKGJpbmRpbmdLZXkgPT09IHVuZGVmaW5lZCkge1xuICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICB9XG5cbiAgICBpZiAoIXRoaXNbX192YWx1ZXNfX10uaGFzKGJpbmRpbmdLZXkpKSB7XG4gICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgIH1cblxuICAgIGxldCB2YWx1ZSA9IHRoaXNbX192YWx1ZXNfX10uZ2V0KGJpbmRpbmdLZXkpO1xuICAgIGlmICh2YWx1ZSBpbnN0YW5jZW9mIEJpbmRpbmdUcmVlKSB7XG4gICAgICByZXR1cm4gdmFsdWUuZ2V0KGtleSwgZGVwdGggKyAxKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIHZhbHVlLnZhbHVlO1xuICAgIH1cbiAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBCaW5kaW5nVHJlZTsiLCJpbXBvcnQgQmluZGluZ1RyZWUgZnJvbSAnLi9iaW5kaW5ndHJlZSc7XG5cbmNvbnN0IEdsb2JhbHMgPSB7XG4gIGdldDogU3ltYm9sKCdnZXQnKSxcblxuICBnZXRHbG9iYWwoa2V5LCBzY29wZSkge1xuICAgIGxldCBnbG9iYWxQcm92aWRlciA9IHRoaXMuYmluZGluZ3MuZ2V0KGtleSk7XG4gICAgaWYgKGdsb2JhbFByb3ZpZGVyID09PSB1bmRlZmluZWQpIHtcbiAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBnbG9iYWxQcm92aWRlci5yZXNvbHZlKHNjb3BlKTtcbiAgICB9XG4gIH0sXG5cbiAgYmluZGluZ3M6IG5ldyBCaW5kaW5nVHJlZSgpXG59O1xuXG5leHBvcnQgZGVmYXVsdCBHbG9iYWxzOyIsImltcG9ydCBCaW5kaW5nVHJlZSBmcm9tICcuL2JpbmRpbmd0cmVlJztcbmltcG9ydCBHbG9iYWxzIGZyb20gJy4vZ2xvYmFscyc7XG5pbXBvcnQgUHJvdmlkZXIgZnJvbSAnLi9wcm92aWRlcic7XG5pbXBvcnQgU2NvcGUgZnJvbSAnLi9zY29wZSc7XG5cbigod2luZG93KSA9PiB7XG4gIHdpbmRvd1snREknXSA9IG5ldyBTY29wZSgpO1xuXG4gIHdpbmRvd1snREknXVsnQmluZGluZ1RyZWUnXSA9IEJpbmRpbmdUcmVlO1xuICB3aW5kb3dbJ0RJJ11bJ1Byb3ZpZGVyJ10gPSBQcm92aWRlcjtcbiAgd2luZG93WydESSddWydTY29wZSddID0gU2NvcGU7XG4gIHdpbmRvd1snREknXVsnYmluZGluZ3MnXSA9IEdsb2JhbHMuYmluZGluZ3M7XG59KSh3aW5kb3cpOyIsImltcG9ydCBHbG9iYWxzIGZyb20gJy4vZ2xvYmFscyc7XG5cbmNvbnN0IF9fZ2V0X18gPSBHbG9iYWxzLmdldDtcblxuLy8gUHJpdmF0ZSBzeW1ib2xzLlxuY29uc3QgX19mdW5jdGlvbl9fID0gU3ltYm9sKCk7XG5jb25zdCBfX2xvY2FsU2NvcGVfXyA9IFN5bWJvbCgnbG9jYWxTY29wZScpO1xuY29uc3QgX19uYW1lX18gPSBTeW1ib2woKTtcbmNvbnN0IF9fcHJlZml4X18gPSBTeW1ib2woJ3ByZWZpeCcpO1xuY29uc3QgX19rZXlzX18gPSBTeW1ib2woKTtcbmNvbnN0IF9fcmVzb2x2ZWRWYWx1ZXNfXyA9IFN5bWJvbCgpO1xuXG5jb25zdCBGTl9BUkdTID0gL15mdW5jdGlvblxccypbXlxcKF0qXFwoXFxzKihbXlxcKV0qKVxcKS9tO1xuXG5jbGFzcyBQcm92aWRlciB7XG5cbiAgLyoqXG4gICAqIEBjbGFzcyBESS5Qcm92aWRlclxuICAgKiBAY29uc3RydWN0b3JcbiAgICogQHBhcmFtIHtGdW5jdGlvbn0gZm4gVGhlIGZ1bmN0aW9uIHdob3NlIGFyZ3VtZW50cyBzaG91bGQgYmUgcmVzb2x2ZWQuIFRoZSBuYW1lcyB3aWxsIGJlIHVzZWQgYXNcbiAgICogICAgdGhlIGtleS5cbiAgICogQHBhcmFtIHtBcnJheX0ga2V5cyBBcnJheSBvZiBrZXlzIGZvciB0aGUgZ2l2ZW4gZnVuY3Rpb24ncyBhcmd1bWVudCdzIG5hbWVzLlxuICAgKiBAcGFyYW0ge0RJLlNjb3BlfSBsb2NhbFNjb3BlIFRoZSBsb2NhbCBzY29wZS4gVGhpcyB3aWxsIGJlIHByaW9yaXRpemVkIHdoZW4gY2hlY2tpbmcgZm9yIGJvdW5kXG4gICAqICAgIHZhbHVlcy5cbiAgICogQHBhcmFtIHtzdHJpbmd9IFtuYW1lPW51bGxdIFJlZmVyZW5jZSBuYW1lIG9mIHRoZSBwcm92aWRlci4gVGhpcyBpcyB1c2VkIGZvciBkZXRlY3RpbmcgY3ljbGljXG4gICAqICAgIGRlcGVuZGVuY2llcy5cbiAgICovXG4gIGNvbnN0cnVjdG9yKGZuLCBrZXlzLCBsb2NhbFNjb3BlLCBuYW1lID0gbnVsbCkge1xuICAgIHRoaXNbX19mdW5jdGlvbl9fXSA9IGZuO1xuICAgIHRoaXNbX19rZXlzX19dID0ga2V5cztcbiAgICB0aGlzW19fbG9jYWxTY29wZV9fXSA9IGxvY2FsU2NvcGU7XG4gICAgdGhpc1tfX25hbWVfX10gPSBuYW1lO1xuICAgIHRoaXNbX19yZXNvbHZlZFZhbHVlc19fXSA9IG5ldyBNYXAoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXNvbHZlcyB0aGUgcHJvdmlkZXIuIFJlc29sdmVkIHZhbHVlcyBhcmUgY2FjaGVkIHBlciBzY29wZS5cbiAgICpcbiAgICogQG1ldGhvZCByZXNvbHZlXG4gICAqIEBwYXJhbSB7REkuU2NvcGV9IHNjb3BlIFRoZSBzY29wZSB0byByZXNvbHZlIHRoZSB2YWx1ZSBpbi5cbiAgICogQHJldHVybiB7T2JqZWN0fSBUaGUgcmVzb2x2ZWQgdmFsdWUgZm9yIHRoZSBnaXZlbiBzY29wZS5cbiAgICovXG4gIHJlc29sdmUoc2NvcGUpIHtcbiAgICBpZiAoIXRoaXNbX19yZXNvbHZlZFZhbHVlc19fXS5oYXMoc2NvcGUpKSB7XG4gICAgICBsZXQgYXJnc1N0cmluZyA9IHRoaXNbX19mdW5jdGlvbl9fXS50b1N0cmluZygpLm1hdGNoKEZOX0FSR1MpWzFdO1xuICAgICAgbGV0IGFyZ3MgPSBhcmdzU3RyaW5nID8gYXJnc1N0cmluZy5zcGxpdCgnLCcpIDogW107XG5cbiAgICAgIGxldCByZXNvbHZlZEFyZ3MgPSB0aGlzW19fa2V5c19fXS5tYXAoKGtleSwgaSkgPT4ge1xuXG4gICAgICAgIC8vIENoZWNrIGlmIHRoZSBrZXkgaXMgb3B0aW9uYWwuXG4gICAgICAgIGxldCBvcHRpb25hbCA9IGtleVtrZXkubGVuZ3RoIC0gMV0gPT09ICc/JztcbiAgICAgICAgaWYgKG9wdGlvbmFsKSB7XG4gICAgICAgICAga2V5ID0ga2V5LnN1YnN0cmluZygwLCBrZXkubGVuZ3RoIC0gMSk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBDaGVjayBpZiB0aGUga2V5IGlzIHJvb3Qga2V5LlxuICAgICAgICBsZXQgaXNSb290ID0ga2V5WzBdID09PSAnLyc7XG4gICAgICAgIGlmIChpc1Jvb3QpIHtcbiAgICAgICAgICBrZXkgPSBrZXkuc3Vic3RyaW5nKDEpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gTm93IHJlcGxhY2UgYW55ID0gaW4gdGhlIGtleSB3aXRoIHRoZSBhcmd1bWVudCBuYW1lLlxuICAgICAgICBrZXkgPSBrZXkucmVwbGFjZSgnPScsIGFyZ3NbaV0gPyBhcmdzW2ldLnRyaW0oKSA6ICcnKTtcblxuICAgICAgICAvLyBUT0RPKGdzKTogSGFuZGxlIGN5Y2xpYyBkZXBlbmRlbmN5LlxuICAgICAgICBsZXQgdmFsdWU7XG5cbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAvLyBDaGVjayB0aGUgbG9jYWwgc2NvcGUgZmlyc3QuXG4gICAgICAgICAgdmFsdWUgPSB0aGlzW19fbG9jYWxTY29wZV9fXVtfX2dldF9fXShrZXksIHNjb3BlKTtcblxuICAgICAgICAgIGlmICh2YWx1ZSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAvLyBJZiB2YWx1ZSBjYW5ub3QgYmUgcmVzb2x2ZWQgaW4gdGhlIGxvY2FsIHNjb3BlLCBjaGVjayB0aGUgZ2l2ZW4gc2NvcGUuXG4gICAgICAgICAgICB2YWx1ZSA9IHNjb3BlW19fZ2V0X19dKGtleSwgc2NvcGUpO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGlmICh2YWx1ZSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAvLyBJZiB2YWx1ZSBjYW5ub3QgYmUgcmVzb2x2ZWQgaW4gdGhlIGxvY2FsIHNjb3BlLCBjaGVjayB0aGUgZ2xvYmFsIGJpbmRpbmdzLlxuICAgICAgICAgICAgdmFsdWUgPSBHbG9iYWxzLmdldEdsb2JhbChrZXksIHNjb3BlKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAvLyBUT0RPKGdzKTogTWFrZSBhIHNoYXJlZCBtZXRob2QuXG4gICAgICAgICAgaWYgKHRoaXNbX19uYW1lX19dKSB7XG4gICAgICAgICAgICB0aHJvdyBgJHtlfVxcblxcdHdoaWxlIHByb3ZpZGluZyAke3RoaXNbX19uYW1lX19dfWA7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRocm93IGAke2V9XFxuXFx0d2hpbGUgcnVubmluZyBleHByZXNzaW9uYDtcbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodmFsdWUgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgIGlmIChvcHRpb25hbCkge1xuICAgICAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICAgICAgICB9IGVsc2UgaWYgKHRoaXNbX19uYW1lX19dKSB7XG4gICAgICAgICAgICB0aHJvdyBgQ2Fubm90IGZpbmQgJHtrZXl9IHdoaWxlIHByb3ZpZGluZyAke3RoaXNbX19uYW1lX19dfWA7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRocm93IGBDYW5ub3QgZmluZCAke2tleX0gd2hpbGUgcnVubmluZyBleHByZXNzaW9uYDtcbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdmFsdWU7XG4gICAgICB9KTtcblxuICAgICAgbGV0IHZhbHVlO1xuXG4gICAgICB0cnkge1xuICAgICAgICB2YWx1ZSA9IHRoaXNbX19mdW5jdGlvbl9fXS5hcHBseShudWxsLCByZXNvbHZlZEFyZ3MpO1xuICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICBpZiAodGhpc1tfX25hbWVfX10pIHtcbiAgICAgICAgICB0aHJvdyBgVW5jYXVnaHQgZXhjZXB0aW9uICR7ZX1cXG5cXHR3aGlsZSBydW5uaW5nIHByb3ZpZGVyICR7dGhpc1tfX25hbWVfX119YDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB0aHJvdyBgVW5jYXVnaHQgZXhjZXB0aW9uICR7ZX1cXG5cXHR3aGlsZSBydW5uaW5nIGV4cHJlc3Npb25gO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGlmICh2YWx1ZSA9PT0gdW5kZWZpbmVkICYmIHRoaXNbX19uYW1lX19dKSB7XG4gICAgICAgIGNvbnNvbGUud2FybihgVmFsdWUgb2YgJHt0aGlzW19fbmFtZV9fXX0gaXMgdW5kZWZpbmVkYCk7XG4gICAgICB9XG5cbiAgICAgIHRoaXNbX19yZXNvbHZlZFZhbHVlc19fXS5zZXQoc2NvcGUsIHZhbHVlKTtcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpc1tfX3Jlc29sdmVkVmFsdWVzX19dLmdldChzY29wZSk7XG4gIH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgUHJvdmlkZXI7IiwiaW1wb3J0IEJpbmRpbmdUcmVlIGZyb20gJy4vYmluZGluZ3RyZWUnO1xuaW1wb3J0IFByb3ZpZGVyIGZyb20gJy4vcHJvdmlkZXInO1xuaW1wb3J0IEdsb2JhbHMgZnJvbSAnLi9nbG9iYWxzJztcblxuXG4vLyBQcml2YXRlIHN5bWJvbHMuXG5jb25zdCBfX2xvY2FsQmluZGluZ3NfXyA9IFN5bWJvbCgnbG9jYWxCaW5kaW5ncycpO1xuY29uc3QgX19wYXJlbnRTY29wZV9fID0gU3ltYm9sKCdwYXJlbnRTY29wZScpO1xuY29uc3QgX19wcmVmaXhfXyA9IFN5bWJvbCgncHJlZml4Jyk7XG5cbmNvbnN0IF9fY3JlYXRlUHJvdmlkZXJfXyA9IFN5bWJvbCgpO1xuXG5jb25zdCBfX2dldF9fID0gR2xvYmFscy5nZXQ7XG5jb25zdCBiaW5kaW5ncyA9IEdsb2JhbHMuYmluZGluZ3M7XG5cbmNsYXNzIFNjb3BlIHtcbiAgLyoqXG4gICAqIFNjb3BlIGNvbnRhaW5pbmcgbG9jYWwgYmluZGluZ3MuXG4gICAqXG4gICAqIEBjbGFzcyBESS5TY29wZVxuICAgKiBAY29uc3RydWN0b3JcbiAgICogQHBhcmFtIHtESS5TY29wZX0gW3BhcmVudFNjb3BlPW51bGxdIFRoZSBwYXJlbnQgc2NvcGUuXG4gICAqL1xuICBjb25zdHJ1Y3RvcihwYXJlbnRTY29wZSA9IG51bGwsIHByZWZpeCA9ICcnKSB7XG4gICAgdGhpc1tfX2xvY2FsQmluZGluZ3NfX10gPSBuZXcgQmluZGluZ1RyZWUoKTtcbiAgICB0aGlzW19fcGFyZW50U2NvcGVfX10gPSBwYXJlbnRTY29wZTtcbiAgICB0aGlzW19fcHJlZml4X19dID0gcHJlZml4O1xuICB9XG5cbiAgW19fY3JlYXRlUHJvdmlkZXJfX10odmFsdWUsIG5hbWUgPSBudWxsKSB7XG4gICAgbGV0IGZuID0gdmFsdWUuc3BsaWNlKHZhbHVlLmxlbmd0aCAtIDEpWzBdO1xuICAgIGxldCBwcmVmaXhlcyA9IHZhbHVlLm1hcChwcmVmaXggPT4ge1xuICAgICAgcmV0dXJuIFt0aGlzW19fcHJlZml4X19dLCBwcmVmaXhdLmZpbHRlcihpID0+ICEhaSkuam9pbignLicpO1xuICAgIH0pO1xuXG4gICAgcmV0dXJuIG5ldyBQcm92aWRlcihmbiwgcHJlZml4ZXMsIHRoaXMsIG5hbWUpO1xuICB9XG5cbiAgW19fZ2V0X19dKGtleSwgc2NvcGUpIHtcbiAgICBsZXQgcHJvdmlkZXIgPSB0aGlzW19fbG9jYWxCaW5kaW5nc19fXS5nZXQoa2V5KTtcbiAgICBpZiAocHJvdmlkZXIgPT09IHVuZGVmaW5lZCkge1xuICAgICAgaWYgKHRoaXNbX19wYXJlbnRTY29wZV9fXSkge1xuICAgICAgICByZXR1cm4gdGhpc1tfX3BhcmVudFNjb3BlX19dW19fZ2V0X19dKGtleSwgc2NvcGUpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIHByb3ZpZGVyLnJlc29sdmUoc2NvcGUpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgbmV3IGNoaWxkIHNjb3BlIHdpdGggdGhlIGdpdmVuIHZhbHVlIGJvdW5kIHRvIHRoZSBnaXZlbiBrZXkgaW4gaXRzIGxvY2FsIGJpbmRpbmcuXG4gICAqXG4gICAqIEBtZXRob2Qgd2l0aFxuICAgKiBAcGFyYW0ge3N0cmluZ30ga2V5IFRoZSBrZXkgdG8gYm91bmQgdGhlIHZhbHVlIHRvLlxuICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBmbiBUaGUgZnVuY3Rpb24gdG8gcnVuLiBUaGUgZnVuY3Rpb24ncyBhcmd1bWVudHMgd2lsbCBiZSBib3VuZCBiYXNlZCBvblxuICAgKiAgICB0aGVpciBuYW1lcy5cbiAgICogQHJldHVybiB7REkuU2NvcGV9IFRoZSBuZXdseSBjcmVhdGVkIGNoaWxkIHNjb3BlLlxuICAgKi9cbiAgd2l0aChrZXksIHZhbHVlKSB7XG4gICAgbGV0IGNoaWxkU2NvcGUgPSBuZXcgU2NvcGUodGhpcywgdGhpc1tfX3ByZWZpeF9fXSk7XG4gICAgY2hpbGRTY29wZVtfX2xvY2FsQmluZGluZ3NfX11cbiAgICAgICAgLmFkZChhcHBlbmQodGhpc1tfX3ByZWZpeF9fXSwga2V5KSwgdGhpc1tfX2NyZWF0ZVByb3ZpZGVyX19dKHZhbHVlLCBrZXkpKTtcbiAgICByZXR1cm4gY2hpbGRTY29wZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgbmV3IGNoaWxkIHNjb3BlIHdpdGggdGhlIGdpdmVuIHZhbHVlIGJvdW5kIHRvIHRoZSBnaXZlbiBrZXkgaW4gaXRzIGxvY2FsIGJpbmRpbmcuXG4gICAqIFRoaXMgaXMgc2ltaWxhciB0byB7eyNjcm9zc0xpbmsgXCJESS5TY29wZS93aXRoXCJ9fXt7L2Nyb3NzTGlua319LCBidXQgdGhlIHZhbHVlIGlzIGEgY29uc3RhbnQuXG4gICAqXG4gICAqIEBtZXRob2QgY29uc3RhbnRcbiAgICogQHBhcmFtIHtzdHJpbmd9IGtleSBUaGUga2V5IHRvIGJvdW5kIHRoZSB2YWx1ZSB0by5cbiAgICogQHBhcmFtIHtPYmplY3R9IHZhbHVlIFRoZSBvYmplY3QgdG8gYmluZCB0byB0aGUgZ2l2ZW4ga2V5LlxuICAgKiBAcmV0dXJuIHtESS5TY29wZX0gVGhlIG5ld2x5IGNyZWF0ZWQgY2hpbGQgc2NvcGUuXG4gICAqL1xuICBjb25zdGFudChrZXksIHZhbHVlKSB7XG4gICAgcmV0dXJuIHRoaXMud2l0aChrZXksIFsoKSA9PiB2YWx1ZV0pO1xuICB9XG5cbiAgLyoqXG4gICAqIEdsb2JhbGx5IGJpbmRzIHRoZSBnaXZlbiB2YWx1ZSB0byB0aGUgZ2l2ZW4ga2V5LlxuICAgKlxuICAgKiBAbWV0aG9kIGJpbmRcbiAgICogQHBhcmFtIHtzdHJpbmd9IGtleSBUaGUga2V5IHRvIGJvdW5kIHRoZSB2YWx1ZSB0by5cbiAgICogQHBhcmFtIHtGdW5jdGlvbn0gZm4gVGhlIGZ1bmN0aW9uIHRvIHJ1bi4gVGhlIGZ1bmN0aW9uJ3MgYXJndW1lbnRzIHdpbGwgYmUgYm91bmQgYmFzZWQgb25cbiAgICogICAgdGhlaXIgbmFtZXMuXG4gICAqL1xuICBiaW5kKGtleSwgdmFsdWUpIHtcbiAgICBiaW5kaW5ncy5hZGQoYXBwZW5kKHRoaXNbX19wcmVmaXhfX10sIGtleSksIHRoaXNbX19jcmVhdGVQcm92aWRlcl9fXSh2YWx1ZSwga2V5KSk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyB0aGUgcHJvdmlkZXIgYm91bmQgdG8gdGhlIGdpdmVuIGtleSBhbmQgcmVzb2x2ZSBpdCBpbiB0aGlzIHNjb3BlLiBUaGlzIHdpbGwgZmlyc3QgY2hlY2tcbiAgICogZm9yIHRoZSBsb2NhbCBiaW5kaW5ncywgdGhlbiBpdHMgYW5jZXN0b3JzLiBJZiBubyBiaW5kaW5nIGlzIGZvdW5kIGluIHRoZSBhbmNlc3RyYWwgcGF0aCwgdGhpc1xuICAgKiB3aWxsIGNoZWNrIGZvciB0aGUgZ2xvYmFsIGJpbmRpbmdzLlxuICAgKlxuICAgKiBAbWV0aG9kIGdldFxuICAgKiBAcGFyYW0ge3N0cmluZ30ga2V5IEtleSB3aG9zZSBib3VuZCB2YWx1ZSBzaG91bGQgYmUgcmV0dXJuZWQuXG4gICAqIEByZXR1cm4ge2FueX0gVGhlIHZhbHVlIGJvdW5kIHRvIHRoZSBnaXZlbiBrZXksIG9yIHVuZGVmaW5lZCBpZiBubyB2YWx1ZXMgY2FuIGJlIGZvdW5kLlxuICAgKi9cbiAgZ2V0KGtleSkge1xuICAgIGxldCB2YWx1ZSA9IHRoaXNbX19nZXRfX10oYXBwZW5kKHRoaXNbX19wcmVmaXhfX10sIGtleSkpO1xuICAgIGlmICh2YWx1ZSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICByZXR1cm4gR2xvYmFscy5nZXRHbG9iYWwoa2V5LCB0aGlzKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIHZhbHVlO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBSdW5zIHRoZSBnaXZlbiBmdW5jdGlvbiBhZnRlciBpbmplY3RpbmcgYW55IGRlcGVuZGVuY2llcy5cbiAgICpcbiAgICogQG1ldGhvZCBydW5cbiAgICogQHBhcmFtIHtGdW5jdGlvbn0gZm4gVGhlIGZ1bmN0aW9uIHRvIHJ1bi4gVGhlIGZ1bmN0aW9uJ3MgYXJndW1lbnRzIHdpbGwgYmUgYm91bmQgYmFzZWQgb25cbiAgICogICAgdGhlaXIgbmFtZXMuXG4gICAqL1xuICBydW4oZm4pIHtcbiAgICB0aGlzW19fY3JlYXRlUHJvdmlkZXJfX10oZm4pLnJlc29sdmUodGhpcyk7XG4gIH1cblxuICAvKipcbiAgICogUHJlZml4IGFueSBrZXlzIGdpdmVuIHRvIHRoaXMgc2NvcGUgd2l0aCB0aGUgZ2l2ZW4gcHJlZml4LlxuICAgKlxuICAgKiBAbWV0aG9kIHByZWZpeFxuICAgKiBAcGFyYW0ge3N0cmluZ30gcHJlZml4IFRoZSBwcmVmaXggdG8gYWRkLlxuICAgKiBAcmV0dXJuIHtESS5TY29wZX0gVGhlIG5ld2x5IGNyZWF0ZWQgY2hpbGQgc2NvcGUgd2l0aCB0aGUgZ2l2ZW4gcHJlZml4LlxuICAgKi9cbiAgcHJlZml4KHByZWZpeCkge1xuICAgIHJldHVybiBuZXcgU2NvcGUodGhpcywgYXBwZW5kKHByZWZpeCwgdGhpc1tfX3ByZWZpeF9fXSkpO1xuICB9XG59XG5cbmZ1bmN0aW9uIGFwcGVuZChsLCByKSB7XG4gIHJldHVybiBbbCwgcl0uZmlsdGVyKGkgPT4gISFpKS5qb2luKCcuJyk7XG59XG5cbmV4cG9ydCBkZWZhdWx0IFNjb3BlOyJdfQ==
