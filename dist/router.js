define(["assert", 'route-recognizer'], function($__0,$__2) {
  "use strict";
  if (!$__0 || !$__0.__esModule)
    $__0 = {default: $__0};
  if (!$__2 || !$__2.__esModule)
    $__2 = {default: $__2};
  var assert = $__0.assert;
  var RouteRecognizer = $__2.default;
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
      var $__4 = this;
      if (mapping instanceof Array) {
        return mapping.forEach((function(nav) {
          return $__4.config(nav);
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
      var $__4 = this;
      if (this.navigating) {
        return Promise.resolve();
      }
      if (!force && url === this.previousUrl) {
        return Promise.resolve();
      }
      this.previousUrl = url;
      var context = this.recognizer.recognize(url);
      if (notMatched(context)) {
        context = this.childRecognizer.recognize(url);
        if (notMatched(context)) {
          return Promise.reject();
        }
        var path = context[0].handler.path;
        var segment = path.substr(0, path.length - CHILD_ROUTE_SUFFIX.length);
        if (this.previousSegment === segment) {
          return this.navigateChildren(context);
        }
        this.previousSegment = segment;
      }
      if (notMatched(context)) {
        return Promise.reject();
      }
      if (this.context === context[0]) {
        return Promise.resolve();
      }
      this.context = context[0];
      this.fullContext = context;
      this.navigating = true;
      context.component = this.context.handler.component;
      return this.canNavigate(context).then((function(status) {
        return (status && $__4.activatePorts(context));
      })).then((function() {
        return $__4.navigating = false;
      })).then((function() {
        return $__4.previousContext = context;
      }));
    },
    renavigate: function() {
      if (this.navigating) {
        return Promise.resolve();
      }
      if (this.previousUrl) {
        return this.navigate(this.previousUrl, true);
      } else {
        return Promise.resolve();
      }
    },
    navigateChildren: function(context) {
      if (context[0].params.childRoute) {
        var subNav = '/' + context[0].params.childRoute;
        return Promise.all(this.children.map((function(child) {
          return child.navigate(subNav);
        })));
      }
      return Promise.resolve();
    },
    generate: function(name, params) {
      assert.argumentTypes(name, $traceurRuntime.type.string, params, $traceurRuntime.type.any);
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
      var $__4 = this;
      var activations = mapObj(this.ports, (function(port) {
        return Promise.resolve(port.deactivate && port.deactivate(context)).then(port.activate(context));
      }));
      return Promise.all(activations).then((function() {
        return $__4.navigateChildren(context);
      }));
    },
    canNavigate: function(context) {
      return Promise.all(this.gatherNagigationPredicates(context)).then(booleanReduction);
    },
    gatherNagigationPredicates: function(context) {
      return this.children.reduce((function(promises, child) {
        return promises.concat(child.gatherNagigationPredicates(context));
      }), [this.navigationPredicate(context)]);
    },
    navigationPredicate: function(context) {
      var $__4 = this;
      return this.viewportsCanDeactivate(context).then((function(status) {
        return (status && $__4.viewportsCanActivate(context));
      }));
    },
    viewportsCanDeactivate: function(context) {
      return this.queryViewports(context, (function(port) {
        return Promise.resolve(!port.canDeactivate || port.canDeactivate(context));
      }));
    },
    viewportsCanActivate: function(context) {
      return this.queryViewports(context, (function(port) {
        return Promise.resolve(!port.canActivate || port.canActivate(context));
      }));
    },
    queryViewports: function(context, fn) {
      var allViewportQueries = mapObj(this.ports, fn);
      return Promise.all(allViewportQueries).then(booleanReduction);
    }
  }, {});
  Router.prototype.navigate.parameters = [[String], [Boolean]];
  Router.prototype.generate.parameters = [[$traceurRuntime.type.string], []];
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
  return {
    get Router() {
      return Router;
    },
    __esModule: true
  };
});
