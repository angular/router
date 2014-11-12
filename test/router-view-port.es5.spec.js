'use strict';

describe('routerViewPort', function () {

  var elt,
      ctrl,
      ctrlRouter,
      childCtrlRouter,
      $compile,
      $rootScope,
      $templateCache,
      routerPassedToCtrl;

  beforeEach(module('ngFuturisticRouter'));

  beforeEach(module(function($controllerProvider) {
    $controllerProvider.register('RouterController', function (router) {
      ctrl = this;
      ctrlRouter = router;
    });
    $controllerProvider.register('ChildRouterController', function (router) {
      childCtrlRouter = router;
      router.config([
        { path: '/b', component: 'one' }
      ]);
    });

    $controllerProvider.register('UserController', UserController);
    $controllerProvider.register('GoodbyeController', UserController);
    $controllerProvider.register('OneController', boringController('number', 'one'));
    $controllerProvider.register('TwoController', boringController('number', 'two'));

    function UserController($scope, routeParams) {
      $scope.name = routeParams.name || 'blank';
    }
  }));

  beforeEach(inject(function(_$compile_, _$rootScope_, _$templateCache_) {
    $compile = _$compile_;
    $rootScope = _$rootScope_;
    $templateCache = _$templateCache_;
  }));


  it('should work', inject(function (router) {
    put('router.html', '<div router-view-port></div>');
    put('user.html', '<div>hello {{name}}</div>');

    compile('<router-component component-name="router"></router-component>');

    router.config([
      { path: '/', component: 'user' }
    ]);

    router.navigate('/');
    $rootScope.$digest();

    expect(elt.text()).toBe('hello blank');
  }));


  it('should transition between components', inject(function (router) {
    put('router.html', '<div router-view-port></div>');
    put('user.html', '<div>hello {{name}}</div>');

    router.config([
      { path: '/user/:name', component: 'user' }
    ]);
    compile('<router-component component-name="router"></router-component>');

    router.navigate('/user/brian');
    $rootScope.$digest();
    expect(elt.text()).toBe('hello brian');

    router.navigate('/user/igor');
    $rootScope.$digest();
    expect(elt.text()).toBe('hello igor');
  }));


  it('should work with multiple named viewports', inject(function (router) {
    put('router.html', 'port 1: <div router-view-port="one"></div> | ' +
                       'port 2: <div router-view-port="two"></div>');

    put('one.html', '<div>{{number}}</div>');
    put('two.html', '<div>{{number}}</div>');

    router.config([
      { path: '/', component: {one: 'one', two: 'two'} }
    ]);
    compile('<router-component component-name="router"></router-component>');


    router.navigate('/');
    $rootScope.$digest();

    expect(elt.text()).toBe('port 1: one | port 2: two');
  }));


  it('should give child components child routers', inject(function (router) {
    put('router.html', '<div>outer { <div router-view-port></div> }</div>');
    put('childRouter.html', '<div>inner { <div router-view-port></div> }</div>');
    put('one.html', '<div>{{number}}</div>');

    router.config([
      { path: '/a', component: 'childRouter' }
    ]);
    compile('<router-component component-name="router"></router-component>');


    router.navigate('/a/b');
    $rootScope.$digest();

    expect(elt.text()).toBe('outer { inner { one } }');
  }));


  function handler (obj) {
    return function () {
      return obj;
    };
  }

  function boringController (model, value) {
    return function ($scope) {
      $scope[model] = value;
    };
  }

  function put (name, template) {
    $templateCache.put(name, [200, template, {}]);
  }

  function compile (template) {
    elt = $compile(template)($rootScope);
    $rootScope.$digest();
    return elt;
  }
});
