import RouteRecognizer from 'route-recognizer';
import {NavigationContext} from './navigationContext';
import {NavigationInstruction} from './navigationInstruction';
import {RouterConfiguration} from './routerConfiguration';
import {getWildCardName} from './util';

//TODO(Rob): fix the way you are importing in the examples so we can remove this
RouteRecognizer = typeof RouteRecognizer === 'function' ?
    RouteRecognizer : RouteRecognizer['default'];

export class Router {
  constructor(history) {
    this.history = history;
    this.viewPorts = {};
    this.reset();
    this.baseUrl = '';
  }

  registerViewPort(viewPort, name) {
    name = name || 'default';

    if (typeof this.viewPorts[name] == 'function') {
      var callback = this.viewPorts[name];
      this.viewPorts[name] = viewPort;
      callback(viewPort);
    } else {
      this.viewPorts[name] = viewPort;
    }
  }

  refreshBaseUrl() {
    if (this.parent) {
      var baseUrl = getBaseUrl(
        this.parent.currentInstruction.config.pattern,
        this.parent.currentInstruction.params,
        this.parent.currentInstruction.fragment
      );

      this.baseUrl = this.parent.baseUrl + baseUrl;
    }
  }

  refreshNavigation() {
    var nav = this.navigation;

    for(var i = 0, length = nav.length; i < length; i++) {
      var current = nav[i];

      if (this.baseUrl[0] == '/') {
        current.href = '#' + this.baseUrl;
      } else {
        current.href = '#/' + this.baseUrl;
      }

      if (current.href[current.href.length - 1] != '/') {
        current.href += '/';
      }

      current.href += current.relativeHref;
    }
  }

  configure(callbackOrConfig) {
    if (typeof callbackOrConfig == 'function') {
      var config = new RouterConfiguration();
      callbackOrConfig(config);
      config.exportToRouter(this);
    } else {
      callbackOrConfig.exportToRouter(this);
    }

    return this;
  }

  navigate(fragment, options) {
    return this.history.navigate(fragment, options);
  }

  navigateBack() {
    this.history.navigateBack();
  }

  createChild() {
    var childRouter = new Router(this.history);
    childRouter.parent = this;
    return childRouter;
  }

  createNavigationInstruction(url='', parentInstruction) {
    var results = this.recognizer.recognize(url);

    if (!results || !results.length) {
      results = this.childRecognizer.recognize(url);
    }

    if (results && results.length) {
      var first = results[0],
          fragment = url,
          queryIndex = fragment.indexOf('?'),
          queryString;

      if (queryIndex != -1) {
        fragment = url.substr(0, queryIndex);
        queryString = url.substr(queryIndex + 1);
      }

      var instruction = new NavigationInstruction(
        fragment,
        queryString,
        first.params,
        first.queryParams,
        first.handler,
        parentInstruction
        );

      if (typeof first.handler == 'function') {
        instruction.config = {};
        return first.handler(instruction);
      }

      return Promise.resolve(instruction);
    } else {
      //log('Route Not Found');
      return Promise.resolve(null);
    }
  }

  createNavigationContext(instruction) {
    return new NavigationContext(this, instruction);
  }

  generate(name, params) {
    return this.recognizer.generate(name, params);
  }

  addRoute(config, navModel={}) {
    if (!('viewPorts' in config)) {
      config.viewPorts = {
        'default': {
          componentUrl: config.componentUrl
        }
      };
    }

    navModel.title = navModel.title || config.title;

    this.routes.push(config);
    this.recognizer.add([{path:config.pattern, handler: config}]);

    if (config.pattern) {
      var withChild = JSON.parse(JSON.stringify(config));
      withChild.pattern += "/*childRoute";
      withChild.hasChildRouter = true;
      this.childRecognizer.add([{path:withChild.pattern, handler: withChild}]);
      withChild.navModel = navModel;
    }

    config.navModel = navModel;

    if (('nav' in config || 'order' in navModel)
      && this.navigation.indexOf(navModel) === -1) {
      navModel.order = navModel.order || config.nav;
      navModel.href = navModel.href || config.href;
      navModel.isActive = false;
      navModel.config = config;

      if (!config.href) {
        navModel.relativeHref = config.pattern;
        navModel.href = '';
      }

      if (typeof navModel.order != 'number') {
        navModel.order = ++this.fallbackOrder;
      }

      this.navigation.push(navModel);
      this.navigation = this.navigation.sort((a, b) => a.order - b.order);
    }
  }

  handleUnknownRoutes(config) {
    var catchAllPattern = "*path";

    var callback = (instruction) => new Promise((resolve) => {
      if (!config) {
        instruction.config.componentUrl = instruction.fragment;
      } else if (typeof config == 'string') {
        instruction.config.componentUrl = config;
      } else if (typeof config == 'function') {
        var result = config(instruction);

        if (result instanceof Promise) {
          result.then(() => {
            instruction.config.pattern = catchAllPattern;
            resolve(instruction);
          });

          return;
        }
      } else {
        instruction.config = config;
      }

      instruction.config.pattern = catchAllPattern;
      resolve(instruction);
    });

    this.childRecognizer.add([{
      path: catchAllPattern,
      handler: callback
    }]);
  }

  reset() {
    this.fallbackOrder = 100;
    this.recognizer = new RouteRecognizer();
    this.childRecognizer = new RouteRecognizer();
    this.routes = [];
    this.isNavigating = false;
    this.navigation = [];
  };
}

function getBaseUrl(pattern, params, fragment) {
  if (!params) {
    return fragment;
  }

  var wildcardName = getWildCardName(pattern),
      path = params[wildcardName];

  if (!path) {
    return fragment;
  }

  return fragment.substr(0, fragment.lastIndexOf(path));
}
