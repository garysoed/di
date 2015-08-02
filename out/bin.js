(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
"use strict";

var _createClass = (function () { function defineProperties(target, props) { for (var key in props) { var prop = props[key]; prop.configurable = true; if (prop.value) prop.writable = true; } Object.defineProperties(target, props); } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };

var __binding__ = Symbol();
var __cachedValue__ = Symbol();
var __key__ = Symbol();
var __provider__ = Symbol();
var __scope__ = Symbol();

var Binding = (function () {
  function Binding(key, fn, scope) {
    _classCallCheck(this, Binding);

    this[__key__] = key;
    this[__provider__] = fn;
    this[__scope__] = scope;
  }

  _createClass(Binding, {
    resolve: {
      value: function resolve(runContext) {
        var _this = this;

        var searchChain = arguments[1] === undefined ? [] : arguments[1];

        if (!runContext.has(this[__key__])) {
          (function () {
            var optional = function (key) {
              var binding = _this[__scope__].findBinding(key);

              // Check if the key is already in the search chain.
              if (searchChain.indexOf(key) >= 0) {
                throw new Error("Cyclic dependency:\n" + searchChain.join(" -> ") + " -> " + key);
              }

              if (binding === undefined) {
                return undefined;
              } else {
                return binding.resolve(runContext, searchChain.concat([key]));
              }
            };

            var require = function (key) {
              var value = optional(key);
              if (value === undefined) {
                throw new Error("Cannot find " + key + ":\n" + searchChain.join(" -> ") + " -> " + key);
              }
              return value;
            };

            runContext.set(_this[__key__], _this[__provider__](require, optional));
          })();
        }

        return runContext.get(this[__key__]);
      }
    },
    provider: {
      get: function () {
        return this[__provider__];
      }
    }
  });

  return Binding;
})();

module.exports = Binding;

},{}],2:[function(require,module,exports){
"use strict";

var _interopRequire = function (obj) { return obj && obj.__esModule ? obj["default"] : obj; };

var Scope = _interopRequire(require("./scope"));

var Binding = _interopRequire(require("./binding"));

(function (window) {
  window.DIJS = new Scope();
  window.DIJS.Scope = Scope;
  window.DIJS.Scope.Binding = Binding;
})(window);

},{"./binding":1,"./scope":3}],3:[function(require,module,exports){
"use strict";

var _interopRequire = function (obj) { return obj && obj.__esModule ? obj["default"] : obj; };

var _slicedToArray = function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { var _arr = []; for (var _iterator = arr[Symbol.iterator](), _step; !(_step = _iterator.next()).done;) { _arr.push(_step.value); if (i && _arr.length === i) break; } return _arr; } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } };

var _createComputedClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var prop = props[i]; prop.configurable = true; if (prop.value) prop.writable = true; Object.defineProperty(target, prop.key, prop); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };

var Binding = _interopRequire(require("./binding"));

// Private symbols.
var __localBindings__ = Symbol("localBindings");
var __parentScope__ = Symbol("parentScope");
var __prefix__ = Symbol("prefix");
var __rootScope__ = Symbol("rootScope");

var __addBinding__ = Symbol("registerProvider");
var __findProvider__ = Symbol("findProvider");

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
    var rootScope = arguments[1] === undefined ? this : arguments[1];

    _classCallCheck(this, Scope);

    this[__localBindings__] = new Map();
    this[__parentScope__] = parentScope;
    this[__rootScope__] = rootScope;
  }

  _createComputedClass(Scope, [{
    key: __addBinding__,
    value: function (key, binding) {
      if (this[__localBindings__].has(key)) {
        throw new Error("" + key + " is already bound");
      }
      this[__localBindings__].set(key, binding);
    }
  }, {
    key: "findBinding",
    value: function findBinding(key) {
      // Checks the local binding.
      var binding = this[__localBindings__].get(key);
      if (binding === undefined) {
        if (this[__parentScope__]) {
          return this[__parentScope__].findBinding(key);
        } else {
          return undefined;
        }
      } else {
        return binding;
      }
    }
  }, {
    key: "with",

    /**
     * Creates a new child scope with the given value bound to the given key in its local binding.
     *
     * TODO(gs)
     *
     * @method with
     * @param {string} key The key to bound the value to.
     * @param {Object} keys Object with mapping of variable name to the bound name.
     * @param {Function} fn The provider function to run.
     * @return {DI.Scope} The newly created child scope.
     */
    value: function _with(key, fn) {
      var binding = new Binding(key, fn, this);
      var childScope = new Scope(this, this[__rootScope__]);
      childScope[__addBinding__](key, binding);
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
     * Binds the given value to the given key. The execution scope of the provider function is still
     * this scope.
     *
     * TODO(gs)
     *
     * @method bind
     * @param {string} key The key to bound the value to.
     * @param {Object} keys Object with mapping of variable name to the bound name.
     * @param {Function} fn The provider function to run.
     */
    value: function bind(key, fn) {
      var binding = new Binding(key, fn, this);
      this[__rootScope__][__addBinding__](key, binding);
      return this;
    }
  }, {
    key: "run",

    /**
     * Runs the given function after injecting any dependencies.
     *
     * TODO(gs)
     *
     * @method run
     * @param {Function} fn The function to run.
     */
    value: function run(fn) {
      var runBinding = new Binding(null, fn, this);

      // Resolves all the bindings in the current scope.
      var resolvedValues = new Map();
      var _iteratorNormalCompletion = true;
      var _didIteratorError = false;
      var _iteratorError = undefined;

      try {
        for (var _iterator = this[__localBindings__][Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
          var _step$value = _slicedToArray(_step.value, 2);

          var key = _step$value[0];
          var binding = _step$value[1];

          binding.resolve(resolvedValues);
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

      return runBinding.resolve(resolvedValues);
    }
  }, {
    key: "reset",
    value: function reset() {
      this[__localBindings__].clear();
    }
  }]);

  return Scope;
})();

module.exports = Scope;

},{"./binding":1}]},{},[2])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIvVXNlcnMvZ3NvZWQvcHJvai9kaS1qcy9zcmMvYmluZGluZy5qcyIsIi9Vc2Vycy9nc29lZC9wcm9qL2RpLWpzL3NyYy9pbmRleC5qcyIsIi9Vc2Vycy9nc29lZC9wcm9qL2RpLWpzL3NyYy9zY29wZS5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7OztBQ0FBLElBQU0sV0FBVyxHQUFHLE1BQU0sRUFBRSxDQUFDO0FBQzdCLElBQU0sZUFBZSxHQUFHLE1BQU0sRUFBRSxDQUFDO0FBQ2pDLElBQU0sT0FBTyxHQUFHLE1BQU0sRUFBRSxDQUFDO0FBQ3pCLElBQU0sWUFBWSxHQUFHLE1BQU0sRUFBRSxDQUFDO0FBQzlCLElBQU0sU0FBUyxHQUFHLE1BQU0sRUFBRSxDQUFDOztJQUVyQixPQUFPO0FBQ0EsV0FEUCxPQUFPLENBQ0MsR0FBRyxFQUFFLEVBQUUsRUFBRSxLQUFLLEVBQUU7MEJBRHhCLE9BQU87O0FBRVQsUUFBSSxDQUFDLE9BQU8sQ0FBQyxHQUFHLEdBQUcsQ0FBQztBQUNwQixRQUFJLENBQUMsWUFBWSxDQUFDLEdBQUcsRUFBRSxDQUFDO0FBQ3hCLFFBQUksQ0FBQyxTQUFTLENBQUMsR0FBRyxLQUFLLENBQUM7R0FDekI7O2VBTEcsT0FBTztBQU9YLFdBQU87YUFBQSxpQkFBQyxVQUFVLEVBQW9COzs7WUFBbEIsV0FBVyxnQ0FBRyxFQUFFOztBQUNsQyxZQUFJLENBQUMsVUFBVSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUMsRUFBRTs7QUFDbEMsZ0JBQUksUUFBUSxHQUFHLFVBQUEsR0FBRyxFQUFJO0FBQ3BCLGtCQUFJLE9BQU8sR0FBRyxNQUFLLFNBQVMsQ0FBQyxDQUFDLFdBQVcsQ0FBQyxHQUFHLENBQUMsQ0FBQzs7O0FBRy9DLGtCQUFJLFdBQVcsQ0FBQyxPQUFPLENBQUMsR0FB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Ozs7Ozs7Ozs7OztXQVVFLGFBQUMsRUFBRSxFQUFFO0FBQ04sVUFBSSxVQUFVLEdBQUcsSUFBSSxPQUFPLENBQUMsSUFBSSxFQUFFLEVBQUUsRUFBRSxJQUFJLENBQUMsQ0FBQzs7O0FBRzdDLFVBQUksY0FBYyxHQUFHLElBQUksR0FBRyxFQUFFLENBQUM7Ozs7OztBQUMvQiw2QkFBMkIsSUFBSSxDQUFDLGlCQUFpQixDQUFDOzs7Y0FBeEMsR0FBRztjQUFFLE9BQU87O0FBQ3BCLGlCQUFPLENBQUMsT0FBTyxDQUFDLGNBQWMsQ0FBQyxDQUFDO1NBQ2pDOzs7Ozs7Ozs7Ozs7Ozs7O0FBQ0QsYUFBTyxVQUFVLENBQUMsT0FBTyxDQUFDLGNBQWMsQ0FBQyxDQUFDO0tBQzNDOzs7V0FFSSxpQkFBRztBQUNOLFVBQUksQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDLEtBQUssRUFBRSxDQUFDO0tBQ2pDOzs7U0F4R0csS0FBSzs7O2lCQTJHSSxLQUFLIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsImNvbnN0IF9fYmluZGluZ19fID0gU3ltYm9sKCk7XG5jb25zdCBfX2NhY2hlZFZhbHVlX18gPSBTeW1ib2woKTtcbmNvbnN0IF9fa2V5X18gPSBTeW1ib2woKTtcbmNvbnN0IF9fcHJvdmlkZXJfXyA9IFN5bWJvbCgpO1xuY29uc3QgX19zY29wZV9fID0gU3ltYm9sKCk7XG5cbmNsYXNzIEJpbmRpbmcge1xuICBjb25zdHJ1Y3RvcihrZXksIGZuLCBzY29wZSkge1xuICAgIHRoaXNbX19rZXlfX10gPSBrZXk7XG4gICAgdGhpc1tfX3Byb3ZpZGVyX19dID0gZm47XG4gICAgdGhpc1tfX3Njb3BlX19dID0gc2NvcGU7XG4gIH1cblxuICByZXNvbHZlKHJ1bkNvbnRleHQsIHNlYXJjaENoYWluID0gW10pIHtcbiAgICBpZiAoIXJ1bkNvbnRleHQuaGFzKHRoaXNbX19rZXlfX10pKSB7XG4gICAgICBsZXQgb3B0aW9uYWwgPSBrZXkgPT4ge1xuICAgICAgICBsZXQgYmluZGluZyA9IHRoaXNbX19zY29wZV9fXS5maW5kQmluZGluZyhrZXkpO1xuXG4gICAgICAgIC8vIENoZWNrIGlmIHRoZSBrZXkgaXMgYWxyZWFkeSBpbiB0aGUgc2VhcmNoIGNoYWluLlxuICAgICAgICBpZiAoc2VhcmNoQ2hhaW4uaW5kZXhPZihrZXkpID49IDApIHtcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYEN5Y2xpYyBkZXBlbmRlbmN5OlxcbiR7c2VhcmNoQ2hhaW4uam9pbignIC0+ICcpfSAtPiAke2tleX1gKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChiaW5kaW5nID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJldHVybiBiaW5kaW5nLnJlc29sdmUocnVuQ29udGV4dCwgc2VhcmNoQ2hhaW4uY29uY2F0KFtrZXldKSk7XG4gICAgICAgIH1cbiAgICAgIH07XG5cbiAgICAgIGxldCByZXF1aXJlID0ga2V5ID0+IHtcbiAgICAgICAgbGV0IHZhbHVlID0gb3B0aW9uYWwoa2V5KTtcbiAgICAgICAgaWYgKHZhbHVlID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYENhbm5vdCBmaW5kICR7a2V5fTpcXG4ke3NlYXJjaENoYWluLmpvaW4oJyAtPiAnKX0gLT4gJHtrZXl9YCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHZhbHVlO1xuICAgICAgfTtcblxuICAgICAgcnVuQ29udGV4dC5zZXQodGhpc1tfX2tleV9fXSwgdGhpc1tfX3Byb3ZpZGVyX19dKHJlcXVpcmUsIG9wdGlvbmFsKSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHJ1bkNvbnRleHQuZ2V0KHRoaXNbX19rZXlfX10pO1xuICB9XG5cbiAgZ2V0IHByb3ZpZGVyKCkge1xuICAgIHJldHVybiB0aGlzW19fcHJvdmlkZXJfX107XG4gIH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgQmluZGluZztcbiIsImltcG9ydCBTY29wZSBmcm9tICcuL3Njb3BlJztcbmltcG9ydCBCaW5kaW5nIGZyb20gJy4vYmluZGluZyc7XG5cbigod2luZG93KSA9PiB7XG4gIHdpbmRvd1snRElKUyddID0gbmV3IFNjb3BlKCk7XG4gIHdpbmRvd1snRElKUyddWydTY29wZSddID0gU2NvcGU7XG4gIHdpbmRvd1snRElKUyddWydTY29wZSddWydCaW5kaW5nJ10gPSBCaW5kaW5nO1xufSkod2luZG93KTtcbiIsImltcG9ydCBCaW5kaW5nIGZyb20gJy4vYmluZGluZyc7XG5cbi8vIFByaXZhdGUgc3ltYm9scy5cbmNvbnN0IF9fbG9jYWxCaW5kaW5nc19fID0gU3ltYm9sKCdsb2NhbEJpbmRpbmdzJyk7XG5jb25zdCBfX3BhcmVudFNjb3BlX18gPSBTeW1ib2woJ3BhcmVudFNjb3BlJyk7XG5jb25zdCBfX3ByZWZpeF9fID0gU3ltYm9sKCdwcmVmaXgnKTtcbmNvbnN0IF9fcm9vdFNjb3BlX18gPSBTeW1ib2woJ3Jvb3RTY29wZScpO1xuXG5jb25zdCBfX2FkZEJpbmRpbmdfXyA9IFN5bWJvbCgncmVnaXN0ZXJQcm92aWRlcicpO1xuY29uc3QgX19maW5kUHJvdmlkZXJfXyA9IFN5bWJvbCgnZmluZFByb3ZpZGVyJyk7XG5cbmNsYXNzIFNjb3BlIHtcbiAgLyoqXG4gICAqIFNjb3BlIGNvbnRhaW5pbmcgbG9jYWwgYmluZGluZ3MuXG4gICAqXG4gICAqIEBjbGFzcyBESS5TY29wZVxuICAgKiBAY29uc3RydWN0b3JcbiAgICogQHBhcmFtIHtESS5TY29wZX0gW3BhcmVudFNjb3BlPW51bGxdIFRoZSBwYXJlbnQgc2NvcGUuXG4gICAqL1xuICBjb25zdHJ1Y3RvcihwYXJlbnRTY29wZSA9IG51bGwsIHJvb3RTY29wZSA9IHRoaXMpIHtcbiAgICB0aGlzW19fbG9jYWxCaW5kaW5nc19fXSA9IG5ldyBNYXAoKTtcbiAgICB0aGlzW19fcGFyZW50U2NvcGVfX10gPSBwYXJlbnRTY29wZTtcbiAgICB0aGlzW19fcm9vdFNjb3BlX19dID0gcm9vdFNjb3BlO1xuICB9XG5cbiAgW19fYWRkQmluZGluZ19fXShrZXksIGJpbmRpbmcpIHtcbiAgICBpZiAodGhpc1tfX2xvY2FsQmluZGluZ3NfX10uaGFzKGtleSkpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihgJHtrZXl9IGlzIGFscmVhZHkgYm91bmRgKTtcbiAgICB9XG4gICAgdGhpc1tfX2xvY2FsQmluZGluZ3NfX10uc2V0KGtleSwgYmluZGluZyk7XG4gIH1cblxuICBmaW5kQmluZGluZyhrZXkpIHtcbiAgICAvLyBDaGVja3MgdGhlIGxvY2FsIGJpbmRpbmcuXG4gICAgbGV0IGJpbmRpbmcgPSB0aGlzW19fbG9jYWxCaW5kaW5nc19fXS5nZXQoa2V5KTtcbiAgICBpZiAoYmluZGluZyA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICBpZiAodGhpc1tfX3BhcmVudFNjb3BlX19dKSB7XG4gICAgICAgIHJldHVybiB0aGlzW19fcGFyZW50U2NvcGVfX10uZmluZEJpbmRpbmcoa2V5KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBiaW5kaW5nO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgbmV3IGNoaWxkIHNjb3BlIHdpdGggdGhlIGdpdmVuIHZhbHVlIGJvdW5kIHRvIHRoZSBnaXZlbiBrZXkgaW4gaXRzIGxvY2FsIGJpbmRpbmcuXG4gICAqXG4gICAqIFRPRE8oZ3MpXG4gICAqXG4gICAqIEBtZXRob2Qgd2l0aFxuICAgKiBAcGFyYW0ge3N0cmluZ30ga2V5IFRoZSBrZXkgdG8gYm91bmQgdGhlIHZhbHVlIHRvLlxuICAgKiBAcGFyYW0ge09iamVjdH0ga2V5cyBPYmplY3Qgd2l0aCBtYXBwaW5nIG9mIHZhcmlhYmxlIG5hbWUgdG8gdGhlIGJvdW5kIG5hbWUuXG4gICAqIEBwYXJhbSB7RnVuY3Rpb259IGZuIFRoZSBwcm92aWRlciBmdW5jdGlvbiB0byBydW4uXG4gICAqIEByZXR1cm4ge0RJLlNjb3BlfSBUaGUgbmV3bHkgY3JlYXRlZCBjaGlsZCBzY29wZS5cbiAgICovXG4gIHdpdGgoa2V5LCBmbikge1xuICAgIGxldCBiaW5kaW5nID0gbmV3IEJpbmRpbmcoa2V5LCBmbiwgdGhpcyk7XG4gICAgbGV0IGNoaWxkU2NvcGUgPSBuZXcgU2NvcGUodGhpcywgdGhpc1tfX3Jvb3RTY29wZV9fXSk7XG4gICAgY2hpbGRTY29wZVtfX2FkZEJpbmRpbmdfX10oa2V5LCBiaW5kaW5nKTtcbiAgICByZXR1cm4gY2hpbGRTY29wZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgbmV3IGNoaWxkIHNjb3BlIHdpdGggdGhlIGdpdmVuIHZhbHVlIGJvdW5kIHRvIHRoZSBnaXZlbiBrZXkgaW4gaXRzIGxvY2FsIGJpbmRpbmcuXG4gICAqIFRoaXMgaXMgc2ltaWxhciB0byB7eyNjcm9zc0xpbmsgXCJESS5TY29wZS93aXRoXCJ9fXt7L2Nyb3NzTGlua319LCBidXQgdGhlIHZhbHVlIGlzIGEgY29uc3RhbnQuXG4gICAqXG4gICAqIEBtZXRob2QgY29uc3RhbnRcbiAgICogQHBhcmFtIHtzdHJpbmd9IGtleSBUaGUga2V5IHRvIGJvdW5kIHRoZSB2YWx1ZSB0by5cbiAgICogQHBhcmFtIHtPYmplY3R9IHZhbHVlIFRoZSBvYmplY3QgdG8gYmluZCB0byB0aGUgZ2l2ZW4ga2V5LlxuICAgKiBAcmV0dXJuIHtESS5TY29wZX0gVGhlIG5ld2x5IGNyZWF0ZWQgY2hpbGQgc2NvcGUuXG4gICAqL1xuICBjb25zdGFudChrZXksIHZhbHVlKSB7XG4gICAgcmV0dXJuIHRoaXMud2l0aChrZXksICgpID0+IHZhbHVlKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBCaW5kcyB0aGUgZ2l2ZW4gdmFsdWUgdG8gdGhlIGdpdmVuIGtleS4gVGhlIGV4ZWN1dGlvbiBzY29wZSBvZiB0aGUgcHJvdmlkZXIgZnVuY3Rpb24gaXMgc3RpbGxcbiAgICogdGhpcyBzY29wZS5cbiAgICpcbiAgICogVE9ETyhncylcbiAgICpcbiAgICogQG1ldGhvZCBiaW5kXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBrZXkgVGhlIGtleSB0byBib3VuZCB0aGUgdmFsdWUgdG8uXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBrZXlzIE9iamVjdCB3aXRoIG1hcHBpbmcgb2YgdmFyaWFibGUgbmFtZSB0byB0aGUgYm91bmQgbmFtZS5cbiAgICogQHBhcmFtIHtGdW5jdGlvbn0gZm4gVGhlIHByb3ZpZGVyIGZ1bmN0aW9uIHRvIHJ1bi5cbiAgICovXG4gIGJpbmQoa2V5LCBmbikge1xuICAgIGxldCBiaW5kaW5nID0gbmV3IEJpbmRpbmcoa2V5LCBmbiwgdGhpcyk7XG4gICAgdGhpc1tfX3Jvb3RTY29wZV9fXVtfX2FkZEJpbmRpbmdfX10oa2V5LCBiaW5kaW5nKTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8qKlxuICAgKiBSdW5zIHRoZSBnaXZlbiBmdW5jdGlvbiBhZnRlciBpbmplY3RpbmcgYW55IGRlcGVuZGVuY2llcy5cbiAgICpcbiAgICogVE9ETyhncylcbiAgICpcbiAgICogQG1ldGhvZCBydW5cbiAgICogQHBhcmFtIHtGdW5jdGlvbn0gZm4gVGhlIGZ1bmN0aW9uIHRvIHJ1bi5cbiAgICovXG4gIHJ1bihmbikge1xuICAgIGxldCBydW5CaW5kaW5nID0gbmV3IEJpbmRpbmcobnVsbCwgZm4sIHRoaXMpO1xuXG4gICAgLy8gUmVzb2x2ZXMgYWxsIHRoZSBiaW5kaW5ncyBpbiB0aGUgY3VycmVudCBzY29wZS5cbiAgICBsZXQgcmVzb2x2ZWRWYWx1ZXMgPSBuZXcgTWFwKCk7XG4gICAgZm9yIChsZXQgW2tleSwgYmluZGluZ10gb2YgdGhpc1tfX2xvY2FsQmluZGluZ3NfX10pIHtcbiAgICAgIGJpbmRpbmcucmVzb2x2ZShyZXNvbHZlZFZhbHVlcyk7XG4gICAgfVxuICAgIHJldHVybiBydW5CaW5kaW5nLnJlc29sdmUocmVzb2x2ZWRWYWx1ZXMpO1xuICB9XG5cbiAgcmVzZXQoKSB7XG4gICAgdGhpc1tfX2xvY2FsQmluZGluZ3NfX10uY2xlYXIoKTtcbiAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBTY29wZTtcbiJdfQ==
