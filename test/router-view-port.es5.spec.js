'use strict';

describe('routerViewPort', function () {

  var elt,
      ctrl,
      ctrlRouter,
      childCtrlRouter,
      $compile,
      $rootScope,
      $templateCache,
      $controllerProvider,
      routerPassedToCtrl;

  beforeEach(module('ngFuturisticRouter'));

  beforeEach(module(function(_$controllerProvider_) {
    $controllerProvider = _$controllerProvider_;
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


  it('should have links that correctly work', inject(function (router) {
    put('router.html', '<div>outer { <div router-view-port></div> }</div>');
    put('one.html', '<div><a router-link="two">{{number}}</a></div>');

    router.config([
      { path: '/a', component: 'one' },
      { path: '/b', component: 'two' }
    ]);
    compile('<router-component component-name="router"></router-component>');

    router.navigate('/a');
    $rootScope.$digest();

    expect(elt.find('a').attr('href')).toBe('/b');
  }));


  it('should have links that correctly work', inject(function (router) {
    put('router.html', '<div>outer { <div router-view-port></div> }</div>');
    put('one.html', '<div><a router-link="two({param: \'lol\'})">{{number}}</a></div>');

    router.config([
      { path: '/a', component: 'one' },
      { path: '/b/:param', component: 'two' }
    ]);
    compile('<router-component component-name="router"></router-component>');

    router.navigate('/a');
    $rootScope.$digest();

    expect(elt.find('a').attr('href')).toBe('/b/lol');
  }));


  it('should update the href of links', inject(function (router) {
    put('router.html', '<div>outer { <div router-view-port></div> }</div>');
    put('one.html', '<div><a router-link="two({param: number})">{{number}}</a></div>');

    router.config([
      { path: '/a', component: 'one' },
      { path: '/b/:param', component: 'two' }
    ]);
    compile('<router-component component-name="router"></router-component>');

    router.navigate('/a');
    $rootScope.$digest();

    expect(elt.find('a').attr('href')).toBe('/b/one');
  }));


  it('should run the activate hook of controllers', inject(function (router) {
    put('router.html', '<div>outer { <div router-view-port></div> }</div>');
    put('activate.html', 'hi');

    $controllerProvider.register('ActivateController', ActivateController);
    function ActivateController() {}
    var spy = ActivateController.prototype.activate = jasmine.createSpy('activate');

    router.config([
      { path: '/a', component: 'activate' }
    ]);
    compile('<router-component component-name="router"></router-component>');

    router.navigate('/a');
    $rootScope.$digest();

    expect(spy).toHaveBeenCalled();
  }));


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
