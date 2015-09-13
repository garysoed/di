(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
"use strict";

var _interopRequire = function (obj) { return obj && obj.__esModule ? obj["default"] : obj; };

var Scope = _interopRequire(require("./scope"));

(function (window) {
  window.DIJS = new Scope("(root)", null, /* provider */new Map());
  window.DIJS.Scope = Scope;
})(window);

},{"./scope":2}],2:[function(require,module,exports){
"use strict";

var _createComputedClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var prop = props[i]; prop.configurable = true; if (prop.value) prop.writable = true; Object.defineProperty(target, prop.key, prop); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };

var __globalBindings__ = Symbol("globalBindings");
var __name__ = Symbol("name");
var __parentScope__ = Symbol("parentScope");
var __provider__ = Symbol("provider");
var __resolve__ = Symbol("resolve");
var __searchAncestor__ = Symbol("searchAncestor");

var Scope = (function () {

  /**
   * Represents a binding scope.
   *
   * @class dijs.Scope
   * @constructor
   * @param {string} name Name of this scope.
   * @param {Function} provider Provider bound to this scope.
   * @param {Map} globalBindings Reference to the global bindings.
   * @param {dijs.Scope} [parentScope] The parent scope object. Defaults to null.
   */

  function Scope(name, provider, globalBindings) {
    var parentScope = arguments[3] === undefined ? null : arguments[3];

    _classCallCheck(this, Scope);

    this[__name__] = name;
    this[__provider__] = provider;
    this[__globalBindings__] = globalBindings;
    this[__parentScope__] = parentScope;
  }

  _createComputedClass(Scope, [{
    key: __searchAncestor__,

    /**
     * Searches the ancestor for a scope with the given name.
     *
     * @method __searchAncestor__
     * @param {string} name Name of the scope to be returned.
     * @return {dijs.Scope} Ancestor scope, or the current scope, with the given name. Or null if
     *    no scopes can be found.
     * @private
     */
    value: function (name) {
      if (this[__name__] === name) {
        return this;
      } else if (this[__parentScope__]) {
        return this[__parentScope__][__searchAncestor__](name);
      } else {
        return undefined;
      }
    }
  }, {
    key: __resolve__,

    /**
     * Runs the provider bound to the given key and return its value.
     *
     * @method resolve
     * @param {string} key Key of the bound provider to be ran.
     * @param {dijs.Scope} [runScope] The scope to run the provider in. Any local bindings to this
     *    scope will override any global bindings in the run context.
     * @param {Map} [runContext] Cache of resolved keys during this run. Defaults to empty map.
     * @param {Array} [resolveChain] Array of keys to keep track of the resolution chain. This is
     *    used for cyclic dependency. Defaults to empty array.
     * @return {Object} The value bound to the given key.
     * @private
     */
    value: function (key) {
      var runScope = arguments[1] === undefined ? this : arguments[1];
      var runContext = arguments[2] === undefined ? new Map() : arguments[2];
      var resolveChain = arguments[3] === undefined ? [] : arguments[3];

      // Check if the key is already in the search chain.
      if (resolveChain.indexOf(key) >= 0) {
        throw new Error("Cyclic dependency:\n" + resolveChain.join(" -> ") + " -> " + key);
      }

      var childSearchChain = resolveChain.concat([key]);

      // First, find the ancestral scope.
      var scope = this[__searchAncestor__](key);

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
        (function () {
          var optional = function (key) {
            return scope[__resolve__](key, runScope, runContext, childSearchChain);
          };
          var require = function (key) {
            var value = optional(key);
            if (value === undefined) {
              throw new Error("Cannot find " + key + ":\n" + resolveChain.join(" -> ") + " -> " + key);
            }
            return value;
          };

          runContext.set(scope, scope[__provider__](require, optional));
        })();
      }

      return runContext.get(scope);
    }
  }, {
    key: "with",

    /**
     * Locally binds the given provider to the given key.
     *
     * @method with
     * @param {string} key The key to bind the provider to.
     * @param {Function} provider The provider function to bind.
     * @return {dijs.Scope} The child scope with the bound provider.
     */
    value: function _with(key, provider) {
      return new Scope(key, provider, this[__globalBindings__], this);
    }
  }, {
    key: "constant",

    /**
     * Locally bind the given constant to the given key.
     *
     * @method constant
     * @param {string} key The key to bind the constant to.
     * @param {Object} value The constant to bind.
     * @return {dijs.Scope} The child scope with the bound constant.
     */
    value: function constant(key, value) {
      return this["with"](key, function () {
        return value;
      });
    }
  }, {
    key: "bind",

    /**
     * Globally binds the given provider to the given key.
     *
     * @method bind
     * @param {string} key The key to bind the provider to.
     * @param {Function} fn The provider function to bind.
     * @return {dijs.Scope} This scope for chaining.
     */
    value: function bind(key, fn) {
      var newScope = this["with"](key, fn);
      if (this[__globalBindings__].has(key)) {
        throw new Error("Key ${key} is already bound");
      }
      this[__globalBindings__].set(key, newScope);
      return this;
    }
  }, {
    key: "run",

    /**
     * Runs the given provider.
     *
     * @method run
     * @param {Function} fn The provider to run.
     * @return {Object} The value returned by the provider.
     */
    value: function run(fn) {
      return this["with"]("(run)", fn)[__resolve__]("(run)");
    }
  }, {
    key: "toString",

    /**
     * Pretty prints this scope.
     *
     * @method toString
     * @return {string} Pretty printed string of this scope.
     */
    value: function toString() {
      var parentStrPart = this[__parentScope__] ? [this[__parentScope__].toString()] : [];
      return [this[__name__]].concat(parentStrPart).join(" -> ");
    }
  }, {
    key: "reset",

    /**
     * Clears any global bindings.
     *
     * @method reset
     */
    value: function reset() {
      this[__globalBindings__].clear();
    }
  }, {
    key: "export",

    /**
     * Resolves the given key in a new run context and exports the result globally.
     *
     * @method export
     * @param {string} key Key to be resolved.
     * @param {string} exportKey `.` separated path to export the value to.
     * @return {dijs.Scope} This object for chaining.
     */
    value: function _export(key, exportKey) {
      var parts = exportKey.split(".");
      var lastPart = parts.pop();
      var exportObject = window;

      var _iteratorNormalCompletion = true;
      var _didIteratorError = false;
      var _iteratorError = undefined;

      try {
        for (var _iterator = parts[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
          var part = _step.value;

          if (!exportObject[part]) {
            exportObject[part] = {};
          }
          exportObject = exportObject[part];
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

      exportObject[lastPart] = this[__resolve__](key);
      return this;
    }
  }]);

  return Scope;
})();

module.exports = Scope;

},{}]},{},[1])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIvVXNlcnMvZ3NvZWQvcHJvai9kaS1qcy9zcmMvaW5kZXguanMiLCIvVXNlcnMvZ3NvZWQvcHJvai9kaS1qcy9zcmMvc2NvcGUuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7O0lDQU8sS0FBSywyQkFBTSxTQUFTOztBQUUzQixDQUFDLFVBQUMsTUFBTSxFQUFLO0FBQ1gsUUFBTSxLQUFRLEdBQUcsSUFBSSxLQUFLLENBQUMsUUFBUSxFQUFFLElBQUksZ0JBQWlCLElBQUksR0FBRyxFQUFFLENBQUMsQ0FBQztBQUNyRSxRQUFNLEtBQVEsTUFBUyxHQUFHLEtBQUssQ0FBQztDQUNqQyxDQUFBLENBQUUsTUFBTSxDQUFDLENBQUM7Ozs7Ozs7OztBQ0xYLElBQU0sa0JBQWtCLEdBQUcsTUFBTSxDQUFDLGdCQUFnQixDQUFDLENBQUM7QUFDcEQsSUFBTSxRQUFRLEdBQUcsTUFBTSxDQUFDLE1BQU0sQ0FBQyxDQUFDO0FBQ2hDLElBQU0sZUFBZSxHQUFHLE1BQU0sQ0FBQyxhQUFhLENBQUMsQ0FBQztBQUM5QyxJQUFNLFlBQVksR0FBRyxNQUFNLENBQUMsVUFBVSxDQUFDLENBQUM7QUFDeEMsSUFBTSxXQUFXLEdBQUcsTUFBTSxDQUFDLFNBQVMsQ0FBQyxDQUFDO0FBQ3RDLElBQU0sa0JBQWtCLEdBQUcsTUFBTSxDQUFDLGdCQUFnQixDQUFDLENBQUM7O0lBRTlDLEtBQUs7Ozs7Ozs7Ozs7Ozs7QUFZRSxXQVpQLEtBQUssQ0FZRyxJQUFJLEVBQUUsUUFBUSxFQUFFLGNBQWMsRUFBc0I7UUFBcEIsV0FBVyxnQ0FBRyxJQUFJOzswQkFaMUQsS0FBSzs7QUFhUCxRQUFJLENBQUMsUUFBUSxDQUFDLEdBQUcsSUFBSSxDQUFDO0FBQ3RCLFFBQUksQ0FBQyxZQUFZLENBQUMsR0FBRyxRQUFRLENBQUM7QUFDOUIsUUFBSSxDQUFDLGtCQUFr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QVEsR0FBRyxLQUFLLENBQUMsR0FBRyxFQUFFLENBQUM7QUFDM0IsVUFBSSxZQUFZLEdBQUcsTUFBTSxDQUFDOzs7Ozs7O0FBRTFCLDZCQUFpQixLQUFLO2NBQWIsSUFBSTs7QUFDWCxjQUFJLENBQUMsWUFBWSxDQUFDLElBQUksQ0FBQyxFQUFFO0FBQ3ZCLHdCQUFZLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRSxDQUFDO1dBQ3pCO0FBQ0Qsc0JBQVksR0FBRyxZQUFZLENBQUMsSUFBSSxDQUFDLENBQUM7U0FDbkM7Ozs7Ozs7Ozs7Ozs7Ozs7QUFFRCxrQkFBWSxDQUFDLFFBQVEsQ0FBQyxHQUFHLElBQUksQ0FBQyxXQUFXLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQztBQUNoRCxhQUFPLElBQUksQ0FBQztLQUNiOzs7U0E1TEcsS0FBSzs7O2lCQStMSSxLQUFLIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsImltcG9ydCBTY29wZSBmcm9tICcuL3Njb3BlJztcblxuKCh3aW5kb3cpID0+IHtcbiAgd2luZG93WydESUpTJ10gPSBuZXcgU2NvcGUoJyhyb290KScsIG51bGwgLyogcHJvdmlkZXIgKi8sIG5ldyBNYXAoKSk7XG4gIHdpbmRvd1snRElKUyddWydTY29wZSddID0gU2NvcGU7XG59KSh3aW5kb3cpO1xuIiwiY29uc3QgX19nbG9iYWxCaW5kaW5nc19fID0gU3ltYm9sKCdnbG9iYWxCaW5kaW5ncycpO1xuY29uc3QgX19uYW1lX18gPSBTeW1ib2woJ25hbWUnKTtcbmNvbnN0IF9fcGFyZW50U2NvcGVfXyA9IFN5bWJvbCgncGFyZW50U2NvcGUnKTtcbmNvbnN0IF9fcHJvdmlkZXJfXyA9IFN5bWJvbCgncHJvdmlkZXInKTtcbmNvbnN0IF9fcmVzb2x2ZV9fID0gU3ltYm9sKCdyZXNvbHZlJyk7XG5jb25zdCBfX3NlYXJjaEFuY2VzdG9yX18gPSBTeW1ib2woJ3NlYXJjaEFuY2VzdG9yJyk7XG5cbmNsYXNzIFNjb3BlIHtcblxuICAvKipcbiAgICogUmVwcmVzZW50cyBhIGJpbmRpbmcgc2NvcGUuXG4gICAqXG4gICAqIEBjbGFzcyBkaWpzLlNjb3BlXG4gICAqIEBjb25zdHJ1Y3RvclxuICAgKiBAcGFyYW0ge3N0cmluZ30gbmFtZSBOYW1lIG9mIHRoaXMgc2NvcGUuXG4gICAqIEBwYXJhbSB7RnVuY3Rpb259IHByb3ZpZGVyIFByb3ZpZGVyIGJvdW5kIHRvIHRoaXMgc2NvcGUuXG4gICAqIEBwYXJhbSB7TWFwfSBnbG9iYWxCaW5kaW5ncyBSZWZlcmVuY2UgdG8gdGhlIGdsb2JhbCBiaW5kaW5ncy5cbiAgICogQHBhcmFtIHtkaWpzLlNjb3BlfSBbcGFyZW50U2NvcGVdIFRoZSBwYXJlbnQgc2NvcGUgb2JqZWN0LiBEZWZhdWx0cyB0byBudWxsLlxuICAgKi9cbiAgY29uc3RydWN0b3IobmFtZSwgcHJvdmlkZXIsIGdsb2JhbEJpbmRpbmdzLCBwYXJlbnRTY29wZSA9IG51bGwpIHtcbiAgICB0aGlzW19fbmFtZV9fXSA9IG5hbWU7XG4gICAgdGhpc1tfX3Byb3ZpZGVyX19dID0gcHJvdmlkZXI7XG4gICAgdGhpc1tfX2dsb2JhbEJpbmRpbmdzX19dID0gZ2xvYmFsQmluZGluZ3M7XG4gICAgdGhpc1tfX3BhcmVudFNjb3BlX19dID0gcGFyZW50U2NvcGU7XG4gIH1cblxuICAvKipcbiAgICogU2VhcmNoZXMgdGhlIGFuY2VzdG9yIGZvciBhIHNjb3BlIHdpdGggdGhlIGdpdmVuIG5hbWUuXG4gICAqXG4gICAqIEBtZXRob2QgX19zZWFyY2hBbmNlc3Rvcl9fXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lIE5hbWUgb2YgdGhlIHNjb3BlIHRvIGJlIHJldHVybmVkLlxuICAgKiBAcmV0dXJuIHtkaWpzLlNjb3BlfSBBbmNlc3RvciBzY29wZSwgb3IgdGhlIGN1cnJlbnQgc2NvcGUsIHdpdGggdGhlIGdpdmVuIG5hbWUuIE9yIG51bGwgaWZcbiAgICogICAgbm8gc2NvcGVzIGNhbiBiZSBmb3VuZC5cbiAgICogQHByaXZhdGVcbiAgICovXG4gIFtfX3NlYXJjaEFuY2VzdG9yX19dKG5hbWUpIHtcbiAgICBpZiAodGhpc1tfX25hbWVfX10gPT09IG5hbWUpIHtcbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH0gZWxzZSBpZiAodGhpc1tfX3BhcmVudFNjb3BlX19dKXtcbiAgICAgIHJldHVybiB0aGlzW19fcGFyZW50U2NvcGVfX11bX19zZWFyY2hBbmNlc3Rvcl9fXShuYW1lKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogUnVucyB0aGUgcHJvdmlkZXIgYm91bmQgdG8gdGhlIGdpdmVuIGtleSBhbmQgcmV0dXJuIGl0cyB2YWx1ZS5cbiAgICpcbiAgICogQG1ldGhvZCByZXNvbHZlXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBrZXkgS2V5IG9mIHRoZSBib3VuZCBwcm92aWRlciB0byBiZSByYW4uXG4gICAqIEBwYXJhbSB7ZGlqcy5TY29wZX0gW3J1blNjb3BlXSBUaGUgc2NvcGUgdG8gcnVuIHRoZSBwcm92aWRlciBpbi4gQW55IGxvY2FsIGJpbmRpbmdzIHRvIHRoaXNcbiAgICogICAgc2NvcGUgd2lsbCBvdmVycmlkZSBhbnkgZ2xvYmFsIGJpbmRpbmdzIGluIHRoZSBydW4gY29udGV4dC5cbiAgICogQHBhcmFtIHtNYXB9IFtydW5Db250ZXh0XSBDYWNoZSBvZiByZXNvbHZlZCBrZXlzIGR1cmluZyB0aGlzIHJ1bi4gRGVmYXVsdHMgdG8gZW1wdHkgbWFwLlxuICAgKiBAcGFyYW0ge0FycmF5fSBbcmVzb2x2ZUNoYWluXSBBcnJheSBvZiBrZXlzIHRvIGtlZXAgdHJhY2sgb2YgdGhlIHJlc29sdXRpb24gY2hhaW4uIFRoaXMgaXNcbiAgICogICAgdXNlZCBmb3IgY3ljbGljIGRlcGVuZGVuY3kuIERlZmF1bHRzIHRvIGVtcHR5IGFycmF5LlxuICAgKiBAcmV0dXJuIHtPYmplY3R9IFRoZSB2YWx1ZSBib3VuZCB0byB0aGUgZ2l2ZW4ga2V5LlxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgW19fcmVzb2x2ZV9fXShrZXksIHJ1blNjb3BlID0gdGhpcywgcnVuQ29udGV4dCA9IG5ldyBNYXAoKSwgcmVzb2x2ZUNoYWluID0gW10pIHtcbiAgICAvLyBDaGVjayBpZiB0aGUga2V5IGlzIGFscmVhZHkgaW4gdGhlIHNlYXJjaCBjaGFpbi5cbiAgICBpZiAocmVzb2x2ZUNoYWluLmluZGV4T2Yoa2V5KSA+PSAwKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYEN5Y2xpYyBkZXBlbmRlbmN5OlxcbiR7cmVzb2x2ZUNoYWluLmpvaW4oJyAtPiAnKX0gLT4gJHtrZXl9YCk7XG4gICAgfVxuXG4gICAgbGV0IGNoaWxkU2VhcmNoQ2hhaW4gPSByZXNvbHZlQ2hhaW4uY29uY2F0KFtrZXldKTtcblxuICAgIC8vIEZpcnN0LCBmaW5kIHRoZSBhbmNlc3RyYWwgc2NvcGUuXG4gICAgbGV0IHNjb3BlID0gdGhpc1tfX3NlYXJjaEFuY2VzdG9yX19dKGtleSk7XG5cbiAgICAvLyBTZWNvbmQsIGZpbmQgaW4gdGhlIHJ1bm5pbmcgc2NvcGUuXG4gICAgaWYgKHNjb3BlID09PSB1bmRlZmluZWQpIHtcbiAgICAgIHNjb3BlID0gcnVuU2NvcGVbX19zZWFyY2hBbmNlc3Rvcl9fXShrZXkpO1xuICAgIH1cblxuICAgIC8vIEZpbmFsbHksIHNlYXJjaCBpbiB0aGUgZ2xvYmFsIGJpbmRpbmdzLlxuICAgIGlmIChzY29wZSA9PT0gdW5kZWZpbmVkICYmIHRoaXNbX19nbG9iYWxCaW5kaW5nc19fXS5oYXMoa2V5KSkge1xuICAgICAgc2NvcGUgPSB0aGlzW19fZ2xvYmFsQmluZGluZ3NfX10uZ2V0KGtleSk7XG4gICAgfVxuXG4gICAgaWYgKHNjb3BlID09PSB1bmRlZmluZWQpIHtcbiAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgfVxuXG4gICAgaWYgKCFydW5Db250ZXh0LmhhcyhzY29wZSkpIHtcbiAgICAgIGxldCBvcHRpb25hbCA9IGtleSA9PiB7XG4gICAgICAgIHJldHVybiBzY29wZVtfX3Jlc29sdmVfX10oa2V5LCBydW5TY29wZSwgcnVuQ29udGV4dCwgY2hpbGRTZWFyY2hDaGFpbik7XG4gICAgICB9O1xuICAgICAgbGV0IHJlcXVpcmUgPSBrZXkgPT4ge1xuICAgICAgICBsZXQgdmFsdWUgPSBvcHRpb25hbChrZXkpO1xuICAgICAgICBpZiAodmFsdWUgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgQ2Fubm90IGZpbmQgJHtrZXl9OlxcbiR7cmVzb2x2ZUNoYWluLmpvaW4oJyAtPiAnKX0gLT4gJHtrZXl9YCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHZhbHVlO1xuICAgICAgfTtcblxuICAgICAgcnVuQ29udGV4dC5zZXQoc2NvcGUsIHNjb3BlW19fcHJvdmlkZXJfX10ocmVxdWlyZSwgb3B0aW9uYWwpKTtcbiAgICB9XG5cbiAgICByZXR1cm4gcnVuQ29udGV4dC5nZXQoc2NvcGUpO1xuICB9XG5cbiAgLyoqXG4gICAqIExvY2FsbHkgYmluZHMgdGhlIGdpdmVuIHByb3ZpZGVyIHRvIHRoZSBnaXZlbiBrZXkuXG4gICAqXG4gICAqIEBtZXRob2Qgd2l0aFxuICAgKiBAcGFyYW0ge3N0cmluZ30ga2V5IFRoZSBrZXkgdG8gYmluZCB0aGUgcHJvdmlkZXIgdG8uXG4gICAqIEBwYXJhbSB7RnVuY3Rpb259IHByb3ZpZGVyIFRoZSBwcm92aWRlciBmdW5jdGlvbiB0byBiaW5kLlxuICAgKiBAcmV0dXJuIHtkaWpzLlNjb3BlfSBUaGUgY2hpbGQgc2NvcGUgd2l0aCB0aGUgYm91bmQgcHJvdmlkZXIuXG4gICAqL1xuICB3aXRoKGtleSwgcHJvdmlkZXIpIHtcbiAgICByZXR1cm4gbmV3IFNjb3BlKGtleSwgcHJvdmlkZXIsIHRoaXNbX19nbG9iYWxCaW5kaW5nc19fXSwgdGhpcyk7XG4gIH1cblxuICAvKipcbiAgICogTG9jYWxseSBiaW5kIHRoZSBnaXZlbiBjb25zdGFudCB0byB0aGUgZ2l2ZW4ga2V5LlxuICAgKlxuICAgKiBAbWV0aG9kIGNvbnN0YW50XG4gICAqIEBwYXJhbSB7c3RyaW5nfSBrZXkgVGhlIGtleSB0byBiaW5kIHRoZSBjb25zdGFudCB0by5cbiAgICogQHBhcmFtIHtPYmplY3R9IHZhbHVlIFRoZSBjb25zdGFudCB0byBiaW5kLlxuICAgKiBAcmV0dXJuIHtkaWpzLlNjb3BlfSBUaGUgY2hpbGQgc2NvcGUgd2l0aCB0aGUgYm91bmQgY29uc3RhbnQuXG4gICAqL1xuICBjb25zdGFudChrZXksIHZhbHVlKSB7XG4gICAgcmV0dXJuIHRoaXMud2l0aChrZXksICgpID0+IHZhbHVlKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHbG9iYWxseSBiaW5kcyB0aGUgZ2l2ZW4gcHJvdmlkZXIgdG8gdGhlIGdpdmVuIGtleS5cbiAgICpcbiAgICogQG1ldGhvZCBiaW5kXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBrZXkgVGhlIGtleSB0byBiaW5kIHRoZSBwcm92aWRlciB0by5cbiAgICogQHBhcmFtIHtGdW5jdGlvbn0gZm4gVGhlIHByb3ZpZGVyIGZ1bmN0aW9uIHRvIGJpbmQuXG4gICAqIEByZXR1cm4ge2RpanMuU2NvcGV9IFRoaXMgc2NvcGUgZm9yIGNoYWluaW5nLlxuICAgKi9cbiAgYmluZChrZXksIGZuKSB7XG4gICAgbGV0IG5ld1Njb3BlID0gdGhpcy53aXRoKGtleSwgZm4pO1xuICAgIGlmICh0aGlzW19fZ2xvYmFsQmluZGluZ3NfX10uaGFzKGtleSkpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignS2V5ICR7a2V5fSBpcyBhbHJlYWR5IGJvdW5kJyk7XG4gICAgfVxuICAgIHRoaXNbX19nbG9iYWxCaW5kaW5nc19fXS5zZXQoa2V5LCBuZXdTY29wZSk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvKipcbiAgICogUnVucyB0aGUgZ2l2ZW4gcHJvdmlkZXIuXG4gICAqXG4gICAqIEBtZXRob2QgcnVuXG4gICAqIEBwYXJhbSB7RnVuY3Rpb259IGZuIFRoZSBwcm92aWRlciB0byBydW4uXG4gICAqIEByZXR1cm4ge09iamVjdH0gVGhlIHZhbHVlIHJldHVybmVkIGJ5IHRoZSBwcm92aWRlci5cbiAgICovXG4gIHJ1bihmbikge1xuICAgIHJldHVybiB0aGlzLndpdGgoJyhydW4pJywgZm4pW19fcmVzb2x2ZV9fXSgnKHJ1biknKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBQcmV0dHkgcHJpbnRzIHRoaXMgc2NvcGUuXG4gICAqXG4gICAqIEBtZXRob2QgdG9TdHJpbmdcbiAgICogQHJldHVybiB7c3RyaW5nfSBQcmV0dHkgcHJpbnRlZCBzdHJpbmcgb2YgdGhpcyBzY29wZS5cbiAgICovXG4gIHRvU3RyaW5nKCkge1xuICAgIGxldCBwYXJlbnRTdHJQYXJ0ID0gdGhpc1tfX3BhcmVudFNjb3BlX19dID8gW3RoaXNbX19wYXJlbnRTY29wZV9fXS50b1N0cmluZygpXSA6IFtdO1xuICAgIHJldHVybiBbdGhpc1tfX25hbWVfX11dLmNvbmNhdChwYXJlbnRTdHJQYXJ0KS5qb2luKCcgLT4gJyk7XG4gIH1cblxuICAvKipcbiAgICogQ2xlYXJzIGFueSBnbG9iYWwgYmluZGluZ3MuXG4gICAqXG4gICAqIEBtZXRob2QgcmVzZXRcbiAgICovXG4gIHJlc2V0KCkge1xuICAgIHRoaXNbX19nbG9iYWxCaW5kaW5nc19fXS5jbGVhcigpO1xuICB9XG5cbiAgLyoqXG4gICAqIFJlc29sdmVzIHRoZSBnaXZlbiBrZXkgaW4gYSBuZXcgcnVuIGNvbnRleHQgYW5kIGV4cG9ydHMgdGhlIHJlc3VsdCBnbG9iYWxseS5cbiAgICpcbiAgICogQG1ldGhvZCBleHBvcnRcbiAgICogQHBhcmFtIHtzdHJpbmd9IGtleSBLZXkgdG8gYmUgcmVzb2x2ZWQuXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBleHBvcnRLZXkgYC5gIHNlcGFyYXRlZCBwYXRoIHRvIGV4cG9ydCB0aGUgdmFsdWUgdG8uXG4gICAqIEByZXR1cm4ge2RpanMuU2NvcGV9IFRoaXMgb2JqZWN0IGZvciBjaGFpbmluZy5cbiAgICovXG4gIGV4cG9ydChrZXksIGV4cG9ydEtleSkge1xuICAgIGxldCBwYXJ0cyA9IGV4cG9ydEtleS5zcGxpdCgnLicpO1xuICAgIGxldCBsYXN0UGFydCA9IHBhcnRzLnBvcCgpO1xuICAgIGxldCBleHBvcnRPYmplY3QgPSB3aW5kb3c7XG5cbiAgICBmb3IgKGxldCBwYXJ0IG9mIHBhcnRzKSB7XG4gICAgICBpZiAoIWV4cG9ydE9iamVjdFtwYXJ0XSkge1xuICAgICAgICBleHBvcnRPYmplY3RbcGFydF0gPSB7fTtcbiAgICAgIH1cbiAgICAgIGV4cG9ydE9iamVjdCA9IGV4cG9ydE9iamVjdFtwYXJ0XTtcbiAgICB9XG5cbiAgICBleHBvcnRPYmplY3RbbGFzdFBhcnRdID0gdGhpc1tfX3Jlc29sdmVfX10oa2V5KTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBTY29wZTtcbiJdfQ==
