'use strict';

/*
 * A module for adding new a routing system Angular 1.
 */
angular.module('ngNewRouter', ['ngNewRouter.generated']).
  value('$routeParams', {}).
  provider('$componentLoader', $componentLoaderProvider).
  directive('routerViewPort', routerViewPortDirective).
  directive('routerViewPort', routerViewPortFillContentDirective).
  directive('routerLink', routerLinkDirective);



/**
 * @name routerViewPort
 *
 * @description
 * A routerViewPort is where resolved content goes.
 *
 * ## Use
 *
 * ```html
 * <div router-view-port="name"></div>
 * ```
 *
 * The value for the `routerViewPort` attribute is optional.
 */
function routerViewPortDirective($animate, $compile, $controller, $templateRequest, $rootScope, $location, $componentLoader, $router) {
  var rootRouter = $router;

  $rootScope.$watch(function () {
    return $location.path();
  }, function (newUrl) {
    rootRouter.navigate(newUrl);
  });

  var nav = rootRouter.navigate;
  rootRouter.navigate = function (url) {
    return nav.call(this, url).then(function (newUrl) {
      if (newUrl) {
        $location.path(newUrl);
      }
    });
  }

  return {
    restrict: 'AE',
    transclude: 'element',
    terminal: true,
    priority: 400,
    require: ['?^^routerViewPort', 'routerViewPort'],
    link: viewPortLink,
    controller: function() {},
    controllerAs: '$$routerViewPort'
  };

  function viewPortLink(scope, $element, attrs, ctrls, $transclude) {
    var viewPortName = attrs.routerViewPort || 'default',
        ctrl = ctrls[0],
        myCtrl = ctrls[1],
        router = (ctrl && ctrl.$$router) || rootRouter;

    var currentScope,
        newScope,
        currentElement,
        previousLeaveAnimation,
        previousInstruction;

    function cleanupLastView() {
      if (previousLeaveAnimation) {
        $animate.cancel(previousLeaveAnimation);
        previousLeaveAnimation = null;
      }

      if (currentScope) {
        currentScope.$destroy();
        currentScope = null;
      }
      if (currentElement) {
        previousLeaveAnimation = $animate.leave(currentElement);
        previousLeaveAnimation.then(function() {
          previousLeaveAnimation = null;
        });
        currentElement = null;
      }
    }

    function getComponentFromInstruction(instruction) {
      var component = instruction[0].handler.component;
      var componentName = typeof component === 'string' ? component : component[viewPortName];
      return $componentLoader(componentName);
    }
    router.registerViewPort({
      canDeactivate: function (instruction) {
        return !ctrl || !ctrl.canDeactivate || ctrl.canDeactivate();
      },
      canReactivate: function (instruction) {
        //TODO: expose controller hook
        return JSON.stringify(instruction) === previousInstruction;
      },
      instantiate: function (instruction) {
        var controllerName = getComponentFromInstruction(instruction).controllerName;
        var component = instruction[0].handler.component;
        var componentName = typeof component === 'string' ? component : component[viewPortName];

        // build up locals for controller
        newScope = scope.$new();

        var locals = {
          $scope: newScope,
          $router: scope.$$routerViewPort.$$router = router.childRouter()
        };

        if (router.context) {
          locals.$routeParams = router.context.params;
        }
        ctrl = $controller(controllerName, locals);
        newScope[componentName] = ctrl;
      },
      canActivate: function (instruction) {
        return !ctrl || !ctrl.canActivate || ctrl.canActivate(instruction);
      },
      load: function (instruction) {
        var componentTemplateUrl = getComponentFromInstruction(instruction).template;
        return $templateRequest(componentTemplateUrl).then(function(templateHtml) {
          myCtrl.$$template = templateHtml;
        });
      },
      activate: function (instruction) {
        var component = instruction[0].handler.component;
        var componentName = typeof component === 'string' ? component : component[viewPortName];

        var clone = $transclude(newScope, function(clone) {
          $animate.enter(clone, null, currentElement || $element);
          cleanupLastView();
        });

        currentElement = clone;
        currentScope = newScope;

        // finally, run the hook
        if (ctrl.activate) {
          ctrl.activate(instruction);
        }
        previousInstruction = JSON.stringify(instruction);
      }
    }, viewPortName);
  }
}

function routerViewPortFillContentDirective($compile) {
  return {
    restrict: 'EA',
    priority: -400,
    require: 'routerViewPort',
    link: function(scope, $element, attrs, ctrl) {
      var template = ctrl.$$template;
      $element.html(template);
      var link = $compile($element.contents());
      link(scope);
    }
  };
}

function makeComponentString(name) {
  return [
    '<router-component component-name="', name, '">',
    '</router-component>'
  ].join('');
}


var LINK_MICROSYNTAX_RE = /^(.+?)(?:\((.*)\))?$/;
/**
 * @name routerLink
 * @description
 * Lets you link to different parts of the app, and automatically generates hrefs.
 *
 * ## Use
 * The directive uses a simple syntax: `router-link="componentName({ param: paramValue })"`
 *
 * ## Example
 *
 * ```js
 * angular.module('myApp', ['ngFuturisticRouter'])
 *   .controller('AppController', ['router', function(router) {
 *     router.config({ path: '/user/:id' component: 'user' });
 *     this.user = { name: 'Brian', id: 123 };
 *   });
 * ```
 *
 * ```html
 * <div ng-controller="AppController as app">
 *   <a router-link="user({id: app.user.id})">{{app.user.name}}</a>
 * </div>
 * ```
 */
function routerLinkDirective($router, $location, $parse) {
  var rootRouter = $router;

  angular.element(document.body).on('click', function (ev) {
    var target = ev.target;
    if (target.attributes['router-link']) {
      ev.preventDefault();
      var url = target.attributes.href.value;
      rootRouter.navigate(url);
    }
  });

  return {
    require: '?^^routerViewPort',
    restrict: 'A',
    link: routerLinkDirectiveLinkFn
  };

  function routerLinkDirectiveLinkFn(scope, elt, attrs, ctrl) {
    var router = (ctrl && ctrl.$$router) || rootRouter;
    if (!router) {
      return;
    }

    var link = attrs.routerLink || '';
    var parts = link.match(LINK_MICROSYNTAX_RE);
    var routeName = parts[1];
    var routeParams = parts[2];
    var url;

    if (routeParams) {
      var routeParamsGetter = $parse(routeParams);
      // we can avoid adding a watcher if it's a literal
      if (routeParamsGetter.constant) {
        var params = routeParamsGetter();
        url = '.' + router.generate(routeName, params);
        elt.attr('href', url);
      } else {
        scope.$watch(function() {
          return routeParamsGetter(scope);
        }, function(params) {
          url = '.' + router.generate(routeName, params);
          elt.attr('href', url);
        }, true);
      }
    } else {
      url = '.' + router.generate(routeName);
      elt.attr('href', url);
    }
  }
}


/**
 * @name $componentLoaderProvider
 * @description
 *
 * This lets you configure conventions for what controllers are named and where to load templates from.
 *
 * The default behavior is to dasherize and serve from `./components`. A component called `myWidget`
 * uses a controller named `MyWidgetController` and a template loaded from `./components/my-widget/my-widget.html`.
 *
 * A component is:
 * - a controller
 * - a template
 * - an optional router
 *
 * This service makes it easy to group all of them into a single concept.
 */
function $componentLoaderProvider() {
  var componentToCtrl = function componentToCtrlDefault(name) {
    return name[0].toUpperCase() +
        name.substr(1) +
        'Controller';
  };

  var componentToTemplate = function componentToTemplateDefault(name) {
    var dashName = dashCase(name);
    return './components/' + dashName + '/' + dashName + '.html';
  };

  function componentLoader(name) {
    return {
      controllerName: componentToCtrl(name),
      template: componentToTemplate(name)
    };
  }

  return {
    $get: function () {
      return componentLoader;
    },
    /**
     * @name $componentLoaderProvider#setCtrlNameMapping
     * @description takes a function for mapping component names to component controller names
     */
    setCtrlNameMapping: function(newFn) {
      componentToCtrl = newFn;
      return this;
    },
    /**
     * @name $componentLoaderProvider#setTemplateMapping
     * @description takes a function for mapping component names to component template URLs
     */
    setTemplateMapping: function(newFn) {
      componentToTemplate = newFn;
      return this;
    }
  };
}

function dashCase(str) {
  return str.replace(/([A-Z])/g, function ($1) {
    return '-' + $1.toLowerCase();
  });
}

angular.module('ngNewRouter.generated', []).factory('$router', ['$q', function($q) {/*
 * artisinal, handcrafted subset of the traceur runtime for picky webdevs
 */

var $defineProperty = Object.defineProperty,
    $defineProperties = Object.defineProperties,
    $create = Object.create,
    $getOwnPropertyDescriptor = Object.getOwnPropertyDescriptor,
    $getOwnPropertyNames = Object.getOwnPropertyNames;

function createClass(ctor, object, staticObject, superClass) {
  $defineProperty(object, 'constructor', {
    value: ctor,
    configurable: true,
    enumerable: false,
    writable: true
  });
  if (arguments.length > 3) {
    if (typeof superClass === 'function')
      ctor.__proto__ = superClass;
    ctor.prototype = $create(getProtoParent(superClass), getDescriptors(object));
  } else {
    ctor.prototype = object;
  }
  $defineProperty(ctor, 'prototype', {
    configurable: false,
    writable: false
  });
  return $defineProperties(ctor, getDescriptors(staticObject));
}

function getProtoParent(superClass) {
  if (typeof superClass === 'function') {
    var prototype = superClass.prototype;
    if (Object(prototype) === prototype || prototype === null)
      return superClass.prototype;
    throw new TypeError('super prototype must be an Object or null');
  }
  if (superClass === null)
    return null;
  throw new TypeError(("Super expression must either be null or a function, not " + typeof superClass + "."));
}

function getDescriptors(object) {
  var descriptors = {};
  var names = $getOwnPropertyNames(object);
  for (var i = 0; i < names.length; i++) {
    var name = names[i];
    descriptors[name] = $getOwnPropertyDescriptor(object, name);
  }
  // TODO: someday you might use symbols and you'll have to re-evaluate
  //       your life choices that led to the creation of this file

  // var symbols = getOwnPropertySymbols(object);
  // for (var i = 0; i < symbols.length; i++) {
  //   var symbol = symbols[i];
  //   descriptors[$traceurRuntime.toProperty(symbol)] = $getOwnPropertyDescriptor(object, $traceurRuntime.toProperty(symbol));
  // }
  return descriptors;
};

  "use strict";
  var RouteRecognizer = (function() {
    var map = (function() {
      function Target(path, matcher, delegate) {
        this.path = path;
        this.matcher = matcher;
        this.delegate = delegate;
      }
      Target.prototype = {to: function(target, callback) {
          var delegate = this.delegate;
          if (delegate && delegate.willAddRoute) {
            target = delegate.willAddRoute(this.matcher.target, target);
          }
          this.matcher.add(this.path, target);
          if (callback) {
            if (callback.length === 0) {
              throw new Error("You must have an argument in the function passed to `to`");
            }
            this.matcher.addChild(this.path, target, callback, this.delegate);
          }
          return this;
        }};
      function Matcher(target) {
        this.routes = {};
        this.children = {};
        this.target = target;
      }
      Matcher.prototype = {
        add: function(path, handler) {
          this.routes[path] = handler;
        },
        addChild: function(path, target, callback, delegate) {
          var matcher = new Matcher(target);
          this.children[path] = matcher;
          var match = generateMatch(path, matcher, delegate);
          if (delegate && delegate.contextEntered) {
            delegate.contextEntered(target, match);
          }
          callback(match);
        }
      };
      function generateMatch(startingPath, matcher, delegate) {
        return function(path, nestedCallback) {
          var fullPath = startingPath + path;
          if (nestedCallback) {
            nestedCallback(generateMatch(fullPath, matcher, delegate));
          } else {
            return new Target(startingPath + path, matcher, delegate);
          }
        };
      }
      function addRoute(routeArray, path, handler) {
        var len = 0;
        for (var i = 0,
            l = routeArray.length; i < l; i++) {
          len += routeArray[i].path.length;
        }
        path = path.substr(len);
        var route = {
          path: path,
          handler: handler
        };
        routeArray.push(route);
      }
      function eachRoute(baseRoute, matcher, callback, binding) {
        var routes = matcher.routes;
        for (var path in routes) {
          if (routes.hasOwnProperty(path)) {
            var routeArray = baseRoute.slice();
            addRoute(routeArray, path, routes[path]);
            if (matcher.children[path]) {
              eachRoute(routeArray, matcher.children[path], callback, binding);
            } else {
              callback.call(binding, routeArray);
            }
          }
        }
      }
      return function(callback, addRouteCallback) {
        var matcher = new Matcher();
        callback(generateMatch("", matcher, this.delegate));
        eachRoute([], matcher, function(route) {
          if (addRouteCallback) {
            addRouteCallback(this, route);
          } else {
            this.add(route);
          }
        }, this);
      };
    }());
    ;
    var specials = ['/', '.', '*', '+', '?', '|', '(', ')', '[', ']', '{', '}', '\\'];
    var escapeRegex = new RegExp('(\\' + specials.join('|\\') + ')', 'g');
    function isArray(test) {
      return Object.prototype.toString.call(test) === "[object Array]";
    }
    function StaticSegment(string) {
      this.string = string;
    }
    StaticSegment.prototype = {
      eachChar: function(callback) {
        var string = this.string,
            ch;
        for (var i = 0,
            l = string.length; i < l; i++) {
          ch = string.charAt(i);
          callback({validChars: ch});
        }
      },
      regex: function() {
        return this.string.replace(escapeRegex, '\\$1');
      },
      generate: function() {
        return this.string;
      }
    };
    function DynamicSegment(name) {
      this.name = name;
    }
    DynamicSegment.prototype = {
      eachChar: function(callback) {
        callback({
          invalidChars: "/",
          repeat: true
        });
      },
      regex: function() {
        return "([^/]+)";
      },
      generate: function(params) {
        return params[this.name];
      }
    };
    function StarSegment(name) {
      this.name = name;
    }
    StarSegment.prototype = {
      eachChar: function(callback) {
        callback({
          invalidChars: "",
          repeat: true
        });
      },
      regex: function() {
        return "(.+)";
      },
      generate: function(params) {
        return params[this.name];
      }
    };
    function EpsilonSegment() {}
    EpsilonSegment.prototype = {
      eachChar: function() {},
      regex: function() {
        return "";
      },
      generate: function() {
        return "";
      }
    };
    function parse(route, names, types) {
      if (route.charAt(0) === "/") {
        route = route.substr(1);
      }
      var segments = route.split("/"),
          results = [];
      for (var i = 0,
          l = segments.length; i < l; i++) {
        var segment = segments[i],
            match;
        if (match = segment.match(/^:([^\/]+)$/)) {
          results.push(new DynamicSegment(match[1]));
          names.push(match[1]);
          types.dynamics++;
        } else if (match = segment.match(/^\*([^\/]+)$/)) {
          results.push(new StarSegment(match[1]));
          names.push(match[1]);
          types.stars++;
        } else if (segment === "") {
          results.push(new EpsilonSegment());
        } else {
          results.push(new StaticSegment(segment));
          types.statics++;
        }
      }
      return results;
    }
    function State(charSpec) {
      this.charSpec = charSpec;
      this.nextStates = [];
    }
    State.prototype = {
      get: function(charSpec) {
        var nextStates = this.nextStates;
        for (var i = 0,
            l = nextStates.length; i < l; i++) {
          var child = nextStates[i];
          var isEqual = child.charSpec.validChars === charSpec.validChars;
          isEqual = isEqual && child.charSpec.invalidChars === charSpec.invalidChars;
          if (isEqual) {
            return child;
          }
        }
      },
      put: function(charSpec) {
        var state;
        if (state = this.get(charSpec)) {
          return state;
        }
        state = new State(charSpec);
        this.nextStates.push(state);
        if (charSpec.repeat) {
          state.nextStates.push(state);
        }
        return state;
      },
      match: function(ch) {
        var nextStates = this.nextStates,
            child,
            charSpec,
            chars;
        var returned = [];
        for (var i = 0,
            l = nextStates.length; i < l; i++) {
          child = nextStates[i];
          charSpec = child.charSpec;
          if (typeof(chars = charSpec.validChars) !== 'undefined') {
            if (chars.indexOf(ch) !== -1) {
              returned.push(child);
            }
          } else if (typeof(chars = charSpec.invalidChars) !== 'undefined') {
            if (chars.indexOf(ch) === -1) {
              returned.push(child);
            }
          }
        }
        return returned;
      }
    };
    function sortSolutions(states) {
      return states.sort(function(a, b) {
        if (a.types.stars !== b.types.stars) {
          return a.types.stars - b.types.stars;
        }
        if (a.types.stars) {
          if (a.types.statics !== b.types.statics) {
            return b.types.statics - a.types.statics;
          }
          if (a.types.dynamics !== b.types.dynamics) {
            return b.types.dynamics - a.types.dynamics;
          }
        }
        if (a.types.dynamics !== b.types.dynamics) {
          return a.types.dynamics - b.types.dynamics;
        }
        if (a.types.statics !== b.types.statics) {
          return b.types.statics - a.types.statics;
        }
        return 0;
      });
    }
    function recognizeChar(states, ch) {
      var nextStates = [];
      for (var i = 0,
          l = states.length; i < l; i++) {
        var state = states[i];
        nextStates = nextStates.concat(state.match(ch));
      }
      return nextStates;
    }
    var oCreate = Object.create || function(proto) {
      function F() {}
      F.prototype = proto;
      return new F();
    };
    function RecognizeResults(queryParams) {
      this.queryParams = queryParams || {};
    }
    RecognizeResults.prototype = oCreate({
      splice: Array.prototype.splice,
      slice: Array.prototype.slice,
      push: Array.prototype.push,
      length: 0,
      queryParams: null
    });
    function findHandler(state, path, queryParams) {
      var handlers = state.handlers,
          regex = state.regex;
      var captures = path.match(regex),
          currentCapture = 1;
      var result = new RecognizeResults(queryParams);
      for (var i = 0,
          l = handlers.length; i < l; i++) {
        var handler = handlers[i],
            names = handler.names,
            params = {};
        for (var j = 0,
            m = names.length; j < m; j++) {
          params[names[j]] = captures[currentCapture++];
        }
        result.push({
          handler: handler.handler,
          params: params,
          isDynamic: !!names.length
        });
      }
      return result;
    }
    function addSegment(currentState, segment) {
      segment.eachChar(function(ch) {
        var state;
        currentState = currentState.put(ch);
      });
      return currentState;
    }
    var RouteRecognizer = function() {
      this.rootState = new State();
      this.names = {};
    };
    RouteRecognizer.prototype = {
      add: function(routes, options) {
        var currentState = this.rootState,
            regex = "^",
            types = {
              statics: 0,
              dynamics: 0,
              stars: 0
            },
            handlers = [],
            allSegments = [],
            name;
        var isEmpty = true;
        for (var i = 0,
            l = routes.length; i < l; i++) {
          var route = routes[i],
              names = [];
          var segments = parse(route.path, names, types);
          allSegments = allSegments.concat(segments);
          for (var j = 0,
              m = segments.length; j < m; j++) {
            var segment = segments[j];
            if (segment instanceof EpsilonSegment) {
              continue;
            }
            isEmpty = false;
            currentState = currentState.put({validChars: "/"});
            regex += "/";
            currentState = addSegment(currentState, segment);
            regex += segment.regex();
          }
          var handler = {
            handler: route.handler,
            names: names
          };
          handlers.push(handler);
        }
        if (isEmpty) {
          currentState = currentState.put({validChars: "/"});
          regex += "/";
        }
        currentState.handlers = handlers;
        currentState.regex = new RegExp(regex + "$");
        currentState.types = types;
        if (name = options && options.as) {
          this.names[name] = {
            segments: allSegments,
            handlers: handlers
          };
        }
      },
      handlersFor: function(name) {
        var route = this.names[name],
            result = [];
        if (!route) {
          throw new Error("There is no route named " + name);
        }
        for (var i = 0,
            l = route.handlers.length; i < l; i++) {
          result.push(route.handlers[i]);
        }
        return result;
      },
      hasRoute: function(name) {
        return !!this.names[name];
      },
      generate: function(name, params) {
        var route = this.names[name],
            output = "";
        if (!route) {
          throw new Error("There is no route named " + name);
        }
        var segments = route.segments;
        for (var i = 0,
            l = segments.length; i < l; i++) {
          var segment = segments[i];
          if (segment instanceof EpsilonSegment) {
            continue;
          }
          output += "/";
          output += segment.generate(params);
        }
        if (output.charAt(0) !== '/') {
          output = '/' + output;
        }
        if (params && params.queryParams) {
          output += this.generateQueryString(params.queryParams, route.handlers);
        }
        return output;
      },
      generateQueryString: function(params, handlers) {
        var pairs = [];
        var keys = [];
        for (var key in params) {
          if (params.hasOwnProperty(key)) {
            keys.push(key);
          }
        }
        keys.sort();
        for (var i = 0,
            len = keys.length; i < len; i++) {
          key = keys[i];
          var value = params[key];
          if (value == null) {
            continue;
          }
          var pair = encodeURIComponent(key);
          if (isArray(value)) {
            for (var j = 0,
                l = value.length; j < l; j++) {
              var arrayPair = key + '[]' + '=' + encodeURIComponent(value[j]);
              pairs.push(arrayPair);
            }
          } else {
            pair += "=" + encodeURIComponent(value);
            pairs.push(pair);
          }
        }
        if (pairs.length === 0) {
          return '';
        }
        return "?" + pairs.join("&");
      },
      parseQueryString: function(queryString) {
        var pairs = queryString.split("&"),
            queryParams = {};
        for (var i = 0; i < pairs.length; i++) {
          var pair = pairs[i].split('='),
              key = decodeURIComponent(pair[0]),
              keyLength = key.length,
              isArray = false,
              value;
          if (pair.length === 1) {
            value = 'true';
          } else {
            if (keyLength > 2 && key.slice(keyLength - 2) === '[]') {
              isArray = true;
              key = key.slice(0, keyLength - 2);
              if (!queryParams[key]) {
                queryParams[key] = [];
              }
            }
            value = pair[1] ? decodeURIComponent(pair[1]) : '';
          }
          if (isArray) {
            queryParams[key].push(value);
          } else {
            queryParams[key] = value;
          }
        }
        return queryParams;
      },
      recognize: function(path) {
        var states = [this.rootState],
            pathLen,
            i,
            l,
            queryStart,
            queryParams = {},
            isSlashDropped = false;
        queryStart = path.indexOf('?');
        if (queryStart !== -1) {
          var queryString = path.substr(queryStart + 1, path.length);
          path = path.substr(0, queryStart);
          queryParams = this.parseQueryString(queryString);
        }
        path = decodeURI(path);
        if (path.charAt(0) !== "/") {
          path = "/" + path;
        }
        pathLen = path.length;
        if (pathLen > 1 && path.charAt(pathLen - 1) === "/") {
          path = path.substr(0, pathLen - 1);
          isSlashDropped = true;
        }
        for (i = 0, l = path.length; i < l; i++) {
          states = recognizeChar(states, path.charAt(i));
          if (!states.length) {
            break;
          }
        }
        var solutions = [];
        for (i = 0, l = states.length; i < l; i++) {
          if (states[i].handlers) {
            solutions.push(states[i]);
          }
        }
        states = sortSolutions(solutions);
        var state = solutions[0];
        if (state && state.handlers) {
          if (isSlashDropped && state.regex.source.slice(-5) === "(.+)$") {
            path = path + "/";
          }
          return findHandler(state, path, queryParams);
        }
      }
    };
    RouteRecognizer.prototype.map = map;
    RouteRecognizer.VERSION = 'VERSION_STRING_PLACEHOLDER';
    return RouteRecognizer;
  }());
  ;
  var CHILD_ROUTE_SUFFIX = '/*childRoute';
  var Router = function Router(parent, configPrefix) {
    this.parent = parent || null;
    this.navigating = false;
    this.ports = {};
    this.rewrites = {};
    this.children = [];
    this.context = null;
    this.recognizer = new RouteRecognizer();
    this.childRecognizer = new RouteRecognizer();
  };
  var $Router = Router;
  (createClass)(Router, {
    childRouter: function() {
      var child = new $Router(this);
      this.children.push(child);
      return child;
    },
    registerViewPort: function(view) {
      var name = arguments[1] !== (void 0) ? arguments[1] : 'default';
      this.ports[name] = view;
      return this.renavigate();
    },
    config: function(mapping) {
      var $__0 = this;
      if (mapping instanceof Array) {
        mapping.forEach((function(nav) {
          return $__0.configOne(nav);
        }));
      } else {
        this.configOne(mapping);
      }
      return this.renavigate();
    },
    configOne: function(mapping) {
      if (mapping.redirectTo) {
        this.rewrites[mapping.path] = mapping.redirectTo;
        return;
      }
      var component = mapping.component;
      if (typeof component === 'string') {
        mapping.handler = {component: component};
      } else if (typeof component === 'function') {
        mapping.handler = component();
      } else if (!mapping.handler) {
        mapping.handler = {component: component};
      }
      this.recognizer.add([mapping], {as: component});
      var withChild = copy(mapping);
      withChild.path += CHILD_ROUTE_SUFFIX;
      this.childRecognizer.add([{
        path: withChild.path,
        handler: withChild
      }]);
    },
    navigate: function(url) {
      var $__0 = this;
      if (url[0] === '.') {
        url = url.substr(1);
      }
      var self = this;
      if (this.navigating) {
        return $q.when();
      }
      url = this.getCanonicalUrl(url);
      this.lastNavigationAttempt = url;
      var context = this.recognizer.recognize(url);
      var segment = url;
      if (notMatched(context)) {
        context = this.childRecognizer.recognize(url);
        if (notMatched(context)) {
          return $q.when();
        }
        var path = context[0].handler.path;
        segment = path.substr(0, path.length - CHILD_ROUTE_SUFFIX.length);
        if (this.previousSegment === segment) {
          startNavigating();
          return this.navigateChildren(context).then(finishNavigating, cancelNavigating);
        }
      }
      if (notMatched(context)) {
        return $q.when();
      }
      if (this.context === context[0]) {
        return $q.when();
      }
      this.context = context[0];
      this.fullContext = context;
      this.navigating = true;
      context.component = this.context.handler.component;
      return this.canNavigate(context).then((function(status) {
        return (status && $__0.activatePorts(context));
      })).then(finishNavigating, cancelNavigating);
      function startNavigating() {
        self.context = context[0];
        self.fullContext = context;
        self.navigating = true;
      }
      function finishNavigating(childUrl) {
        self.navigating = false;
        self.previousSegment = segment;
        self.previousContext = context;
        return self.previousUrl = segment + (childUrl || '');
      }
      function cancelNavigating() {
        self.previousUrl = url;
        self.navigating = false;
      }
    },
    getCanonicalUrl: function(url) {
      forEach(this.rewrites, function(toUrl, fromUrl) {
        if (fromUrl === '/') {
          if (url === '/') {
            url = toUrl;
          }
        } else if (url.indexOf(fromUrl) === 0) {
          url = url.replace(fromUrl, toUrl);
        }
      });
      return url;
    },
    renavigate: function() {
      var renavigateDestination = this.previousUrl || this.lastNavigationAttempt;
      if (!this.navigating && renavigateDestination) {
        return this.navigate(renavigateDestination);
      } else {
        return $q.when();
      }
    },
    navigateChildren: function(context) {
      if (context[0].params.childRoute || this.children.length > 0) {
        var subNav = '/' + (context[0].params.childRoute || '');
        return $q.all(this.children.map((function(child) {
          return child.navigate(subNav);
        }))).then((function(childUrls) {
          return childUrls[0];
        }));
      }
      return $q.when();
    },
    generate: function(name, params) {
      var router = this,
          prefix = '';
      while (router && !router.recognizer.hasRoute(name)) {
        router = router.parent;
      }
      if (!router) {
        return '';
      }
      var path = router.recognizer.generate(name, params);
      while (router = router.parent) {
        prefix += router.previousSegment;
      }
      return prefix + path;
    },
    activatePorts: function(context) {
      var $__0 = this;
      var activations = mapObj(this.ports, (function(port) {
        return $q.when(port.canReactivate && port.canReactivate(context)).then((function(status) {
          if (status) {
            return $q.when(!port.reactivate || port.reactivate(context));
          }
          return $q.when(port.deactivate && port.deactivate(context)).then(port.activate(context));
        }));
      }));
      return $q.all(activations).then((function() {
        return $__0.navigateChildren(context);
      }));
    },
    canNavigate: function(context) {
      return $q.all(this.gatherNagigationPredicates(context)).then(booleanReduction);
    },
    gatherNagigationPredicates: function(context) {
      return this.children.reduce((function(promises, child) {
        return promises.concat(child.gatherNagigationPredicates(context));
      }), [this.navigationPredicate(context)]);
    },
    navigationPredicate: function(context) {
      return this.queryViewports((function(port) {
        return $q.when(port.canReactivate && port.canReactivate(context)).then((function(status) {
          if (status) {
            return true;
          }
          return $q.when(!port.canDeactivate || port.canDeactivate(context)).then((function(status) {
            if (status) {
              port.instantiate(context);
              return $q.when(port.load(context)).then((function() {
                return $q.when(!port.canActivate || port.canActivate(context));
              }));
            }
            return false;
          }));
        }));
      }));
    },
    queryViewports: function(fn) {
      var allViewportQueries = mapObj(this.ports, fn);
      return $q.all(allViewportQueries).then(booleanReduction).then(boolToPromise);
    }
  }, {});
  Object.defineProperty(Router.prototype.generate, "parameters", {get: function() {
      return [[$traceurRuntime.type.string], []];
    }});
  function copy(obj) {
    return JSON.parse(JSON.stringify(obj));
  }
  function notMatched(context) {
    return context == null || context.length < 1;
  }
  function forEach(obj, fn) {
    Object.keys(obj).forEach((function(key) {
      return fn(obj[key], key);
    }));
  }
  function mapObj(obj, fn) {
    var result = [];
    Object.keys(obj).forEach((function(key) {
      return result.push(fn(obj[key], key));
    }));
    return result;
  }
  function booleanReduction(arr) {
    return arr.reduce((function(acc, val) {
      return acc && val;
    }), true);
  }
  function boolToPromise(value) {
    return value ? $q.when(value) : $q.reject();
  }

return new Router();}]);