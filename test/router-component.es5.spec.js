describe('routerComponent', function () {

  var elt,
      ctrlRouter,
      $compile,
      $rootScope,
      $templateCache;

  beforeEach(module('myApp'));

  beforeEach(inject(function (_$compile_, _$rootScope_, _$templateCache_) {
    $compile = _$compile_;
    $rootScope = _$rootScope_;
    $templateCache = _$templateCache_;
  }));

  it('should work', inject(function () {
    putIntoCache('user.html', '<div>hello {{name}}, {{user.name}}</div>');
    compile('<router-component component-name="user"></router-component>');

    expect(elt.text()).toBe('hello Brian, Controller');
  }));


  it('should get the root router instance if it has no children', inject(function (router) {
    putIntoCache('router.html', '<div></div>');
    compile('<router-component component-name="router"></router-component>');

    expect(ctrlRouter).toBe(router);
  }));


  it('should get the root router instance if it has children', inject(function (router) {
    putIntoCache('router.html', '<div router-view-port></div>');
    compile('<router-component component-name="router"></router-component>');

    expect(ctrlRouter).toBe(router);
  }));

  function putIntoCache (name, template) {
    $templateCache.put(name, [200, template, {}]);
    $rootScope.$digest();
  }

  function compile (template) {
    elt = $compile(template)($rootScope);
    $rootScope.$digest();
    return elt;
  }

  angular.module('myApp', ['ngFuturisticRouter']).
      controller('UserController', ['$scope', function ($scope) {
        $scope.name = 'Brian';
        this.name = 'Controller';
      }]).
      controller('RouterController', ['$scope', 'router', function ($scope, router) {
        ctrlRouter = router;
      }]);
});
