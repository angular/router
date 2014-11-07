angular.module('myApp', ['ngFuturisticRouter']).

controller('UserController', function ($scope, router) {

  $scope.show = function () {
    $scope.thing = true;
    router.navigate({hey: 'there'});
  };

  $scope.name = 'hey';
});
