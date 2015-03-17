define(["assert", './grammar', './pipeline'], function($__0,$__2,$__4) {
  "use strict";
  if (!$__0 || !$__0.__esModule)
    $__0 = {default: $__0};
  if (!$__2 || !$__2.__esModule)
    $__2 = {default: $__2};
  if (!$__4 || !$__4.__esModule)
    $__4 = {default: $__4};
  var assert = $__0.assert;
  var Grammar = $__2.Grammar;
  var Pipeline = $__4.Pipeline;
  var Router = function Router(grammar, pipeline, parent, name) {
    assert.argumentTypes(grammar, Grammar, pipeline, Pipeline, parent, $traceurRuntime.type.any, name, $traceurRuntime.type.any);
    this.name = name;
    this.parent = parent || null;
    this.root = parent ? parent.root : this;
    this.navigating = false;
    this.ports = {};
    this.rewrites = {};
    this.children = {};
    this.registry = grammar;
    this.pipeline = pipeline;
    this.instruction = null;
  };
  ($traceurRuntime.createClass)(Router, {
    childRouter: function() {
      var name = arguments[0] !== (void 0) ? arguments[0] : 'default';
      if (!this.children[name]) {
        this.children[name] = new ChildRouter(this, name);
      }
      return this.children[name];
    },
    registerViewport: function(view) {
      var name = arguments[1] !== (void 0) ? arguments[1] : 'default';
      if (this.ports[name]) {}
      this.ports[name] = view;
      return this.renavigate();
    },
    config: function(mapping) {
      this.registry.config(this.name, mapping);
      return this.renavigate();
    },
    navigate: function(url) {
      var $__6 = this;
      if (this.navigating) {
        return Promise.resolve();
      }
      this.lastNavigationAttempt = url;
      var instruction = this.recognize(url);
      if (notMatched(instruction)) {
        return Promise.reject();
      }
      this.makeDescendantRouters(instruction);
      return this.canDeactivatePorts(instruction).then((function() {
        return $__6.traverseInstruction(instruction, (function(instruction, viewportName) {
          return instruction.controller = $__6.pipeline.init(instruction);
        }));
      })).then((function() {
        return $__6.traverseInstruction(instruction, (function(instruction, viewportName) {
          var controller = instruction.controller;
          return !controller.canActivate || controller.canActivate();
        }));
      })).then((function() {
        return $__6.traverseInstruction(instruction, (function(instruction, viewportName) {
          return $__6.pipeline.load(instruction).then((function(templateHtml) {
            return instruction.template = templateHtml;
          }));
        }));
      })).then((function() {
        return $__6.activatePorts(instruction);
      })).then((function() {
        return instruction.canonicalUrl;
      }));
    },
    makeDescendantRouters: function(instruction) {
      instruction.router = this;
      this.traverseInstructionSync(instruction, (function(instruction, childInstruction) {
        childInstruction.router = instruction.router.childRouter(childInstruction.component);
      }));
    },
    traverseInstructionSync: function(instruction, fn) {
      var $__6 = this;
      forEach(instruction.viewports, (function(childInstruction, viewportName) {
        return fn(instruction, childInstruction);
      }));
      forEach(instruction.viewports, (function(childInstruction) {
        return $__6.traverseInstructionSync(childInstruction, fn);
      }));
    },
    traverseInstruction: function(instruction, fn) {
      if (!instruction) {
        return Promise.resolve();
      }
      return Promise.all(mapObj(instruction.viewports, (function(childInstruction, viewportName) {
        return boolToPromise(fn(childInstruction, viewportName));
      }))).then((function() {
        return Promise.all(mapObj(instruction.viewports, (function(childInstruction, viewportName) {
          return childInstruction.router.traverseInstruction(childInstruction, fn);
        })));
      }));
    },
    activatePorts: function(instruction) {
      return Promise.all(mapObj(this.ports, (function(port, name) {
        return port.activate(instruction.viewports[name]);
      }))).then((function() {
        return Promise.all(mapObj(instruction.viewports, (function(instruction, viewportName) {
          return instruction.router.activatePorts(instruction);
        })));
      }));
    },
    canDeactivatePorts: function(instruction) {
      var $__6 = this;
      return Promise.all(mapObj(this.ports, (function(port, name) {
        return boolToPromise(port.canDeactivate(instruction.viewports[name]));
      }))).then((function() {
        return Promise.all(mapObj($__6.children, (function(child) {
          return child.canDeactivatePorts(instruction);
        })));
      }));
    },
    recognize: function(url) {
      return this.registry.recognize(url);
    },
    renavigate: function() {
      var renavigateDestination = this.previousUrl || this.lastNavigationAttempt;
      if (!this.navigating && renavigateDestination) {
        return this.navigate(renavigateDestination);
      } else {
        return Promise.resolve();
      }
    },
    generate: function(name, params) {
      assert.argumentTypes(name, $traceurRuntime.type.string, params, $traceurRuntime.type.any);
      return this.registry.generate(name, params);
    }
  }, {});
  Router.parameters = [[Grammar], [Pipeline], [], []];
  Router.prototype.generate.parameters = [[$traceurRuntime.type.string], []];
  var RootRouter = function RootRouter(grammar, pipeline) {
    assert.argumentTypes(grammar, Grammar, pipeline, Pipeline);
    $traceurRuntime.superCall(this, $RootRouter.prototype, "constructor", [grammar, pipeline, null, '/']);
  };
  var $RootRouter = RootRouter;
  ($traceurRuntime.createClass)(RootRouter, {}, {}, Router);
  RootRouter.parameters = [[Grammar], [Pipeline]];
  var ChildRouter = function ChildRouter(parent, name) {
    $traceurRuntime.superCall(this, $ChildRouter.prototype, "constructor", [parent.registry, parent.pipeline, parent, name]);
    this.parent = parent;
  };
  var $ChildRouter = ChildRouter;
  ($traceurRuntime.createClass)(ChildRouter, {}, {}, Router);
  function copy(obj) {
    return JSON.parse(JSON.stringify(obj));
  }
  function notMatched(instruction) {
    return instruction == null || instruction.length < 1;
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
  function boolToPromise(value) {
    return value ? Promise.resolve(value) : Promise.reject();
  }
  return {
    get RootRouter() {
      return RootRouter;
    },
    __esModule: true
  };
});
