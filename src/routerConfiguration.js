import {extend, getWildcardPath} from './util';

export class RouterConfiguration{
  constructor(router){
    this.router = router;
  }

  map(pattern, config) {
    if (Array.isArray(pattern)) {
      for (var i = 0; i < pattern.length; i++) {
          this.map(pattern[i]);
      }

      return this;
    }

    if (typeof pattern == 'string') {
      if (!config) {
          config = {};
      } else if (typeof config == 'string') {
          config = { componentUrl: config };
      }

      config.pattern = pattern;
    } else {
      config = pattern;
    }

    return this.mapRoute(config);
  }

  mapRoute(config) {
    if (Array.isArray(config.pattern)) {
      var navModel = {};

      for (var i = 0, length = config.pattern.length; i < length; i++) {
        var current = extend({}, config);
        current.pattern = config.pattern[i];
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
    config.pattern = ensureConfigValue(config, 'pattern', this.derivePattern);
    config.title = ensureConfigValue(config, 'title', this.deriveTitle);
    config.componentUrl = ensureConfigValue(config, 'componentUrl', this.deriveComponentUrl);
  }

  deriveName(config) {
    return config.title || (config.pattern ? stripParametersFromPattern(config.pattern) : config.componentUrl);
  }

  derivePattern(config) {
    return config.componentUrl || config.name;
  }

  deriveTitle(config) {
    var value = config.name;
    return value.substring(0, 1).toUpperCase() + value.substring(1);
  }

  deriveComponentUrl(config) {
    return stripParametersFromPattern(config.pattern);
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

function stripParametersFromPattern(pattern) {
  var colonIndex = pattern.indexOf(':');
  var length = colonIndex > 0 ? colonIndex - 1 : pattern.length;
  return pattern.substring(0, length);
}