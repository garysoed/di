# DI-JS

[![Circle CI](https://circleci.com/gh/garysoed/di.svg?style=svg)](https://circleci.com/gh/garysoed/di)

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

-   `require` injects the given key. In this case, it injects `service.iceCream` and `global.URL`
-   `optional` optionally injects the `service.config`. If this value is not bound, it will return
    an `undefined`.

This function is called a "provider".

## Binding

DI-JS supports two kinds of bindings: Global and Local bindings. Global bindings are done using the
`DIJS.bind` method:

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

The first argument to `DIJS.bind` is the key to bind the value to. The second argument is a
provider to run. Note that this function returns a Service. This is the value that will be bound to
`service.iceCream`.

The second type of binding is local binding. This can be done using the `DIJS.with` method:

```javascript
DIJS
    .with('urlPath', function(require, optional) {
      return require('service.location').href;
    })
    .bind('service.iceCream', function(require, optional) {
      var url = require('urlPath');
    });
```

Calling `with` returns a child scope with the given value bound. The value bound by the `with`
method will only be available to descendants of that scope.

Another way to locally bind a value is using `constant`. This is just a shortcut to:

```javascript
DIJS.with('urlPath', function(constant) {
  return constant;
}.bind(null, constant));
```

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

Calling run also creates a new "run context". A given run context will have its own bindings, even
the global bindings. No bindings will be shared between two different run context. This will help
to keep the global environment clean for testing.

## Overriding values

One of the key features of DI-JS is the ability to override bound values. Recall that there are two
kinds of bindings: global and local binding. There is a third type of binding called "run context"
binding. A "run context" binding is a local binding who is an ancestor of a run context. For
example:

```javascript
DIJS
    .constant('run.context.binding', 2)
    .run(function() {});
```

When DI-JS resolves a key, it looks in three different places, in this order:

1.  The local bindings visible to the provider.
1.  The run context binding.
1.  The global binding.

This means that, from a run context, you can only override global bindings. For example:

```javascript
DIJS
    .constant('a', 1)
    .bind('b', function() { return 2; })
    .bind('c', function(require) {
      require('a');  // 1
      require('b');  // 2000

      return 3;
    });

DIJS
    .constant('a', 1000)
    .constant('b', 2000)
    .run(function(require) {
      require('a'); // 1000
      require('b'); // 2000
      require('c'); // 3
    });
```

Note that the value of `'a'` is different in run provider and in the provider of `'c'`.
