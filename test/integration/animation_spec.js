'use strict';

fdescribe('ngOutlet animations', function () {

  function createTestModule() {
    angular.module('testMod', ['ngAnimate', 'ngAnimateMock', 'ngComponentRouter'])
    .component('userCmp', {
      template: '<div>hello {{$ctrl.$routeParams.name}}</div>',
      controller: function() {
        this.$routerOnActivate = function(next) {
          this.$routeParams = next.params;
        };
      }
    });
    module('testMod');
  }

  it('should work in a simple case', function () {
    var item;

    createTestModule();

    inject(function($compile, $rootScope, $animate, $rootRouter) {
      var elt = $compile('<div><div ng-outlet></div></div>')($rootScope);

      $rootRouter.config([
        { path: '/user/:name', component: 'userCmp' }
      ]);

      $rootRouter.navigateByUrl('/user/brian');
      $rootScope.$digest();
      expect(elt.text()).toBe('hello brian');

      // "user" component enters
      item = $animate.queue.shift();
      expect(item.event).toBe('enter');

      // navigate to pete
      $rootRouter.navigateByUrl('/user/pete');
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

      expect($animate.queue).toEqual([]);
    });
  });
});
