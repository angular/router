# Getting Started

These are instuctions for starting a new app with the New Router with AngularJS 1.4.

## Project Structure

We're going to organize our code like this, and assume we have a simple HTTP server
that serves files at a path corresponding to their location within the file system.

```
index.html
package.json
components/
├── app/
│   ├── app.html
│   └── app.js
├── ...
node_modules/
└── ...
```

Let's start with the contents of `index.html`:

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <base href="/">
  <title>My app</title>
</head>
<body ng-app="myApp">
  <div router-component="app"></div>

  <script src="/node_modules/angular/angular.js"></script>
  <script src="/dist/router.es5.js"></script>
  <script src="/app/app.js"></script>
</body>
</html>
```

This is a pretty typical angular app, except the `router-component` directive.
Let's talk about that for a bit.


## A component

In addition to the directive in our `index.html`, you probably noticed that we have a directory called `components`.

What's all this "component" stuff?

In Angular 1, a "routable component" is a template and a controller.

<!--
<aside class="implementation detail">
In Angular 2, the DI system understands how to... .

In Angular 1, we need this component system to hook up child routers.
</aside>
-->

A component's template can have "view ports," which are holes in the DOM for loading parts of your app based on the route configuration.

A component's controller can have a router.

A component's router tells the component what to put inside the view ports based on URL.
The configuration maps routes to components for each viewport.

Let's see what this looks like:

`app/app.js`
```html
angular.module('app', AppController);

function (router) {
  router.config([
    {path: '', component: 'detail' }
  ])
}
```

## Linking to routes

How do we link routes?

## Nesting Routes

module.controller('PhoneListController', function (router) {
  router.config([
    {path: '', component: 'detail' }
  ])
});

## Multiple Viewports

A component can have multiple viewports:

`multiview.html`
```html
<div class="container">
  <div ng-view-port="left"></div>
  <div ng-view-port="right"></div>
</div>
```

Viewports are named with the `ng-view-port` attribute.

They are then configured like this:

`multiview.js`
```js
router.config([
  { path: '/', components: { left: 'tree', right: 'detail' } }
])
```


## Additional reading

See the `examples/` directory for common recipes.
