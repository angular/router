"use strict";

angular.module('crisis-center/crisis-detail', [])

.component('crisisDetail', {
  templateUrl: 'app/crisis-center/crisisDetail.html',
  bindings: { $router: '<' },
  controller: CrisisDetailComponent
});

function CrisisDetailComponent(crisisService, dialogService) {
  var ctrl = this;
  this.$routerOnActivate = function(next) {
    // Get the crisis identified by the route parameter
    var id = next.params.id;
    crisisService.getCrisis(id).then(function(crisis) {
      if (crisis) {
        ctrl.editName = crisis.name;
        ctrl.crisis = crisis;
      } else { // id not found
        ctrl.gotoCrises();
      }
    });
  };

  this.$routerCanDeactivate = function() {
    // Allow synchronous navigation (`true`) if no crisis or the crisis is unchanged.
    if (!this.crisis || this.crisis.name === this.editName) {
      return true;
    }
    // Otherwise ask the user with the dialog service and return its
    // promise which resolves to true or false when the user decides
    return dialogService.confirm('Discard changes?');
  };

  this.cancel = function() {
    ctrl.editName = ctrl.crisis.name;
    ctrl.gotoCrises();
  };

  this.save = function() {
    ctrl.crisis.name = ctrl.editName;
    ctrl.gotoCrises();
  };

  this.gotoCrises = function() {
    var crisisId = ctrl.crisis && ctrl.crisis.id;
    // Pass along the hero id if available
    // so that the CrisisListComponent can select that hero.
    this.$router.navigate(['CrisisList', {id: crisisId}]);
  };
}

