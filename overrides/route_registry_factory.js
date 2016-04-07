var RouteRegistry = require('./route_registry').RouteRegistry;
var lang = require('angular2/src/facade/lang');
var isString = lang.isString;

module.exports = function routeRegistryFactory(getAnnotation, rootComponent) {

  // Create a monkey patched version of the registry
  var routeRegistry = new RouteRegistry(rootComponent);

  routeRegistry.configFromComponent = function (component) {
    var that = this;
    if (isString(component)) {
      // Don't read the annotations component a type more than once –
      // this prevents an infinite loop if a component routes recursively.
      if (this._rules.has(component)) {
        return;
      }
      var $routeConfig = getAnnotation(component, '$routeConfig');
      if (angular.isArray($routeConfig)) {
        $routeConfig.forEach(function (config) {
          var loader = config.loader;
          if (isPresent(loader)) {
            config = angular.extend({}, config, { loader: () => $injector.invoke(loader) });
          }
          that.config(component, config);
        });
      }
    }
  };

  return routeRegistry;
};