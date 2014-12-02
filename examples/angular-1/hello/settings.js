'use strict';

angular.module('example.settings', []).
  controller('SettingsController', SettingsController);

function SettingsController(router) {
  this.heading = 'Settings';
  this.router = router;

  router.config([
    { path: '/',         component: 'welcome',  title:'Welcome' },
    { path: '/welcome',  component: 'welcome',  title:'Welcome' },
    { path: '/flickr',   component: 'flickr' },
    { path: '/settings', component: 'settings', title:'Settings (What!?)' }
  ]);
}
