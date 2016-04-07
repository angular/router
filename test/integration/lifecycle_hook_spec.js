'use strict';

fdescribe('Navigation lifecycle', function () {

  function createTestModule(onActivate, onDeactivate) {
    return angular.module('testMod', ['ngComponentRouter'])
      .component('testCmp', {
        controller: function() {
          this.$routerOnActivate = onActivate;
          this.$routerOnDeactivate = onDeactivate;
        }
      })
      .component('oneCmp', {
        template: '<div>{{$ctrl.number}}</div>',
        controller: function () {this.number = 'one'}
      })
      .component('twoCmp', {
        template: '<div><a ng-link="[\'/Two\']">{{$ctrl.number}}</a></div>',
        controller: function () {this.number = 'two'}
      })
  }

  it('should run the activate hook of controllers', function () {
    var spy = jasmine.createSpy('activate');
    createTestModule(spy);
    module('testMod');
    inject(function($rootRouter, $compile, $rootScope) {
      $rootRouter.config([
        { path: '/a', component: 'testCmp' }
      ]);
      $compile('<div>outer { <div ng-outlet></div> }</div>')($rootScope);

      $rootRouter.navigateByUrl('/a');
      $rootScope.$digest();

      expect(spy).toHaveBeenCalled();
    });
  });


  it('should pass instruction into the activate hook of a controller', function () {
    var spy = jasmine.createSpy('activate');
    createTestModule(spy);
    module('testMod');
    inject(function($rootRouter, $compile, $rootScope) {
      $rootRouter.config([
        { path: '/user/:name', component: 'testCmp' }
      ]);
      $compile('<div><div ng-outlet></div></div>')($rootScope);

      $rootRouter.navigateByUrl('/user/brian');
      $rootScope.$digest();

      expect(spy).toHaveBeenCalledWith(instructionFor('testCmp'), undefined);
    });
  });


  it('should pass previous instruction into the activate hook of a controller', function () {
    var spy = jasmine.createSpy('activate');
    createTestModule(spy);
    module('testMod');
    inject(function($rootRouter, $compile, $rootScope) {
      $rootRouter.config([
        { path: '/user/:name', component: 'oneCmp' },
        { path: '/post/:id', component: 'testCmp' }
      ]);

      inject(function($rootRouter, $compile, $rootScope) {
        $compile('<div><div ng-outlet></div></div>')($rootScope);
        $rootRouter.navigateByUrl('/user/brian');
        $rootScope.$digest();
        $rootRouter.navigateByUrl('/post/123');
        $rootScope.$digest();
        expect(spy).toHaveBeenCalledWith(instructionFor('testCmp'),
                                        instructionFor('oneCmp'));
      });
    });
  });

  it('should inject $scope into the controller constructor', function () {
    var injectedScope;

    createTestModule()
    .component('scopeCmp', {
      controller: function ($scope) {
        injectedScope = $scope;
      }
    });
    module('testMod');
    inject(function($rootRouter, $compile, $rootScope) {
      $rootRouter.config([
        { path: '/user', component: 'scopeCmp' }
      ]);
      $compile('<div><div ng-outlet></div></div>')($rootScope);

      $rootRouter.navigateByUrl('/user');
      $rootScope.$digest();

      expect(injectedScope).toBeDefined();
      expect(injectedScope.$root).toBe($rootScope);
    });
  });


  it('should run the deactivate hook of controllers', function () {
    var spy = jasmine.createSpy('deactivate');
    createTestModule(undefined, spy);

    module('testMod');
    inject(function($rootRouter, $compile, $rootScope) {
      $rootRouter.config([
        { path: '/a', component: 'testCmp' },
        { path: '/b', component: 'oneCmp' }
      ]);
      $compile('<div><div ng-outlet></div></div>')($rootScope);

      $rootRouter.navigateByUrl('/a');
      $rootScope.$digest();
      $rootRouter.navigateByUrl('/b');
      $rootScope.$digest();
      expect(spy).toHaveBeenCalled();
    });
  });

  it('should pass instructions into the deactivate hook of controllers', function () {
    var spy = jasmine.createSpy('deactivate');
    createTestModule(undefined, spy);

    module('testMod');
    inject(function($rootRouter, $compile, $rootScope) {
      $rootRouter.config([
        { path: '/user/:name', component: 'testCmp' },
        { path: '/post/:id', component: 'oneCmp' }
      ]);
      $compile('<div><div ng-outlet></div></div>')($rootScope);

      $rootRouter.navigateByUrl('/user/brian');
      $rootScope.$digest();
      $rootRouter.navigateByUrl('/post/123');
      $rootScope.$digest();
      expect(spy).toHaveBeenCalledWith(instructionFor('oneCmp'),
                                      instructionFor('testCmp'));
    });
  });

  it('should run the deactivate hook before the activate hook', function () {
    var log = [];

    var onActivate = function() {
        log.push('activate');
    };
    var onDeactivate = function() {
        log.push('deactivate');
    };
    createTestModule(onActivate)
    .component('otherCmp', {
      controller: function() {
        this.$routerOnDeactivate = onDeactivate;
      }
    });

    module('testMod');
    inject(function($rootRouter, $compile, $rootScope) {
      $rootRouter.config([
        { path: '/a', component: 'testCmp' },
        { path: '/b', component: 'otherCmp' }
      ]);
      $compile('<div>outer { <div ng-outlet></div> }<div>')($rootScope);

      $rootRouter.navigateByUrl('/b');
      $rootScope.$digest();
      $rootRouter.navigateByUrl('/a');
      $rootScope.$digest();

      expect(log).toEqual(['deactivate', 'activate']);
    });
  });

  it('should reuse a component when the routerCanReuse hook returns true', function () {
    var log = [];
    var cmpInstanceCount = 0;

    function ReuseCmp() {
      cmpInstanceCount++;
      this.$routerCanReuse = function () { return true; };
      this.$routerOnReuse = function (next, prev) {
        log.push('reuse: ' + prev.urlPath + ' -> ' + next.urlPath);
      }
    }

    createTestModule()
    .component('reuseCmp', {
      template: 'reuse {<ng-outlet></ng-outlet>}',
      $routeConfig: [
        {path: '/a', component: 'oneCmp'},
        {path: '/b', component: 'twoCmp'}
      ],
      controller: ReuseCmp,
    });

    module('testMod');
    inject(function($rootRouter, $compile, $rootScope) {
      $rootRouter.config([
        { path: '/on-reuse/:number/...', component: 'reuseCmp' },
        { path: '/two', component: 'twoCmp', name: 'Two'}
      ]);
      var elt = $compile('<div>outer { <div ng-outlet></div> }</div>')($rootScope);

      $rootRouter.navigateByUrl('/on-reuse/1/a');
      $rootScope.$digest();

      /// TODO(pete): decide how to deal with route-change -> location-change -> route-reuse is acceptable
      // expect(log).toEqual([]);
      expect(cmpInstanceCount).toBe(1);
      expect(elt.text()).toBe('outer { reuse {one} }');

      $rootRouter.navigateByUrl('/on-reuse/2/b');
      $rootScope.$digest();
      /// TODO(pete): decide how to deal with route-change -> location-change -> route-reuse is acceptable
      // expect(log).toEqual(['reuse: on-reuse/1 -> on-reuse/2']);
      expect(cmpInstanceCount).toBe(1);
      expect(elt.text()).toBe('outer { reuse {two} }');
    });
  });

  it('should not reuse a component when the routerCanReuse hook returns false', function () {
    var log = [];
    var cmpInstanceCount = 0;

    function NeverReuseCmp() {
      cmpInstanceCount++;
      this.$routerCanReuse = function() { return false; };
      this.$routerOnReuse = function (next, prev) {
        log.push('reuse: ' + prev.urlPath + ' -> ' + next.urlPath);
      };
    }

    createTestModule()
    .component('neverReuse', {
      template: 'reuse {<ng-outlet></ng-outlet>}',
      $routeConfig: [
        {path: '/a', component: 'oneCmp'},
        {path: '/b', component: 'twoCmp'}
      ],
      controller: NeverReuseCmp
    });

    module('testMod');
    inject(function($rootRouter, $compile, $rootScope) {
      $rootRouter.config([
        { path: '/never-reuse/:number/...', component: 'neverReuse' },
        { path: '/two', component: 'twoCmp', name: 'Two'}
      ]);
      var elt = $compile('<div>outer { <div ng-outlet></div> }</div>')($rootScope);

      $rootRouter.navigateByUrl('/never-reuse/1/a');
      $rootScope.$digest();
      /// TODO(pete): decide how to deal with route-change -> location-change -> route-reuse is acceptable
      // expect(log).toEqual([]);
      // expect(cmpInstanceCount).toBe(1);
      expect(elt.text()).toBe('outer { reuse {one} }');

      $rootRouter.navigateByUrl('/never-reuse/2/b');
      $rootScope.$digest();
      /// TODO(pete): decide how to deal with route-change -> location-change -> route-reuse is acceptable
      // expect(log).toEqual([]);
      // expect(cmpInstanceCount).toBe(2);
      expect(elt.text()).toBe('outer { reuse {two} }');
    });
  });

  // TODO: need to solve getting ahold of canActivate hook
  it('should not activate a component when canActivate returns false', function () {
    var canActivateSpy = jasmine.createSpy('canActivate').and.returnValue(false);
    var onActivateSpy = jasmine.createSpy('activate');

    createTestModule()
    .component('canActivateCmp', {
      template: 'hi',
      controller: function() {
        this.$routerOnActivate = onActivateSpy;
      },
      $canActivate: canActivateSpy
    });

    module('testMod');
    inject(function($rootRouter, $compile, $rootScope) {
      $rootRouter.config([
        { path: '/a', component: 'canActivateCmp' }
      ]);
      var elt = $compile('<div>outer { <div ng-outlet></div> }</div>')($rootScope);

      $rootRouter.navigateByUrl('/a');
      $rootScope.$digest();

      expect(canActivateSpy).toHaveBeenCalled();
      expect(onActivateSpy).not.toHaveBeenCalled();
      expect(elt.text()).toBe('outer {  }');
    });
  });

  it('should activate a component when canActivate returns true', function () {
    var activateSpy = jasmine.createSpy('activate');
    var canActivateSpy = jasmine.createSpy('canActivate').and.returnValue(true);
    createTestModule()
    .component('canActivateCmp', {
      template: 'hi',
      controller: function() {
        this.$routerOnActivate = activateSpy;
      },
      $canActivate: canActivateSpy
    });

    module('testMod');
    inject(function($rootRouter, $compile, $rootScope) {
      $rootRouter.config([
        { path: '/a', component: 'canActivateCmp' }
      ]);
      var elt = $compile('<div><div ng-outlet></div></div>')($rootScope);

      $rootRouter.navigateByUrl('/a');
      $rootScope.$digest();

      expect(canActivateSpy).toHaveBeenCalled();
      expect(activateSpy).toHaveBeenCalled();
      expect(elt.text()).toBe('hi');
    });
  });

  it('should activate a component when canActivate returns a resolved promise', function() {
    var spy = jasmine.createSpy('activate');
    createTestModule()
    .component('activateCmp', {
      template: 'hi',
      $canActivate: function ($q) { return $q.when(true); },
      controller: function() {
        this.$routerOnActivate = spy;
      }
    });

    module('testMod');
    inject(function($rootRouter, $compile, $rootScope) {

      $rootRouter.config([
        { path: '/a', component: 'activateCmp' }
      ]);
      var elt = $compile('<div><div ng-outlet></div></div>')($rootScope);

      $rootRouter.navigateByUrl('/a');
      $rootScope.$digest();

      expect(spy).toHaveBeenCalled();
      expect(elt.text()).toBe('hi');
    });
  });


  it('should inject into the canActivate hook of controllers', function() {
    var spy = jasmine.createSpy('canActivate').and.returnValue(true);
    createTestModule()
    .component('activateCmp', {
      $canActivate: spy
    });

    spy.$inject = ['$nextInstruction', '$http'];

    module('testMod');
    inject(function($rootRouter, $compile, $rootScope, $http) {

      $rootRouter.config([
        { path: '/user/:name', component: 'activateCmp' }
      ]);
      $compile('<div><div ng-outlet></div></div>')($rootScope);

      $rootRouter.navigateByUrl('/user/brian');
      $rootScope.$digest();

      expect(spy).toHaveBeenCalled();
      var args = spy.calls.mostRecent().args;
      expect(args[0].params).toEqual(jasmine.objectContaining({name: 'brian'}));
      expect(args[1]).toBe($http);
    })
  });


  it('should not navigate when routerCanDeactivate returns false', function () {
    createTestModule()
    .component('deactivateCmp', {
      template: 'hi',
      controller: function() {
        this.$routerCanDeactivate = function () { return false; };
      }
    });

    module('testMod');
    inject(function($rootRouter, $compile, $rootScope) {
      $rootRouter.config([
        { path: '/a', component: 'deactivateCmp' },
        { path: '/b', component: 'oneCmp' }
      ]);
      var elt = $compile('<div>outer { <div ng-outlet></div> }</div>')($rootScope);

      $rootRouter.navigateByUrl('/a');
      $rootScope.$digest();
      expect(elt.text()).toBe('outer { hi }');

      $rootRouter.navigateByUrl('/b');
      $rootScope.$digest();
      expect(elt.text()).toBe('outer { hi }');
    });
  });

  it('should navigate when routerCanDeactivate returns true', function () {
    createTestModule()
    .component('deactivateCmp', {
      template: 'hi',
      controller: function() {
        this.$routerCanDeactivate = function () { return true; };
      }
    });

    module('testMod');
    inject(function($rootRouter, $compile, $rootScope) {
      $rootRouter.config([
        { path: '/a', component: 'deactivateCmp' },
        { path: '/b', component: 'oneCmp' }
      ]);
      var elt = $compile('<div>outer { <div ng-outlet></div> }</div>')($rootScope);

      $rootRouter.navigateByUrl('/a');
      $rootScope.$digest();
      expect(elt.text()).toBe('outer { hi }');

      $rootRouter.navigateByUrl('/b');
      $rootScope.$digest();
      expect(elt.text()).toBe('outer { one }');
    });
  });

  it('should activate a component when canActivate returns true', function () {
    var spy = jasmine.createSpy('activate');
    createTestModule()
    .component('activateCmp', {
      template: 'hi',
      controller: function() {
        this.$routerOnActivate = spy;
      },
      $canActivate: function () { return true; }
    });

    module('testMod');
    inject(function($rootRouter, $compile, $rootScope) {
      $rootRouter.config([
        { path: '/a', component: 'activateCmp' }
      ]);
      var elt = $compile('<div><div ng-outlet></div></div>')($rootScope);

      $rootRouter.navigateByUrl('/a');
      $rootScope.$digest();

      expect(spy).toHaveBeenCalled();
      expect(elt.text()).toBe('hi');
    });
  });

  it('should pass instructions into the routerCanDeactivate hook of controllers', function () {
    var spy = jasmine.createSpy('routerCanDeactivate').and.returnValue(true);
    createTestModule()
    .component('deactivateCmp', {
      controller: function() {
        this.$routerCanDeactivate = spy;
      }
    });

    module('testMod');
    inject(function($rootRouter, $compile, $rootScope) {
      $rootRouter.config([
        { path: '/user/:name', component: 'deactivateCmp' },
        { path: '/post/:id', component: 'oneCmp' }
      ]);
      $compile('<div><div ng-outlet></div></div>')($rootScope);

      $rootRouter.navigateByUrl('/user/brian');
      $rootScope.$digest();
      $rootRouter.navigateByUrl('/post/123');
      $rootScope.$digest();
      expect(spy).toHaveBeenCalledWith(instructionFor('oneCmp'),
                                      instructionFor('deactivateCmp'));
    });
  });


  function instructionFor(componentType) {
    return jasmine.objectContaining({componentType: componentType});
  }
});
