/*
 * This is for Angular 1.3
 */

angular.module('ngFuturisticRouter', ['ngFuturisticRouter.generated']).
  directive('routerComponent', routerComponentDirective).
  directive('routerComponent', routerComponentFillContentDirective).
  value('routeParams', {}).
  provider('componentLoader', componentLoaderProvider).
  directive('routerViewPort', routerViewPortDirective).
  directive('routerLink', routerLinkDirective);

/*
 * A component is:
 * - a controller
 * - a template
 * - an optional router
 *
 * This directive makes it easy to group all of them into a single concept
 *
 *
 */
function routerComponentDirective($animate, $controller, $compile, $rootScope, $location, $templateRequest, router, componentLoader) {
  $rootScope.$watch(function () {
    return $location.path();
  }, function (newUrl) {
    router.navigate(newUrl);
  });

  var nav = router.navigate;
  router.navigate = function (url) {
    return nav.call(this, url).then(function () {
      $location.path(url);
    });
  }

  return {
    restrict: 'AE',
    scope: {},
    priority: 400,
    transclude: 'element',
    require: ['?^^routerComponent', '?^^routerViewPort', 'routerComponent'],
    link: routerComponentLinkFn,
    controller: function () {},
    controllerAs: '$$routerComponentController'
  };

  function routerComponentLinkFn(scope, elt, attrs, ctrls, $transclude) {
    var parentComponentCtrl = ctrls[0],
        viewPortCtrl = ctrls[1],
        myOwnRouterComponentCtrl= ctrls[2];

    var childRouter = (parentComponentCtrl && parentComponentCtrl.$$router && parentComponentCtrl.$$router.childRouter()) || router;
    var parentRouter = childRouter.parent || childRouter;

    var componentName = attrs.routerComponent || attrs.componentName;

    var component = componentLoader(componentName);

    // build up locals for controller
    var childScope = scope.$new();
    var locals = {
      $scope: childScope
    };

    if (parentRouter.context) {
      locals.routeParams = parentRouter.context.params;
    }

    scope.$$routerComponentController.$$router = locals.router = childRouter;

    // TODO: the pipeline should probably be responsible for creating this...
    var controllerName = component.controllerName;
    var ctrl = $controller(controllerName, locals);
    childScope[componentName] = ctrl;

    if (!ctrl.canActivate || ctrl.canActivate()) {
      var componentTemplateUrl = component.template;
      $templateRequest(componentTemplateUrl).
          then(function(templateHtml) {

            myOwnRouterComponentCtrl.template = templateHtml;

            var clone = $transclude(childScope, function(clone) {
              $animate.enter(clone, null, elt);
            });

            if (ctrl.activate) {
              ctrl.activate();
            }
            if (ctrl.canDeactivate) {
              viewPortCtrl.canDeactivate = function (){
                return ctrl.canDeactivate();
              }
            }
          });
    }

  }
}


function routerComponentFillContentDirective($compile) {
  return {
    restrict: 'AE',
    priority: -400,
    require: 'routerComponent',
    link: function(scope, $element, $attr, ctrl) {
      $element.html(ctrl.template);
      $compile($element.contents())(scope);
    }
  };
};



/*
 * ## `<router-view-port>`
 * Responsibile for wiring up stuff
 * needs to appear inside of a routerComponent
 *
 * Use:
 *
 * ```html
 * <div router-view-port="name"></div>
 * ```
 *
 * The value for the routerViewComponent is optional
 */
function routerViewPortDirective($animate, $compile, $templateRequest, componentLoader) {
  return {
    restrict: 'AE',
    require: '^^routerComponent',
    link: viewPortLink,
    controller: function() {},
    controllerAs: '$$routerViewPort'
  };

  function viewPortLink(scope, elt, attrs, ctrl) {
    var router = ctrl.$$router;

    var name = attrs.routerViewPort || 'default';

    router.registerViewPort({
      activate: function (instruction) {
        var component = instruction[0].handler.component;
        var componentName = typeof component === 'string' ? component : component[name];

        var template = makeComponentString(componentName);
        var oldContents = elt.contents();

        if (oldContents.length) {
          oldContents.remove();
        }

        elt.html(template);
        var link = $compile(elt.contents());
        ctrl.$$router.context = instruction[0];
        link(scope.$new());

        if (oldContents.length) {
          elt.append(oldContents);
          $animate.leave(oldContents);
        }

        // TODO: this is a hack to avoid ordering constraint issues
        return $templateRequest(componentLoader(componentName).template);
      },
      canDeactivate: function (instruction) {
        return !scope.$$routerViewPort.canDeactivate || scope.$$routerViewPort.canDeactivate();
      }
    }, name);
  }
}

function makeComponentString(name) {
  return [
    '<router-component component-name="', name, '">',
    '</router-component>'
  ].join('');
}

var SOME_RE = /^(.+?)(?:\((.*)\))?$/;

function routerLinkDirective(router, $location, $parse) {
  var rootRouter = router;

  return {
    require: '^^routerComponent',
    restrict: 'A',
    link: routerLinkDirectiveLinkFn
  };


  function routerLinkDirectiveLinkFn(scope, elt, attrs, ctrl) {
    var router = ctrl && ctrl.$$router;
    if (!router) {
      return;
    }

    var link = attrs.routerLink || '';
    var parts = link.match(SOME_RE);
    var routeName = parts[1];
    var routeParams = parts[2];
    var url;

    if (routeParams) {
      var routeParamsGetter = $parse(routeParams);
      // we can avoid adding a watcher if it's a literal
      if (routeParamsGetter.constant) {
        var params = routeParamsGetter();
        url = router.generate(routeName, params);
        elt.attr('href', url);
      } else {
        scope.$watch(function() {
          return routeParamsGetter(scope, ctrl.one);
        }, function(params) {
          url = router.generate(routeName, params);
          elt.attr('href', url);
        }, true);
      }
    } else {
      url = router.generate(routeName);
      elt.attr('href', url);
    }

    elt.on('click', function (ev) {
      ev.preventDefault();
      rootRouter.navigate(url);
    });
  }

}

/*
 * This lets you set up your ~conventions~
 */
function componentLoaderProvider() {
  var componentToCtrl = function componentToCtrlDefault(name) {
    return name[0].toUpperCase() +
        name.substr(1) +
        'Controller';
  };

  var componentToTemplate = function componentToTemplateDefault(name) {
    var dashName = dashCase(name);
    return '/components/' + dashName + '/' + dashName + '.html';
  };

  function componentLoader(name) {
    return {
      controllerName: componentToCtrl(name),
      template: componentToTemplate(name),
    };
  }

  return {
    $get: function () {
      return componentLoader;
    },
    setCtrlNameMapping: function(newFn) {
      componentToCtrl = newFn;
    },
    setTemplateMapping: function(newFn) {
      componentToTemplate = newFn;
    }
  };
}

function dashCase(str) {
  return str.replace(/([A-Z])/g, function ($1) {
    return '-' + $1.toLowerCase();
  });
}

angular.module('ngFuturisticRouter.generated', []).factory('router', ['$q', function($q) {/*
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
    return RouteRecognizer;
  }());
  ;
  var CHILD_ROUTE_SUFFIX = '/*childRoute';
  var Router = function Router(parent, configPrefix) {
    this.parent = parent || null;
    this.navigating = false;
    this.ports = {};
    this.children = [];
    this.context = null;
    this.recognizer = new RouteRecognizer();
    this.childRecognizer = new RouteRecognizer();
  };
  var $Router = Router;
  ($traceurRuntime.createClass)(Router, {
    childRouter: function() {
      var child = new $Router(this);
      this.children.push(child);
      return child;
    },
    registerViewPort: function(view) {
      var name = arguments[1] !== (void 0) ? arguments[1] : 'default';
      this.ports[name] = view;
      if (this.fullContext) {
        return this.activatePorts(this.fullContext);
      }
    },
    config: function(mapping) {
      var $__0 = this;
      if (mapping instanceof Array) {
        return mapping.forEach((function(nav) {
          return $__0.config(nav);
        }));
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
      return this.renavigate();
    },
    navigate: function(url) {
      var force = arguments[1] !== (void 0) ? arguments[1] : false;
      var $__0 = this;
      if (this.navigating) {
        return $q.when();
      }
      if (!force && url === this.previousUrl) {
        return $q.when();
      }
      this.previousUrl = url;
      var context = this.recognizer.recognize(url);
      if (notMatched(context)) {
        context = this.childRecognizer.recognize(url);
        if (notMatched(context)) {
          return $q.reject();
        }
        var path = context[0].handler.path;
        var segment = path.substr(0, path.length - CHILD_ROUTE_SUFFIX.length);
        if (this.previousSegment === segment) {
          return this.navigateChildren(context);
        }
        this.previousSegment = segment;
      }
      if (notMatched(context)) {
        return $q.reject();
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
      })).then((function() {
        return $__0.navigating = false;
      })).then((function() {
        return $__0.previousContext = context;
      }));
    },
    renavigate: function() {
      if (this.navigating) {
        return $q.when();
      }
      if (this.previousUrl) {
        return this.navigate(this.previousUrl, true);
      } else {
        return $q.when();
      }
    },
    navigateChildren: function(context) {
      if (context[0].params.childRoute) {
        var subNav = '/' + context[0].params.childRoute;
        return $q.all(this.children.map((function(child) {
          return child.navigate(subNav);
        })));
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
        throw new Error('Can not find route');
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
        return $q.when(port.deactivate && port.deactivate(context)).then(port.activate(context));
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
      var $__0 = this;
      return this.viewportsCanDeactivate(context).then((function(status) {
        return (status && $__0.viewportsCanActivate(context));
      }));
    },
    viewportsCanDeactivate: function(context) {
      return this.queryViewports(context, (function(port) {
        return $q.when(!port.canDeactivate || port.canDeactivate(context));
      }));
    },
    viewportsCanActivate: function(context) {
      return this.queryViewports(context, (function(port) {
        return $q.when(!port.canActivate || port.canActivate(context));
      }));
    },
    queryViewports: function(context, fn) {
      var allViewportQueries = mapObj(this.ports, fn);
      return $q.all(allViewportQueries).then(booleanReduction);
    }
  }, {});
  Object.defineProperty(Router.prototype.navigate, "parameters", {get: function() {
      return [[String], [Boolean]];
    }});
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

return new Router();}]);