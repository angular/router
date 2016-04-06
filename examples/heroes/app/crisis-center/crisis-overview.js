"use strict";

angular.module('crisis-center/crisis-overview', [])

.component('crisisOverview', {
  templateUrl: 'app/crisis-center/crisis-overview.html',
  bindings: { $router: '<' },
  controller: CrisisOverviewComponent,
  $canActivate: function($nextInstruction, $prevInstruction) {
    console.log('$canActivate', arguments);
  }
});


function CrisisOverviewComponent(crisisService) {
  var ctrl = this;

  this.countries = ['USA', 'UK'];

  this.$routerOnActivate = function(next) {
    console.log('$routerOnActivate', this, arguments);
    // Load up the crises for this view
    crisisService.getCrises().then(function(crises) {
      ctrl.crises = crises;
      ctrl.currentCrisis = next.params.crisis;
    });

    ctrl.selectedCountry = next.params.country;
  };

  this.editCrisis = function(crisis) {
    this.$router.navigate(['CrisisDetail', { country: crisis.country, crisis: crisis.id }]);
  };
};