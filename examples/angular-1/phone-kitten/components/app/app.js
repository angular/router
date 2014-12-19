'use strict';

angular.module('phoneKitten', [
  'ngFuturisticRouter',
  'ngAnimate',

  'phoneKitten.phoneDetail',
  'phoneKitten.phoneList',

  'phoneKitten.filters',
  'phoneKitten.services'
]).
controller('AppController', ['router', AppController]);

function AppController(router) {
  router.config([
    { path: 'phones'          , component: 'phoneList'   },
    { path: 'phones/:phoneId' , component: 'phoneDetail' }
  ]);
}
