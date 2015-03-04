angular.module('myApp', [
  'ngNewRouter'
])
.controller('AppController', ['$router', AppController]);

function AppController($router) {
  $router.config([
    { path: '/',            redirectTo: '/users/posts' },
    { path: '/users/posts', components: { left: 'users', right: 'posts' } },
    { path: '/posts/users', components: { left: 'posts', right: 'users' } },
  ]);
}
