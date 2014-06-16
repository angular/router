import {extend, getWildcardPath} from './util';

export class RouterConfiguration{
  constructor(router){
    this.router = router;
  }

  map(route, config) {
    if (Array.isArray(route)) {
      for (var i = 0; i < route.length; i++) {
          this.map(route[i]);
      }

      return this;
    }

    if (typeof route == 'string') {
      if (!config) {
          config = {};
      } else if (typeof config == 'string') {
          config = { moduleId: config };
      }

      config.route = route;
    } else {
      config = route;
    }

    return this.mapRoute(config);
  }

  mapRoute(config) {
    if (Array.isArray(config.route)) {
      var navModel = {};

      for (var i = 0, length = config.route.length; i < length; i++) {
        var current = extend({}, config);
        current.route = config.route[i];
        this.configureRoute(current, navModel);
      }
    } else {
      this.configureRoute(config);
    }

    return this;
  }

  configureRoute(config, navModel) {
    this.ensureDefaultsForRouteConfig(config);
    this.router.addRoute(config, navModel);
  }

  ensureDefaultsForRouteConfig(config) {
    config.name =  ensureConfigValue(config, 'name', this.deriveName);
    config.route = ensureConfigValue(config, 'route', this.deriveRoute);
    config.title = ensureConfigValue(config, 'title', this.deriveTitle);
    config.moduleId = ensureConfigValue(config, 'moduleId', this.deriveModuleId);

    this.ensureHREF(config);
  }

  deriveName(config) {
    return config.title || (config.route ? stripParametersFromRoute(config.route) : config.moduleId);
  }

  deriveRoute(config) {
    return config.moduleId || config.name;
  }

  deriveTitle(config) {
    var value = config.name;
    return value.substring(0, 1).toUpperCase() + value.substring(1);
  }

  deriveModuleId(config) {
    return stripParametersFromRoute(config.route);
  }

  ensureHREF(config) {
    var that = this.router;

    if (config.href) {
      return;
    }

    config.href = '#' + config.route;
  }

  mapUnknownRoutes(config) {
    this.router.handleUnknownRoutes(callback);
    return this;
  }
}

function ensureConfigValue(config, property, getter) {
  var value = config[property];

  if (value || value == '') {
    return value;
  }

  return getter(config);
}

function stripParametersFromRoute(route) {
  var colonIndex = route.indexOf(':');
  var length = colonIndex > 0 ? colonIndex - 1 : route.length;
  return route.substring(0, length);
}