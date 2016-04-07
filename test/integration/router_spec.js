'use strict';

fdescribe('router', function () {

  function createTestModule() {
    var mod = angular.module('testMod', ['ngComponentRouter'])
      .value('$routerRootComponent', 'app');
    module('testMod');
    return mod;
  }

  fit('should work with a provided root component', function() {
    console.log(1);
    createTestModule()
      .component('homeCmp', {template: 'Home'})
      .component('otherCmp', {template: 'Other'})
      .component('app', {
        template: '<div ng-outlet></div>',
        $routeConfig: [
          { path: '/home', component: 'homeCmp' },
          { path: '/other', component: 'otherCmp' }
        ]
      });

    var elt = compileApp();

    inject(function($location, $rootScope) {
      $location.path('/home');
      $rootScope.$digest();
      expect(elt.text()).toBe('Home');

      $location.path('/');
      $rootScope.$digest();

      $location.path('/other');
      $rootScope.$digest();
      expect(elt.text()).toBe('Other');

      $location.path('/home');
      $rootScope.$digest();
      expect(elt.text()).toBe('Home');
    });
  });

  fit('should bind the component to the current router', function() {
    console.log(2);
    var router;
    createTestModule()
      .component('homeCmp', {
        bindings: { $router: '=' },
        controller: function($scope, $element) {
          this.$routerOnActivate = function() {
            router = this.$router;
          };
        },
        template: 'Home'
      })
      .component('app', {
        template: '<div ng-outlet></div>',
        $routeConfig: [
          { path: '/home', component: 'homeCmp' }
        ]
      });

    var elt = compileApp();

    inject(function($location, $rootScope) {
      $location.path('/home');
      $rootScope.$digest();
      console.log(elt);
      var homeElement = elt.find('home-cmp');
      expect(homeElement.text()).toBe('Home');
      expect(homeElement.isolateScope().$ctrl.$router).toBeDefined();
      expect(router).toBeDefined();
    })
  });

  it('should work when an async route is provided route data', function() {
    registerComponent('homeCmp', {
      template: 'Home ({{$ctrl.isAdmin}})',
      $routerOnActivate: function(next, prev) {
        this.isAdmin = next.routeData.data.isAdmin;
      }
    });

    registerComponent('app', {
      template: '<div ng-outlet></div>',
      $routeConfig: [
        { path: '/', loader: function($q) { return $q.when('homeCmp'); }, data: { isAdmin: true } }
      ]
    });

    module('testMod');
    compileApp();

    inject(function($location, $rootScope) {
      $location.path('/');
      $rootScope.$digest();
      expect(elt.text()).toBe('Home (true)');
    });
  });

  it('should work with a templateUrl component', function() {

    var $routerOnActivate = jasmine.createSpy('$routerOnActivate');

    registerComponent('homeCmp', {
      templateUrl: 'homeCmp.html',
      $routerOnActivate: $routerOnActivate
    });

    registerComponent('app', {
      template: '<div ng-outlet></div>',
      $routeConfig: [
        { path: '/', component: 'homeCmp' }
      ]
    });

    module('testMod');

    inject(function($location, $rootScope, $httpBackend) {

      $httpBackend.expectGET('homeCmp.html').respond('Home');

      compileApp();

      $location.path('/');
      $rootScope.$digest();
      $httpBackend.flush();
      var homeElement = elt.find('home-cmp');
      expect(homeElement.text()).toBe('Home');
      expect($routerOnActivate).toHaveBeenCalled();
    })
  });

  it('should provide the current instruction', function() {
    registerComponent('homeCmp', {
      template: 'Home ({{homeCmp.isAdmin}})'
    });

    registerComponent('app', {
      template: '<div ng-outlet></div>',
      $routeConfig: [
        { path: '/', component: 'homeCmp', name: 'Home' }
      ]
    });

    module('testMod');

    inject(function($rootScope, $rootRouter, $location) {
      compileApp();

      $location.path('/');
      $rootScope.$digest();
      var instruction = $rootRouter.generate(['/Home']);
      expect($rootRouter.currentInstruction).toEqual(instruction);
    });
  });

  it('should provide the root level router', function() {
    registerComponent('homeCmp', {
      template: 'Home ({{homeCmp.isAdmin}})',
      bindings: {
        $router: '<'
      }
    });

    registerComponent('app', {
      template: '<div ng-outlet></div>',
      $routeConfig: [
        { path: '/', component: 'homeCmp', name: 'Home' }
      ]
    });

    module('testMod');

    inject(function($rootScope, $rootRouter, $location) {
      compileApp();

      $location.path('/');
      $rootScope.$digest();
      var homeElement = elt.find('home-cmp');
      expect(homeElement.isolateScope().$ctrl.$router.root).toEqual($rootRouter);
    });
  });

  function compileApp() {
    var elt;
    inject(function($compile, $rootScope) {
      elt = $compile('<div><app></app</div>')($rootScope);
      $rootScope.$digest();
    });
    return elt;
  }
});
