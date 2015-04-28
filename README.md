# DI-JS
DI-JS is a simple **D**ependency **I**njection for **J**ava**S**cript for the Web. Unlike ES6's module, this is written to work with HTML Imports and libraries not using ES6 module.

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
DI-JS uses 2 arguments for injection. The first argument is an object, which maps a variable name to
a bound key. The second argument is a function with one argument. This argument is an object
containing the bound values, as specified by the mapping object. For example:
```javascript
DI.run(
    {
      URL: 'global.URL',
      iceCream: 'service.iceCream'
    },
    function($i) {
      // Code using URL and calendar service
    });
```

In the example above, $i contains two properties: `URL`, which contains the value bound to
`global.URL` and `iceCream`, which contains the value bound to `service.iceCream`.

## Binding
There are several ways to bind values. The most common one is to use the `DI.bind` method:
```javascript
DI
    .bind(
        'service.iceCream',
        { http: 'service.http' },
        function($i) {
          var Service = function() { };
          Service.prototype.getFlavors = function() {
            $i.http.get();
          };

          return Service;
        }]);
```

The first argument to `DI.bind` is the key to bind the value to. The last two arguments are the two
arguments used for injecting. The function will be ran with an object containing the injected values
(`service.http` as `http`) as described in the previous section. Note that the injector returns a
Service. This is the value that will be bound to `service.iceCream`.

## Running a program
Note that DI-JS lazily evaluates any providers. Calling `DI.bind` does not run the provider. The
only time a provider is run is during injection or when calling `DI.run`:

```javascript
DI.run({ iceCream: 'service.iceCream' }, function(iceCream) {
  iceCream.getFlavors();
});
```

`DI.run` is the entry point of an application. Every code that depends on a bound value must run
inside a provider. This ensures that the value is ready when it is used.

# Advanced Usage
## Overriding values
One of the key features of DI-JS is the ability to override bound values. There are two methods to
help with this: `DI.with` and `DI.constant`:

```javascript
DI
    .with('baseUrl', { location: 'service.location' }, function($i) {
      return $i.location.href;
    })
    .bind('service.http', { baseUrl: 'baseUrl' }, function($i) {
      // ...
    });
```

In this example, `$i.baseUrl` will be bound to the value of `service.location.href`. Unlike
`DI.bind` (called *global binding*), binding done by `DI.with` (called *local binding*) is only
available to calls chained after it. This means that the following will not work:

```javascript
DI
    .run({ baseUrl: 'baseUrl' }, function($i) { // cannot resolve baseUrl
    });
```

However, you can override the value of `baseUrl`. For example:

```javascript
DI
    .with('baseUrl', {}, function() { return 'https://testdomain.com'; })
    .run({ iceCream: 'service.iceCream' }, function(iceCream) {
      // service.iceCream will call testdomain.com
    });
```

When resolving a binding key, DI-JS will look in the following order:
  1. Local binding closest to `DI.run`, from the closest to the furthest.
  2. Local binding closest to where the provider is bound, from the closes to the furthest.
  3. Global binding

Since DI-JS executes the provider lazily, `DI.constant` should be used for values that should be evaluated when declaring binding. Like its name implies, to DI-JS, values bound by `DI.constant` are constants. Example:
```javascript
DI
    .constant('APP_ID', window['APP_ID'])
    .bind('service.http', { baseUrl: 'baseUrl', appId: 'APP_ID' }, function($i) {
      // ...
    });
```

Like `DI.with`, `DI.constant` is a *local binding* and can be overridden.

## Prefixes
If you want to share your library with other users, you want to namespace your bindings to avoid collisions. Suppose you pick `mine` as the prefix. So you'll end up with bindings like:
```javascript
DI
    .bind(
        'mine.tool.Example',
        {
          http: 'mine.service.http',
          textBox: 'mine.component.textBox',
          auth: 'mine.service.auth',
          HammerJS: 'HammerJS'
        },
        function($i) {
          // ...
        });
```

To make writing this easier, you can use the `DI.prefix`. So the above can be rewritten as:

```javascript
DI
    .prefix('mine')
    .bind(
        'tool.Example',
        {
          http: 'service.http',
          textBox: 'component.textBox',
          auth: 'service.auth',
          HammerJS: '/HammerJS'
        },
        function($i) {
          // ...
        });
```

Note that the key for `hammer` is `'/HammerJS'`. `'/'` at the beginning of the key tells DI-JS to ignore any prefixes when injecting that dependency, so `hammer` will be injected with value bound to `HammerJS`

## Optional Dependencies
There are cases where we want optional dependencies. To do this, add a `'?'` to the end of the prefix. For example:
```javascript
DI
    .run({ plugin: 'service.plugin?' }, function(plugin) {
      // ...
    });
```

DI-JS will inject `undefined` if `service.plugin` isn't bound. Otherwise, it will inject any bound `service.plugin`, as normal.

## Shortcut key
You can use the argument's name as the key in providers. For instance:
```javascript
DI
    .run({ http: 'service.=' }, function(http) {
      // ...
    });
```

Will inject `'service.http'` into `http`. Any `'='` in the key will be replaced by the corresponding argument in the function.
