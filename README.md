# DI-JS

DI-JS is a simple Dependency Injection for JavaScript for the Web. Unlike ES6's module, this is written to work with HTML Imports and libraries not using ES6 module.

One of the main features of DI-JS is the ability for the developer to override any bindings. This makes testing and writing customizable frameworks easier.

# Installation

```
npm install --save-dev di-js
```

To use this, include this in your html file:

```html
<script src="path/to/di-js/out/bin.js"></script>
```

# Basic Usage

There are two main usages of DI-JS: Injecting and Binding

## Injecting

Use the `DIJS.run` method to inject values. For example:

```javascript
DIJS.run(
    function(require, optional) {
      var URL = require('global.URL');
      var iceCream = require('service.iceCream');
      var opt_config = optional('service.config');

      load('deps');

      // Code using URL and iceCream service
    });
```

In the example above, the function receives two functions:

-  `require` injects the given key. In this case, it injects `service.iceCream` and `global.URL`
-  `optional` optionally injects the `service.config`. If this value is not bound, it will return
   an `undefined.`

## Binding

There are several ways to bind values. The most common one is to use the `DIJS.bind` method:

```javascript
DIJS
    .bind(
        'service.iceCream',
        function(require, optional) {
          var http = require('service.http');

          var Service = function() { };
          Service.prototype.getFlavors = function() {
            http.get();
          };

          return Service;
        }]);
```

The first argument to `DIJS.bind` is the key to bind the value to. The last argument is the same
function  as described in the previous section. Note that this function returns a Service. This is
the value that will be bound to `service.iceCream`.

## Running a program

Note that DI-JS lazily evaluates any providers. Calling `DIJS.bind` does not run the provider. The
only time a provider is run is during injection or when calling `DIJS.run`:

```javascript
DIJS.run(function(require, optional) {
  iceCream = require('service.iceCream');
  iceCream.getFlavors();
});
```

`DIJS.run` is the entry point of an application. Every code that depends on a bound value must run
inside a provider. This ensures that the value is ready when it is used.

# Advanced Usage

## Overriding values

One of the key features of DI-JS is the ability to override bound values. There are two methods to
help with this: `DIJS.with` and `DIJS.constant`:

```javascript
DIJS
    .with('baseUrl', function(require, optional) {
      return require('service.location').href;
    })
    .bind('service.http', function(require, optional) {
      // ...
    });
```

In this example, `baseUrl` will be bound to the value of `service.location.href`. Unlike
`DIJS.bind` (called *global binding*), binding done by `DIJS.with` (called *local binding*) is only
available to calls chained after it. This means that the following will not work:

```javascript
DIJS
    .run(function(require, optional) {
      require('baseUrl'); // cannot resolve baseUrl
    });
```

However, you can override the value of `baseUrl`. For example:

```javascript
DIJS
    .with('baseUrl', function(require, optional) { return 'https://testdomain.com'; })
    .run(function(require, optional) {
      var iceCream = require('service.iceCream');

      // service.iceCream will call testdomain.com
    });
```

When resolving a binding key, DI-JS will look in the following order:

1. Local binding closest to `DIJS.run`, from the closest to the furthest.
2. Local binding closest to where the provider is bound, from the closes to the furthest.
3. Global binding

Since DI-JS executes the provider lazily, `DIJS.constant` should be used for values that should be
evaluated when declaring binding. Like its name implies, to DI-JS, values bound by `DIJS.constant`
are constants. Example:

```javascript
DIJS
    .constant('APP_ID', window['APP_ID'])
    .bind('service.http', function(require, optional) {
      var baseUrl = require('baseUrl');
      var appId = require('APP_ID');
      // ...
    });
```

Like `DIJS.with`, `DIJS.constant` is a *local binding* and can be overridden.

## Prefixes

If you want to share your library with other users, you want to namespace your bindings to avoid collisions. Suppose you pick `mine` as the prefix. So you'll end up with bindings like:

```javascript
DIJS
    .bind(
        'mine.tool.Example',
        function(require, optional) {
          var http = require('mine.service.http');
          var textBox = require('mine.component.textBox');
          var auth = require('mine.service.auth');
          var HammerJS = require('HammerJS');

          // ...
        });
```

To make writing this easier, you can use the `DIJS.prefix`. So the above can be rewritten as:

```javascript
DIJS
    .prefix('mine')
    .bind(
        'tool.Example',
        function(require, optional) {
          var http = require('service.http');
          var textBox = require('component.textBox');
          var auth = require('service.auth');
          var HammerJS = require('/HammerJS');
          // ...
        });
```

Note that the key for `hammer` is `'/HammerJS'`. `/` at the beginning of the key tells DI-JS to
ignore any prefixes when injecting that dependency, so `hammer` will be injected with value bound
to `HammerJS`
