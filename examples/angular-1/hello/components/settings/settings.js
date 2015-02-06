'use strict';

angular.module('example.settings', []).
  controller('SettingsController', SettingsController);

function SettingsController(router) {
  this.heading = 'Settings';
  this.router = router;

  router.config([
    { path: '/',         redirectTo: '/welcome' },
    { path: '/welcome',  component: 'welcome',  title:'Welcome' },
    { path: '/flickr',   component: 'flickr' }
  ]);
}
