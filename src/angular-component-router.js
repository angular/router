var ngOutlet = require('./ngOutlet');
var ngLinkDirective = require('./ngLink');

var exceptions = require('angular2/src/facade/exceptions');
var BaseException = exceptions.BaseException;
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
    // Unfortunately, $location doesn't expose what the current hashPrefix is
    // So we have to monkey patch the $locationProvider to capture this value
    .provider('$locationHashPrefix', ['$locationProvider', $locationHashPrefixProvider])
    // Because Angular 1 has no notion of a root component, we use an object with unique identity
    // to represent this. Can be overloaded with a component name
    .value('$routerRootComponent', new Object())
    .factory('$rootRouter', ['$q', '$location', '$browser', '$rootScope', '$injector', '$routerRootComponent', routerFactory]);

function $locationHashPrefixProvider($locationProvider) {

  // Get hold of the original hashPrefix method
  var hashPrefixFn = $locationProvider.hashPrefix.bind($locationProvider);

  // Read the current hashPrefix (in case it was set before this monkey-patch occurred)
  var hashPrefix = hashPrefixFn();

  // Override the helper so that we can read any changes to the prefix (after this monkey-patch)
  $locationProvider.hashPrefix = function(prefix) {
    if (angular.isDefined(prefix)) {
      hashPrefix = prefix;
    }
    return hashPrefixFn(prefix);
  }

  // Return the final hashPrefix as the value of this service
  this.$get = function() { return hashPrefix; };
}

function routerFactory($q, $location, $browser, $rootScope, $injector, $routerRootComponent, $locationHashPrefix) {

  function getAnnotation(componentName, annotationName) {
    var serviceName = componentName + 'Directive';
    if ($injector.has(serviceName)) {
      var definitions = $injector.get(serviceName);
      if (definitions.length > 1) {
        throw new BaseException('too many directives named "' + componentName + '"');
      }
      return definitions[0][annotationName];
    } else {
      throw new BaseException('directive "' + componentName + '" is not registered');
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
    var $canActivate = getAnnotation(directiveName, '$canActivate');
    return $canActivate && function (next, prev) {
      return $injector.invoke($canActivate, null, {
        $nextInstruction: next,
        $prevInstruction: prev
      });
    };
  };

  var Location = require('./router/location/location').Location;
  var location = new Location($location, $rootScope);

  var routeRegistryFactory = require('./router/route_registry_factory');
  var registry = routeRegistryFactory(getAnnotation, $routerRootComponent);

  var RootRouter = require('./router/router').RootRouter;
  var router = new RootRouter(registry, location, $routerRootComponent);

  router.subscribe(function () {
    $rootScope.$broadcast('$routeChangeSuccess', {});
  });

  return router;
}
