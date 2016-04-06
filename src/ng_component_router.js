var ngOutlet = require('./ng_outlet');
var ngLinkDirective = require('./ng_link');

var lang = require('angular2/src/facade/lang');
var isString = lang.isString;
var isPresent = lang.isPresent;

/*
 * A module for adding new a routing system Angular 1.
 */
angular.module('ngComponentRouter', [])
    .directive('ngOutlet', ['$animate', '$q', '$rootRouter', ngOutlet.ngOutletDirective])
    .directive('ngOutlet', ['$compile', ngOutlet.ngOutletFillContentDirective])
    .directive('$router', ['$q', ngOutlet.routerTriggerDirective])
    .directive('ngLink', ['$rootRouter', '$parse', ngLinkDirective])
    .value('$route', null) // can be overloaded with ngRouteShim
    // Because Angular 1 has no notion of a root component, we use an object with unique identity
    // to represent this. Can be overloaded with a component name
    .value('$routerRootComponent', new Object())
    .factory('$rootRouter', ['$q', '$location', '$browser', '$rootScope', '$injector', '$routerRootComponent', routerFactory]);

function routerFactory($q, $location, $browser, $rootScope, $injector, $routerRootComponent) {

  // Helper function for finding the component controllers
  function getComponentConstructor(name) {
    var serviceName = name + 'Directive';
    if ($injector.has(serviceName)) {
      var definitions = $injector.get(serviceName);
      if (definitions.length > 1) {
        throw new BaseException('too many directives named "' + name + '"');
      }
      return definitions[0].controller;
    } else {
      throw new BaseException('directive "' + name + '" is not registered');
    }
  }

  // Monkey-patch promises to have access to the $q service
  var async = require('angular2/src/facade/async');
  async.PromiseWrapper = {
    resolve: function (reason) {
      return $q.when(reason);
    },

    reject: function (reason) {
      return $q.reject(reason);
    },

    catchError: function (promise, fn) {
      return promise.then(null, fn);
    },
    all: function (promises) {
      return $q.all(promises);
    }
  };

  // Monkey-patch assertions about the type of the "component" property in a route config
  var routeConfigNormalizer = require('./router/route_config/route_config_normalizer');
  routeConfigNormalizer.assertComponentExists = function () {};

  // Monkey-patch to look for the hook as a static method on the controller class
  var routeLifecycleReflector = require('./router/lifecycle/route_lifecycle_reflector');
  routeLifecycleReflector.getCanActivateHook = function(directiveName) {
    var controller = getComponentConstructor(directiveName);
    return controller.$canActivate && function (next, prev) {
      return $injector.invoke(controller.$canActivate, null, {
        $nextInstruction: next,
        $prevInstruction: prev
      });
    };
  };

  var locationFactory = require('./location_factory');
  var location = locationFactory($location, $rootScope);

  var routeRegistryFactory = require('./route_registry_factory');
  var registry = routeRegistryFactory(getComponentConstructor, $routerRootComponent);

  var RootRouter = require('./router/router').RootRouter;
  var router = new RootRouter(registry, location, $routerRootComponent);

  router.subscribe(function () {
    $rootScope.$broadcast('$routeChangeSuccess', {});
  });

  return router;
}
