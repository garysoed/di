(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
"use strict";

var _interopRequire = function (obj) { return obj && obj.__esModule ? obj["default"] : obj; };

var Scope = _interopRequire(require("./scope"));

(function (window) {
  window.DIJS = new Scope();
  window.DIJS.Scope = Scope;
})(window);

},{"./scope":2}],2:[function(require,module,exports){
"use strict";

var _createComputedClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var prop = props[i]; prop.configurable = true; if (prop.value) prop.writable = true; Object.defineProperty(target, prop.key, prop); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };

// Private symbols.
var __localBindings__ = Symbol("localBindings");
var __parentScope__ = Symbol("parentScope");
var __prefix__ = Symbol("prefix");
var __rootScope__ = Symbol("rootScope");

var __registerProvider__ = Symbol("registerProvider");
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
    key: __registerProvider__,
    value: function (normalizedKey, fn) {
      if (this[__localBindings__].has(normalizedKey)) {
        throw new Error("" + normalizedKey + " is already bound");
      }
      this[__localBindings__].set(normalizedKey, fn);
    }
  }, {
    key: __findProvider__,
    value: function (normalizedKey) {
      // Checks the local binding.
      var provider = this[__localBindings__].get(normalizedKey);
      if (provider === undefined) {
        if (this[__parentScope__]) {
          return this[__parentScope__][__findProvider__](normalizedKey);
        } else {
          return undefined;
        }
      } else {
        return provider;
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
      var childScope = new Scope(this, this[__rootScope__]);
      childScope[__registerProvider__](key, fn);
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
      this[__rootScope__][__registerProvider__](key, fn);
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
      var _this = this;

      var resolvedValues = new Map();

      var optional = function (key) {
        var normalizedKey = key;
        if (resolvedValues.has(normalizedKey)) {
          return resolvedValues.get(normalizedKey);
        }

        var provider = _this[__findProvider__](normalizedKey);
        if (provider === undefined) {
          return undefined;
        } else {
          var value = provider(require, optional);
          resolvedValues.set(normalizedKey, value);
          return value;
        }
      };

      var require = function (key) {
        var value = optional(key);
        if (value === undefined) {
          throw new Error("Cannot find " + key);
        }
        return value;
      };

      return fn(require, optional);
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

},{}]},{},[1])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIvVXNlcnMvZ3NvZWQvcHJvai9kaS1qcy9zcmMvaW5kZXguanMiLCIvVXNlcnMvZ3NvZWQvcHJvai9kaS1qcy9zcmMvc2NvcGUuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7O0lDQU8sS0FBSywyQkFBTSxTQUFTOztBQUUzQixDQUFDLFVBQUMsTUFBTSxFQUFLO0FBQ1gsUUFBTSxLQUFRLEdBQUcsSUFBSSxLQUFLLEVBQUUsQ0FBQztBQUM3QixRQUFNLEtBQVEsTUFBUyxHQUFHLEtBQUssQ0FBQztDQUNqQyxDQUFBLENBQUUsTUFBTSxDQUFDLENBQUM7Ozs7Ozs7Ozs7QUNKWCxJQUFNLGlCQUFpQixHQUFHLE1BQU0sQ0FBQyxlQUFlLENBQUMsQ0FBQztBQUNsRCxJQUFNLGVBQWUsR0FBRyxNQUFNLENBQUMsYUFBYSxDQUFDLENBQUM7QUFDOUMsSUFBTSxVQUFVLEdBQUcsTUFBTSxDQUFDLFFBQVEsQ0FBQyxDQUFDO0FBQ3BDLElBQU0sYUFBYSxHQUFHLE1BQU0sQ0FBQyxXQUFXLENBQUMsQ0FBQzs7QUFFMUMsSUFBTSxvQkFBb0IsR0FBRyxNQUFNLENBQUMsa0JBQWtCLENBQUMsQ0FBQztBQUN4RCxJQUFNLGdCQUFnQixHQUFHLE1BQU0sQ0FBQyxjQUFjLENBQUMsQ0FBQzs7SUFFMUMsS0FBSzs7Ozs7Ozs7O0FBUUUsV0FSUCxLQUFLLEdBUXlDO1FBQXRDLFdBQVcsZ0NBQUcsSUFBSTtRQUFFLFNBQVMsZ0NBQUcsSUFBSTs7MEJBUjVDLEtBQUs7O0FBU1AsUUFBSSxDQUFDLGlCQUFpQixDQUFDLEdBQUcsSUFBSSxHQUFHLEVBQUUsQ0FBQztBQUNwQyxRQUFJLENBQUMsZUFBZSxDQUFDLEdBQUcsV0FBVyxDQUFDO0FBQ3BDLFFBQUksQ0FBQyxhQUFhLENBQUMsR0FBRyxTQUFTLENBQUM7R0FDakM7O3VCQVpHLEtBQUs7U0Fj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QUFLLEVBQUUsQ0FBQztLQUNqQzs7O1NBekhHLEtBQUs7OztpQkE0SEksS0FBSyIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJpbXBvcnQgU2NvcGUgZnJvbSAnLi9zY29wZSc7XG5cbigod2luZG93KSA9PiB7XG4gIHdpbmRvd1snRElKUyddID0gbmV3IFNjb3BlKCk7XG4gIHdpbmRvd1snRElKUyddWydTY29wZSddID0gU2NvcGU7XG59KSh3aW5kb3cpO1xuIiwiLy8gUHJpdmF0ZSBzeW1ib2xzLlxuY29uc3QgX19sb2NhbEJpbmRpbmdzX18gPSBTeW1ib2woJ2xvY2FsQmluZGluZ3MnKTtcbmNvbnN0IF9fcGFyZW50U2NvcGVfXyA9IFN5bWJvbCgncGFyZW50U2NvcGUnKTtcbmNvbnN0IF9fcHJlZml4X18gPSBTeW1ib2woJ3ByZWZpeCcpO1xuY29uc3QgX19yb290U2NvcGVfXyA9IFN5bWJvbCgncm9vdFNjb3BlJyk7XG5cbmNvbnN0IF9fcmVnaXN0ZXJQcm92aWRlcl9fID0gU3ltYm9sKCdyZWdpc3RlclByb3ZpZGVyJyk7XG5jb25zdCBfX2ZpbmRQcm92aWRlcl9fID0gU3ltYm9sKCdmaW5kUHJvdmlkZXInKTtcblxuY2xhc3MgU2NvcGUge1xuICAvKipcbiAgICogU2NvcGUgY29udGFpbmluZyBsb2NhbCBiaW5kaW5ncy5cbiAgICpcbiAgICogQGNsYXNzIERJLlNjb3BlXG4gICAqIEBjb25zdHJ1Y3RvclxuICAgKiBAcGFyYW0ge0RJLlNjb3BlfSBbcGFyZW50U2NvcGU9bnVsbF0gVGhlIHBhcmVudCBzY29wZS5cbiAgICovXG4gIGNvbnN0cnVjdG9yKHBhcmVudFNjb3BlID0gbnVsbCwgcm9vdFNjb3BlID0gdGhpcykge1xuICAgIHRoaXNbX19sb2NhbEJpbmRpbmdzX19dID0gbmV3IE1hcCgpO1xuICAgIHRoaXNbX19wYXJlbnRTY29wZV9fXSA9IHBhcmVudFNjb3BlO1xuICAgIHRoaXNbX19yb290U2NvcGVfX10gPSByb290U2NvcGU7XG4gIH1cblxuICBbX19yZWdpc3RlclByb3ZpZGVyX19dKG5vcm1hbGl6ZWRLZXksIGZuKSB7XG4gICAgaWYgKHRoaXNbX19sb2NhbEJpbmRpbmdzX19dLmhhcyhub3JtYWxpemVkS2V5KSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKGAke25vcm1hbGl6ZWRLZXl9IGlzIGFscmVhZHkgYm91bmRgKTtcbiAgICB9XG4gICAgdGhpc1tfX2xvY2FsQmluZGluZ3NfX10uc2V0KG5vcm1hbGl6ZWRLZXksIGZuKTtcbiAgfVxuXG4gIFtfX2ZpbmRQcm92aWRlcl9fXShub3JtYWxpemVkS2V5KSB7XG4gICAgLy8gQ2hlY2tzIHRoZSBsb2NhbCBiaW5kaW5nLlxuICAgIGxldCBwcm92aWRlciA9IHRoaXNbX19sb2NhbEJpbmRpbmdzX19dLmdldChub3JtYWxpemVkS2V5KTtcbiAgICBpZiAocHJvdmlkZXIgPT09IHVuZGVmaW5lZCkge1xuICAgICAgaWYgKHRoaXNbX19wYXJlbnRTY29wZV9fXSkge1xuICAgICAgICByZXR1cm4gdGhpc1tfX3BhcmVudFNjb3BlX19dW19fZmluZFByb3ZpZGVyX19dKG5vcm1hbGl6ZWRLZXkpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIHByb3ZpZGVyO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgbmV3IGNoaWxkIHNjb3BlIHdpdGggdGhlIGdpdmVuIHZhbHVlIGJvdW5kIHRvIHRoZSBnaXZlbiBrZXkgaW4gaXRzIGxvY2FsIGJpbmRpbmcuXG4gICAqXG4gICAqIFRPRE8oZ3MpXG4gICAqXG4gICAqIEBtZXRob2Qgd2l0aFxuICAgKiBAcGFyYW0ge3N0cmluZ30ga2V5IFRoZSBrZXkgdG8gYm91bmQgdGhlIHZhbHVlIHRvLlxuICAgKiBAcGFyYW0ge09iamVjdH0ga2V5cyBPYmplY3Qgd2l0aCBtYXBwaW5nIG9mIHZhcmlhYmxlIG5hbWUgdG8gdGhlIGJvdW5kIG5hbWUuXG4gICAqIEBwYXJhbSB7RnVuY3Rpb259IGZuIFRoZSBwcm92aWRlciBmdW5jdGlvbiB0byBydW4uXG4gICAqIEByZXR1cm4ge0RJLlNjb3BlfSBUaGUgbmV3bHkgY3JlYXRlZCBjaGlsZCBzY29wZS5cbiAgICovXG4gIHdpdGgoa2V5LCBmbikge1xuICAgIGxldCBjaGlsZFNjb3BlID0gbmV3IFNjb3BlKHRoaXMsIHRoaXNbX19yb290U2NvcGVfX10pO1xuICAgIGNoaWxkU2NvcGVbX19yZWdpc3RlclByb3ZpZGVyX19dKGtleSwgZm4pO1xuICAgIHJldHVybiBjaGlsZFNjb3BlO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYSBuZXcgY2hpbGQgc2NvcGUgd2l0aCB0aGUgZ2l2ZW4gdmFsdWUgYm91bmQgdG8gdGhlIGdpdmVuIGtleSBpbiBpdHMgbG9jYWwgYmluZGluZy5cbiAgICogVGhpcyBpcyBzaW1pbGFyIHRvIHt7I2Nyb3NzTGluayBcIkRJLlNjb3BlL3dpdGhcIn19e3svY3Jvc3NMaW5rfX0sIGJ1dCB0aGUgdmFsdWUgaXMgYSBjb25zdGFudC5cbiAgICpcbiAgICogQG1ldGhvZCBjb25zdGFudFxuICAgKiBAcGFyYW0ge3N0cmluZ30ga2V5IFRoZSBrZXkgdG8gYm91bmQgdGhlIHZhbHVlIHRvLlxuICAgKiBAcGFyYW0ge09iamVjdH0gdmFsdWUgVGhlIG9iamVjdCB0byBiaW5kIHRvIHRoZSBnaXZlbiBrZXkuXG4gICAqIEByZXR1cm4ge0RJLlNjb3BlfSBUaGUgbmV3bHkgY3JlYXRlZCBjaGlsZCBzY29wZS5cbiAgICovXG4gIGNvbnN0YW50KGtleSwgdmFsdWUpIHtcbiAgICByZXR1cm4gdGhpcy53aXRoKGtleSwgKCkgPT4gdmFsdWUpO1xuICB9XG5cbiAgLyoqXG4gICAqIEJpbmRzIHRoZSBnaXZlbiB2YWx1ZSB0byB0aGUgZ2l2ZW4ga2V5LiBUaGUgZXhlY3V0aW9uIHNjb3BlIG9mIHRoZSBwcm92aWRlciBmdW5jdGlvbiBpcyBzdGlsbFxuICAgKiB0aGlzIHNjb3BlLlxuICAgKlxuICAgKiBUT0RPKGdzKVxuICAgKlxuICAgKiBAbWV0aG9kIGJpbmRcbiAgICogQHBhcmFtIHtzdHJpbmd9IGtleSBUaGUga2V5IHRvIGJvdW5kIHRoZSB2YWx1ZSB0by5cbiAgICogQHBhcmFtIHtPYmplY3R9IGtleXMgT2JqZWN0IHdpdGggbWFwcGluZyBvZiB2YXJpYWJsZSBuYW1lIHRvIHRoZSBib3VuZCBuYW1lLlxuICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBmbiBUaGUgcHJvdmlkZXIgZnVuY3Rpb24gdG8gcnVuLlxuICAgKi9cbiAgYmluZChrZXksIGZuKSB7XG4gICAgdGhpc1tfX3Jvb3RTY29wZV9fXVtfX3JlZ2lzdGVyUHJvdmlkZXJfX10oa2V5LCBmbik7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvKipcbiAgICogUnVucyB0aGUgZ2l2ZW4gZnVuY3Rpb24gYWZ0ZXIgaW5qZWN0aW5nIGFueSBkZXBlbmRlbmNpZXMuXG4gICAqXG4gICAqIFRPRE8oZ3MpXG4gICAqXG4gICAqIEBtZXRob2QgcnVuXG4gICAqIEBwYXJhbSB7RnVuY3Rpb259IGZuIFRoZSBmdW5jdGlvbiB0byBydW4uXG4gICAqL1xuICBydW4oZm4pIHtcbiAgICBsZXQgcmVzb2x2ZWRWYWx1ZXMgPSBuZXcgTWFwKCk7XG5cbiAgICBsZXQgb3B0aW9uYWwgPSBrZXkgPT4ge1xuICAgICAgbGV0IG5vcm1hbGl6ZWRLZXkgPSBrZXk7XG4gICAgICBpZiAocmVzb2x2ZWRWYWx1ZXMuaGFzKG5vcm1hbGl6ZWRLZXkpKSB7XG4gICAgICAgIHJldHVybiByZXNvbHZlZFZhbHVlcy5nZXQobm9ybWFsaXplZEtleSk7XG4gICAgICB9XG5cbiAgICAgIGxldCBwcm92aWRlciA9IHRoaXNbX19maW5kUHJvdmlkZXJfX10obm9ybWFsaXplZEtleSk7XG4gICAgICBpZiAocHJvdmlkZXIgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgbGV0IHZhbHVlID0gcHJvdmlkZXIocmVxdWlyZSwgb3B0aW9uYWwpO1xuICAgICAgICByZXNvbHZlZFZhbHVlcy5zZXQobm9ybWFsaXplZEtleSwgdmFsdWUpO1xuICAgICAgICByZXR1cm4gdmFsdWU7XG4gICAgICB9XG4gICAgfTtcblxuICAgIGxldCByZXF1aXJlID0ga2V5ID0+IHtcbiAgICAgIGxldCB2YWx1ZSA9IG9wdGlvbmFsKGtleSk7XG4gICAgICBpZiAodmFsdWUgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYENhbm5vdCBmaW5kICR7a2V5fWApO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHZhbHVlO1xuICAgIH07XG5cbiAgICByZXR1cm4gZm4ocmVxdWlyZSwgb3B0aW9uYWwpO1xuICB9XG5cbiAgcmVzZXQoKSB7XG4gICAgdGhpc1tfX2xvY2FsQmluZGluZ3NfX10uY2xlYXIoKTtcbiAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBTY29wZTtcbiJdfQ==
