'use strict';

angular.module('example', [
  'example.goodbye',
  'example.welcome',
  'ngAnimate',
  'ngFuturisticRouter'
]).
  controller('AppController', AppController);

function AppController(router) {
  router.config([
    { path: '/',              component: 'welcome' },
    { path: '/welcome',       component: 'welcome' },
    { path: '/goodbye',       component: 'goodbye' }
  ]);
}
