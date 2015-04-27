# Configuring the Router

This guide shows the many ways to configure routes in Component Router.

Unlike other routing systems, Component Router maps URLs to components.

A router takes an array of pairings like this:

<!-- Angular 1 -->
```js
MyController.$routeConfig = [
  { path: '/user', component: 'user' }
];
```
<!-- End Angular 1 -->

## Sibling Outlets

You can configure multiple outlets on the same path like this:

<!-- Angular 1 -->
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
<div ng-outlet="master"></div>
<div ng-outlet="detail"></div>
```
<!-- End Angular 1 -->


<!-- Angular 2 + TypeScript -->
```js
@Component({})
@View({
  template:
    `<div router-outlet="master"></div>
     <div router-outlet="detail"></div>`,
  directives: [RouterOutlet, RouterLink]
})
@RouteConfig({
  path: '/user', components: {
    master: 'userList',
    detail: 'user'
  }
})
class MyComponent {}
```
<!-- End Angular 2 + TypeScript -->

You can link to any sibling just as you normally would:

<!-- Angular 1 -->
```html
<p>These both link to the same view:</p>
<a ng-link="userList">link to userList</a>
<a ng-link="user">link to user component</a>
```
<!-- End Angular 1 -->
<!-- Angular 2 -->
```html
<p>These both link to the same view:</p>
<a router-link="userList">link to userList</a>
<a router-link="user">link to user component</a>
```
<!-- End Angular 2 -->


Or, you can explicitly link to a outlet-component pair link this:

<!-- Angular 1 -->
```html
<p>These both link to the same view:</p>
<a ng-link="master:userList">link to userList</a>
<a ng-link="detail:user">link to user component</a>
```
<!-- End Angular 1 -->
<!-- Angular 2 -->
```html
<p>These both link to the same view:</p>
<a router-link="master:userList">link to userList</a>
<a router-link="detail:user">link to user component</a>
```
<!-- End Angular 2 -->

## redirectTo

Useful for migrating to a new URL scheme and setting up default routes.

With the following configuration:

<!-- Angular 1 -->
```js
MyController.$routeConfig = [
  { path: '/', redirectTo: '/user' },
  { path: '/user', component: 'user' }
];
function MyController() {}
```
<!-- End Angular 1 -->
<!-- Angular 2 -->
```js
@Component({})
@View({
  directives: [RouterOutlet]
})
@RouteConfig([
  { path: '/', redirectTo: '/user' },
  { path: '/user', component: UserComp }
])
class MyComp {}
```
<!-- End Angular 2 -->


A navigation to `/` will result in the URL changing to `/user` and the outlet at that level loading the `user` component.

## Aliases

Consider the following route configuration:

<!-- Angular 1 -->
```js
MyController.$routeConfig = [
  { path: '/', component: 'user' }
];
```
<!-- End Angular 1 -->
<!-- Angular 2 -->
```js
@Component({})
@View({
  directives: [RouterOutlet]
})
@RouteConfig([
  { path: '/', component: 'user' }
])
class MyComp {}
```
<!-- End Angular 2 -->

When linking to a route, you normally use the name of the component:

<!-- Angular 1 -->
```html
<a ng-link="user">link to user component</a>
```
<!-- End Angular 1 -->
<!-- Angular 2 -->
```html
<a router-link="user">link to user component</a>
```
<!-- End Angular 2 -->

If you want to refer to it differently:

<!-- Angular 1 -->
```js
MyController.$routeConfig = [
  { path: '/', component: 'user', as: 'myUser' }
];
```

```html
<a ng-link="myUser">link to user component</a>
```
<!-- End Angular 1 -->
<!-- Angular 2 -->

<!-- End Angular 2 -->

This can be useful in cases where you have sibling components, but want to refer to that entire level of routing:

```js
MyController.$routeConfig = [
  { path: '/',
    components: {
      master: 'userList',
      detail: 'user'
    },
    as: 'myUser'
  }
];
```

## Dynamic Configuration

You can ask for `$router`
