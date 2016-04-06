var RouteRegistry = require('./router/route_registry').RouteRegistry;

module.exports = function routeRegistryFactory(getComponentConstructor, rootComponent) {

  // Create a monkey patched version of the registry
  var routeRegistry = new RouteRegistry(rootComponent);

  // Monkey-patch the configFromComponent method
  routeRegistry.configFromComponent = function (component) {
    var that = this;
    if (angular.isString(component)) {
      // Don't read the annotations component a type more than once –
      // this prevents an infinite loop if a component routes recursively.
      if (this._rules.has(component)) {
        return;
      }
      var controller = getComponentConstructor(component);
      if (angular.isArray(controller.$routeConfig)) {
        controller.$routeConfig.forEach(function (config) {
          var loader = config.loader;
          if (loader) {
            config = angular.extend({}, config, { loader: () => $injector.invoke(loader) });
          }
          that.config(component, config);
        });
      }
    }
  };

  return routeRegistry;
};