# Configuring the Router

A router takes an array of pairings like this:

```js
router.config([
  { path: '/user', component: 'user' }
]);
```

## Sibling Viewports

You can configure multiple viewports on the same path like this:

```js
router.config([
  { path: '/user',
    components: {
      master: 'userList',
      detail: 'user'
  } }
]);
```

```html
<div router-component="master"></div>
<div router-component="detail"></div>
```

## redirectTo

Useful for migrating to a new URL scheme, setting up defaults...

Having multiple entries to one cannonical route...

```js
router.config([
  { path: '/', redirectTo: '/user' },
  { path: '/user', component: 'user' }
]);
```
