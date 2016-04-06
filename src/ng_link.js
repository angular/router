/**
 * @name ngLink
 * @description
 * Lets you link to different parts of the app, and automatically generates hrefs.
 *
 * ## Use
 * The directive uses a simple syntax: `ng-link="componentName({ param: paramValue })"`
 *
 * ### Example
 *
 * ```js
 * angular.module('myApp', ['ngComponentRouter'])
 *   .controller('AppController', ['$rootRouter', function($rootRouter) {
 *     $rootRouter.config({ path: '/user/:id', component: 'user' });
 *     this.user = { name: 'Brian', id: 123 };
 *   });
 * ```
 *
 * ```html
 * <div ng-controller="AppController as app">
 *   <a ng-link="user({id: app.user.id})">{{app.user.name}}</a>
 * </div>
 * ```
 */
module.exports = function ngLinkDirective($rootRouter, $parse) {
  return {require: '?^^ngOutlet', restrict: 'A', link: ngLinkDirectiveLinkFn};

  function ngLinkDirectiveLinkFn(scope, element, attrs, ctrl) {
    var router = (ctrl && ctrl.$$router) || $rootRouter;
    if (!router) {
      return;
    }

    var instruction = null;
    var link = attrs.ngLink || '';

    function getLink(params) {
      instruction = router.generate(params);

      scope.$watch(function() { return router.isRouteActive(instruction); },
                   function(active) {
                     if (active) {
                       element.addClass('ng-link-active');
                     } else {
                       element.removeClass('ng-link-active');
                     }
                   });

      return './' + instruction.toRootUrl();
    }

    var routeParamsGetter = $parse(link);
    // we can avoid adding a watcher if it's a literal
    if (routeParamsGetter.constant) {
      var params = routeParamsGetter();
      element.attr('href', getLink(params));
    } else {
      scope.$watch(() => routeParamsGetter(scope), params => element.attr('href', getLink(params)),
                   true);
    }

    element.on('click', event => {
      if (event.which !== 1 || !instruction) {
        return;
      }

      $rootRouter.navigateByInstruction(instruction);
      event.preventDefault();
    });
  }
};