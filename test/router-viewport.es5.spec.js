'use strict';

describe('ngViewport', function () {

  var elt,
      $compile,
      $rootScope,
      $templateCache,
      $controllerProvider;


  beforeEach(function() {
    module('ng');
    module('ngNewRouter');
    module(function(_$controllerProvider_) {
      $controllerProvider = _$controllerProvider_;
    });

    inject(function(_$compile_, _$rootScope_, _$templateCache_) {
      $compile = _$compile_;
      $rootScope = _$rootScope_;
      $templateCache = _$templateCache_;
    });

    put('user', '<div>hello {{user.name}}</div>');
    $controllerProvider.register('UserController', function($routeParams) {
      this.name = $routeParams.name || 'blank';
    });

    put('one', '<div>{{one.number}}</div>');
    $controllerProvider.register('OneController', boringController('number', 'one'));

    put('two', '<div>{{two.number}}</div>');
    $controllerProvider.register('TwoController', boringController('number', 'two'));
  });


  it('should work in a simple case', inject(function ($router) {
    compile('<ng-viewport></ng-viewport>');

    $router.config([
      { path: '/', component: 'user' }
    ]);

    $router.navigate('/');
    $rootScope.$digest();

    expect(elt.text()).toBe('hello blank');
  }));


  // See https://github.com/angular/router/issues/105
  it('should warn when instantiating a component with no controller', inject(function ($router) {
    put('noController', '<div>{{ 2 + 2 }}</div>');
    $router.config([
      { path: '/', component: 'noController' }
    ]);

    spyOn(console, 'warn');
    compile('<ng-viewport></ng-viewport>');
    $router.navigate('/');

    expect(console.warn).toHaveBeenCalledWith('Could not instantiate controller', 'NoControllerController');
    expect(elt.text()).toBe('4');
  }));


  it('should navigate between components with different parameters', inject(function ($router) {
    $router.config([
      { path: '/user/:name', component: 'user' }
    ]);
    compile('<ng-viewport></ng-viewport>');

    $router.navigate('/user/brian');
    $rootScope.$digest();
    expect(elt.text()).toBe('hello brian');

    $router.navigate('/user/igor');
    $rootScope.$digest();
    expect(elt.text()).toBe('hello igor');
  }));


  it('should not reactivate a parent when navigating between child components with different parameters', inject(function ($router) {
    ParentController.$routeConfig = [
      { path: '/user/:name', component: 'user' }
    ];
    function ParentController () {}
    var spy = ParentController.prototype.activate = jasmine.createSpy('activate');

    $controllerProvider.register('ParentController', ParentController);
    put('parent', 'parent { <ng-viewport></ng-viewport> }');

    $router.config([
      { path: '/parent', component: 'parent' }
    ]);
    compile('<ng-viewport></ng-viewport>');

    $router.navigate('/parent/user/brian');
    $rootScope.$digest();
    expect(spy).toHaveBeenCalled();
    expect(elt.text()).toBe('parent { hello brian }');

    spy.calls.reset();

    $router.navigate('/parent/user/igor');
    $rootScope.$digest();
    expect(spy).not.toHaveBeenCalled();
    expect(elt.text()).toBe('parent { hello igor }');
  }));


  it('should work with multiple named viewports', inject(function ($router) {
    $router.config([
      { path: '/',         component:  {left: 'one', right: 'two'} },
      { path: '/switched', components: {left: 'two', right: 'one'} }
    ]);
    compile('port 1: <div ng-viewport="left"></div> | ' +
            'port 2: <div ng-viewport="right"></div>');

    $router.navigate('/');
    $rootScope.$digest();
    expect(elt.text()).toBe('port 1: one | port 2: two');

    $router.navigate('/switched');
    $rootScope.$digest();
    expect(elt.text()).toBe('port 1: two | port 2: one');
  }));


  it('should work with nested viewports', inject(function ($router) {
    put('childRouter', '<div>inner { <div ng-viewport></div> }</div>');

    ChildRouterController.$routeConfig = [
      { path: '/b', component: 'one' }
    ];
    function ChildRouterController($router) {}
    $controllerProvider.register('ChildRouterController', ChildRouterController);

    $router.config([
      { path: '/a', component: 'childRouter' }
    ]);
    compile('<div>outer { <div ng-viewport></div> }</div>');

    $router.navigate('/a/b');
    $rootScope.$digest();

    expect(elt.text()).toBe('outer { inner { one } }');
  }));


  it('should work with recursive nested viewports', inject(function ($router) {

    put('router', '<div>recur { <div ng-viewport></div> }</div>');
    $router.config([
      { path: '/recur', component: 'router' },
      { path: '/', component: 'one' }
    ]);

    compile('<div>root { <div ng-viewport></div> }</div>');
    $router.navigate('/');
    $rootScope.$digest();
    expect(elt.text()).toBe('root { one }');
  }));


  it('should update anchor hrefs with the routerLink directive', inject(function ($router) {
    put('one', '<div><a ng-link="two">{{number}}</a></div>');

    $router.config([
      { path: '/a', component: 'one' },
      { path: '/b', component: 'two' }
    ]);
    compile('<div>outer { <div ng-viewport></div> }</div>');

    $router.navigate('/a');
    $rootScope.$digest();

    expect(elt.find('a').attr('href')).toBe('./b');
  }));


  it('should allow params in routerLink directive', inject(function ($router) {
    put('router', '<div>outer { <div ng-viewport></div> }</div>');
    put('one', '<div><a ng-link="two({param: \'lol\'})">{{number}}</a></div>');

    $router.config([
      { path: '/a', component: 'one' },
      { path: '/b/:param', component: 'two' }
    ]);
    compile('<div ng-viewport></div>');

    $router.navigate('/a');
    $rootScope.$digest();

    expect(elt.find('a').attr('href')).toBe('./b/lol');
  }));

  // TODO: test dynamic links


  it('should update the href of links', inject(function ($router) {
    put('router', '<div>outer { <div ng-viewport></div> }</div>');
    put('one', '<div><a ng-link="two({param: one.number})">{{one.number}}</a></div>');

    $router.config([
      { path: '/a', component: 'one' },
      { path: '/b/:param', component: 'two' }
    ]);
    compile('<div ng-viewport></div>');

    $router.navigate('/a');
    $rootScope.$digest();

    expect(elt.find('a').attr('href')).toBe('./b/one');
  }));


  it('should run the activate hook of controllers', inject(function ($router) {
    put('activate', 'hi');

    $controllerProvider.register('ActivateController', ActivateController);
    function ActivateController() {}
    var spy = ActivateController.prototype.activate = jasmine.createSpy('activate');

    $router.config([
      { path: '/a', component: 'activate' }
    ]);
    compile('<div>outer { <div ng-viewport></div> }</div>');

    $router.navigate('/a');
    $rootScope.$digest();

    expect(spy).toHaveBeenCalled();
  }));


  it('should not activate a component when canActivate returns false', inject(function ($router) {
    put('activate', 'hi');
    $controllerProvider.register('ActivateController', ActivateController);
    function ActivateController() {}
    ActivateController.prototype.canActivate = function () {
      return false;
    };
    var spy = ActivateController.prototype.activate = jasmine.createSpy('activate');

    $router.config([
      { path: '/a', component: 'activate' }
    ]);
    compile('<div>outer { <div ng-viewport></div> }</div>');

    $router.navigate('/a');
    $rootScope.$digest();

    expect(spy).not.toHaveBeenCalled();
    expect(elt.text()).toBe('outer {  }');
  }));


  it('should not activate a component when canActivate returns a rejected promise', inject(function ($router, $q) {
    put('activate', 'hi');
    $controllerProvider.register('ActivateController', ActivateController);
    function ActivateController() {}
    ActivateController.prototype.canActivate = function () {
      return $q.reject();
    };
    var spy = ActivateController.prototype.activate = jasmine.createSpy('activate');

    $router.config([
      { path: '/a', component: 'activate' }
    ]);
    compile('<div>outer { <div ng-viewport></div> }</div>');

    $router.navigate('/a');
    $rootScope.$digest();

    expect(spy).not.toHaveBeenCalled();
    expect(elt.text()).toBe('outer {  }');
  }));


  it('should not activate a component when canDeactivate returns false', inject(function ($router) {
    put('activate', 'hi');

    $controllerProvider.register('ActivateController', ActivateController);
    function ActivateController() {}
    ActivateController.prototype.canDeactivate = function () {
      return false;
    };

    $router.config([
      { path: '/a', component: 'activate' },
      { path: '/b', component: 'one' }
    ]);
    compile('<div>outer { <div ng-viewport></div> }</div>');

    $router.navigate('/a');
    $rootScope.$digest();
    expect(elt.text()).toBe('outer { hi }');

    $router.navigate('/b');
    $rootScope.$digest();
    expect(elt.text()).toBe('outer { hi }');
  }));


  it('should not activate a component when canDeactivate returns a rejected promise', inject(function ($router, $q) {
    put('activate', 'hi');

    $controllerProvider.register('ActivateController', ActivateController);
    function ActivateController() {}
    ActivateController.prototype.canDeactivate = function () {
      return $q.reject();
    };

    $router.config([
      { path: '/a', component: 'activate' },
      { path: '/b', component: 'one' }
    ]);
    compile('<div>outer { <div ng-viewport></div> }</div>');

    $router.navigate('/a');
    $rootScope.$digest();
    expect(elt.text()).toBe('outer { hi }');

    $router.navigate('/b');
    $rootScope.$digest();
    expect(elt.text()).toBe('outer { hi }');
  }));


  it('should activate a component when canDeactivate returns true', inject(function ($router) {
    put('activate', 'hi');

    $controllerProvider.register('ActivateController', ActivateController);
    function ActivateController() {}
    ActivateController.prototype.canDeactivate = function () {
      return true;
    };

    $router.config([
      { path: '/a', component: 'activate' },
      { path: '/b', component: 'one' }
    ]);
    compile('<div>outer { <div ng-viewport></div> }</div>');

    $router.navigate('/a');
    $rootScope.$digest();
    expect(elt.text()).toBe('outer { hi }');

    $router.navigate('/b');
    $rootScope.$digest();
    expect(elt.text()).toBe('outer { one }');
  }));


  it('should activate a component when canActivate returns true', inject(function ($router) {
    put('activate', 'hi');

    $controllerProvider.register('ActivateController', ActivateController);
    function ActivateController() {}
    ActivateController.prototype.canActivate = function () {
      return true;
    };
    var spy = ActivateController.prototype.activate = jasmine.createSpy('activate');

    $router.config([
      { path: '/a', component: 'activate' }
    ]);
    compile('<div ng-viewport></div>');

    $router.navigate('/a');
    $rootScope.$digest();

    expect(spy).toHaveBeenCalled();
    expect(elt.text()).toBe('hi');
  }));


  it('should activate a component when canActivate returns a resolved promise', inject(function ($router, $q) {
    put('activate', 'hi');

    $controllerProvider.register('ActivateController', ActivateController);
    function ActivateController() {}
    ActivateController.prototype.canActivate = function () {
      return $q.when();
    };
    var spy = ActivateController.prototype.activate = jasmine.createSpy('activate');

    $router.config([
      { path: '/a', component: 'activate' }
    ]);
    compile('<div ng-viewport></div>');

    $router.navigate('/a');
    $rootScope.$digest();

    expect(spy).toHaveBeenCalled();
    expect(elt.text()).toBe('hi');
  }));


  it('should change location path', inject(function ($router, $location) {
    $router.config([
      { path: '/user', component: 'user' }
    ]);

    compile('<div ng-viewport></div>');

    $router.navigate('/user');
    $rootScope.$digest();

    expect($location.path()).toBe('/user');
  }));

  // TODO: test injecting $scope

  it('should navigate when a link url matches a route', inject(function ($router) {
    $router.config([
      { path: '/', component: 'one' },
      { path: '/two', component: 'two' },
    ]);

    compile('<div><a href="./two">link</a> | <div ng-viewport></div></div>');
    $rootScope.$digest();
    expect(elt.text()).toBe('link | one');
    elt.find('a')[0].click();

    $rootScope.$digest();
    expect(elt.text()).toBe('link | two');
  }));

  // TODO: location path base href
  /*
  it('should change the location according to...', fuction () {
    expect('').toBe('');
  });
  */

  it('should change location to the canonical route', inject(function ($router, $location) {
    compile('<div ng-viewport></div>');

    $router.config([
      { path: '/',     redirectTo: '/user' },
      { path: '/user', component:  'user' }
    ]);

    $router.navigate('/');
    $rootScope.$digest();

    expect($location.path()).toBe('/user');
  }));


  it('should change location to the canonical route with nested components', inject(function ($router, $location) {
    $router.config([
      { path: '/old-parent', redirectTo: '/new-parent' },
      { path: '/new-parent', component:  'childRouter' }
    ]);

    put('childRouter', '<div>inner { <div ng-viewport></div> }</div>');
    function ChildRouterController($router) {}
    ChildRouterController.$routeConfig = [
      { path: '/old-child', redirectTo: '/new-child' },
      { path: '/new-child', component: 'one'},
      { path: '/old-child-two', redirectTo: '/new-child-two' },
      { path: '/new-child-two', component: 'two'}
    ];
    $controllerProvider.register('ChildRouterController', ChildRouterController);

    compile('<div ng-viewport></div>');

    $router.navigate('/old-parent/old-child');
    $rootScope.$digest();

    expect($location.path()).toBe('/new-parent/new-child');
    expect(elt.text()).toBe('inner { one }');

    $router.navigate('/old-parent/old-child-two');
    $rootScope.$digest();

    expect($location.path()).toBe('/new-parent/new-child-two');
    expect(elt.text()).toBe('inner { two }');
  }));


  it('should navigate when the location path changes', inject(function ($router, $location) {
    $router.config([
      { path: '/user', component: 'user' }
    ]);
    compile('<div ng-viewport></div>');

    $location.path('/user');
    $rootScope.$digest();

    expect(elt.text()).toBe('hello blank');
  }));


  function boringController (model, value) {
    return function () {
      this[model] = value;
    };
  }

  function put (name, template) {
    $templateCache.put(componentTemplatePath(name), [200, template, {}]);
  }

  function compile(template) {
    elt = $compile('<div>' + template + '</div>')($rootScope);
    $rootScope.$digest();
    return elt;
  }
});


describe('ngViewport animations', function () {

  var elt,
      ctrl,
      $animate,
      $compile,
      $rootScope,
      $templateCache,
      $controllerProvider;

  beforeEach(function() {
    module('ngAnimate');
    module('ngAnimateMock');
    module('ngNewRouter');
    module(function(_$controllerProvider_) {
      $controllerProvider = _$controllerProvider_;
    });

    inject(function(_$animate_, _$compile_, _$rootScope_, _$templateCache_) {
      $animate = _$animate_;
      $compile = _$compile_;
      $rootScope = _$rootScope_;
      $templateCache = _$templateCache_;
    });

    put('router', '<div ng-viewport></div>');
    $controllerProvider.register('RouterController', function ($router) {
      ctrl = this;
    });

    put('user', '<div>hello {{user.name}}</div>');
    $controllerProvider.register('UserController', function($routeParams) {
      this.name = $routeParams.name || 'blank';
    });
  });

  afterEach(function() {
    expect($animate.queue).toEqual([]);
  });

  it('should work in a simple case', inject(function ($router) {
    var item;

    compile('<div ng-viewport></div>');

    $router.config([
      { path: '/user/:name', component: 'user' }
    ]);

    $router.navigate('/user/brian');
    $rootScope.$digest();
    expect(elt.text()).toBe('hello brian');

    // "user" component enters
    item = $animate.queue.shift();
    expect(item.event).toBe('enter');

    // navigate to pete
    $router.navigate('/user/pete');
    $rootScope.$digest();
    expect(elt.text()).toBe('hello pete');

    // "user pete" component enters
    item = $animate.queue.shift();
    expect(item.event).toBe('enter');
    expect(item.element.text()).toBe('hello pete');

    // "user brian" component leaves
    item = $animate.queue.shift();
    expect(item.event).toBe('leave');
    expect(item.element.text()).toBe('hello brian');

  }));

  function put (name, template) {
    $templateCache.put(componentTemplatePath(name), [200, template, {}]);
  }

  function compile(template) {
    elt = $compile('<div>' + template + '</div>')($rootScope);
    $rootScope.$digest();
    return elt;
  }
});

function componentTemplatePath(name) {
  return './components/' + dashCase(name) + '/' + dashCase(name) + '.html';
}

function dashCase(str) {
  return str.replace(/([A-Z])/g, function ($1) {
    return '-' + $1.toLowerCase();
  });
}
