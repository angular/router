# Configuring the Router

This guide shows the many ways to map URLs to components.

A router takes an array of pairings like this:

```js
MyController.$routeConfig = [
  { path: '/user', component: 'user' }
];
```

## Sibling Viewports

You can configure multiple viewports on the same path like this:

```js
MyController.$routeConfig = [
  { path: '/user',
    components: {
      master: 'userList',
      detail: 'user'
  } }
];
```

```html
<div ng-viewport="master"></div>
<div ng-viewport="detail"></div>
```

## redirectTo

Useful for migrating to a new URL scheme and setting up default routes.

With the following configuration:

```js
MyController.$routeConfig = [
  { path: '/', redirectTo: '/user' },
  { path: '/user', component: 'user' }
];
```

A navigation to `/` will result in the URL changing to `/user` and the viewport at that level loading the `user` component.
