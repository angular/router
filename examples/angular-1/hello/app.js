'use strict';

angular.module('example', [
  'example.flickr',
  'example.settings',
  'example.welcome',
  'ngFuturisticRouter'
]).
  controller('AppController', AppController);

function AppController(router) {
  router.config([
    { path: '/',              component: 'welcome' },
    { path: '/welcome',       component: 'welcome' },
    { path: '/flickr',        component: 'flickr' },
    { path: '/settings',      component: 'settings' }
  ]);
}
