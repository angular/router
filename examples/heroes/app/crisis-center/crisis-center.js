"use strict";

angular.module('crisis-center', [
  'crisis-center/crisis-overview',
  'crisis-center/crisis-detail'
])

  .service('crisisService', CrisisService)

  .component('crisisCenter', {
    template: '<h2>Crisis Center</h2><ng-outlet></ng-outlet>',
    $routeConfig: [
      {path:'/',    name: 'CrisisList',   component: 'crisisOverview', useAsDefault: true},
      {path:'/:country/:crisis', name: 'CrisisDetail', component: 'crisisDetail'}
    ]
  })


function CrisisService($q) {
  var crisesPromise = $q.when([
    {id: 1, name: 'Princess Held Captive', country: 'UK'},
    {id: 2, name: 'Dragon Burning Cities', country: 'USA'},
    {id: 3, name: 'Giant Asteroid Heading For Earth', country: 'UK'},
    {id: 4, name: 'Release Deadline Looms', country: 'USA'}
  ]);

  this.getCrises = function() {
    return crisesPromise;
  };

  this.getCrisis = function(id) {
    return crisesPromise.then(function(crises) {
      for(var i=0; i<crises.length; i++) {
        if ( crises[i].id == id) return crises[i];
      }
    });
  };
}












