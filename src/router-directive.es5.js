'use strict';

/*
 * A module for adding new a routing system Angular 1.
 */
angular.module('ngNewRouter', [])
  .factory('$router', routerFactory)
  .value('$routeParams', {})
  .factory('$componentMapper', $componentMapperFactory)
  .provider('$pipeline', pipelineProvider)
  .factory('$$pipeline', privatePipelineFactory)
  .factory('$setupRoutersStep', setupRoutersStepFactory)
  .factory('$initLocalsStep', initLocalsStepFactory)
  .factory('$runCanDeactivateHookStep', runCanDeactivateHookStepFactory)
  .factory('$runCanActivateHookStep', runCanActivateHookStepFactory)
  .factory('$loadTemplatesStep', loadTemplatesStepFactory)
  .value('$activateStep', activateStepValue)
  .directive('ngOutlet', ngOutletDirective)
  .directive('ngOutlet', ngOutletFillContentDirective)
  .directive('ngLink', ngLinkDirective)
  .directive('a', anchorLinkDirective)


var NOOP_CONTROLLER = function(){};

/*
 * A module for inspecting controller constructors
 */
angular.module('ng')
  .provider('$controllerIntrospector', $controllerIntrospectorProvider)
  .config(controllerProviderDecorator);

/*
 * decorates with routing info
 */
function controllerProviderDecorator($controllerProvider, $controllerIntrospectorProvider) {
  var register = $controllerProvider.register;
  $controllerProvider.register = function (name, ctrl) {
    $controllerIntrospectorProvider.register(name, ctrl);
    return register.apply(this, arguments);
  };
}

/*
 * private service that holds route mappings for each controller
 */
function $controllerIntrospectorProvider() {
  var controllers = [];
  var controllersByName = {};
  var onControllerRegistered = null;
  return {
    register: function (name, constructor) {
      if (angular.isArray(constructor)) {
        constructor = constructor[constructor.length - 1];
      }
      controllersByName[name] = constructor;
      if (constructor.$routeConfig) {
        if (onControllerRegistered) {
          onControllerRegistered(name, constructor.$routeConfig);
        } else {
          controllers.push({name: name, config: constructor.$routeConfig});
        }
      }
    },
    $get: ['$componentMapper', function ($componentMapper) {
      var fn = function (newOnControllerRegistered) {
        onControllerRegistered = function (name, constructor) {
          name = $componentMapper.component(name);
          return newOnControllerRegistered(name, constructor);
        };
        while(controllers.length > 0) {
          var rule = controllers.pop();
          onControllerRegistered(rule.name, rule.config);
        }
      };

      fn.getTypeByName = function (name) {
        return controllersByName[name];
      };

      return fn;
    }]
  }
}

function routerFactory($$rootRouter, $rootScope, $location, $$grammar, $controllerIntrospector) {

  $controllerIntrospector(function (name, config) {
    $$grammar.config(name, config);
  });

  $rootScope.$watch(function () {
    return $location.path();
  }, function (newUrl) {
    $$rootRouter.navigate(newUrl);
  });

  var nav = $$rootRouter.navigate;
  $$rootRouter.navigate = function (url) {
    return nav.call(this, url).then(function (newUrl) {
      if (newUrl) {
        $location.path(newUrl);
      }
    });
  }

  return $$rootRouter;
}

/**
 * @name ngOutlet
 *
 * @description
 * An ngOutlet is where resolved content goes.
 *
 * ## Use
 *
 * ```html
 * <div ng-outlet="name"></div>
 * ```
 *
 * The value for the `ngOutlet` attribute is optional.
 */
function ngOutletDirective($animate, $injector, $q, $router, $componentMapper, $controller) {
  var rootRouter = $router;

  return {
    restrict: 'AE',
    transclude: 'element',
    terminal: true,
    priority: 400,
    require: ['?^^ngOutlet', 'ngOutlet'],
    link: outletLink,
    controller: function() {},
    controllerAs: '$$ngOutlet'
  };

  function invoke(method, context, instruction) {
    return $injector.invoke(method, context, instruction.locals);
  }

  function outletLink(scope, $element, attrs, ctrls, $transclude) {
    var outletName = attrs.ngOutlet || 'default',
        parentCtrl = ctrls[0],
        myCtrl = ctrls[1],
        router = (parentCtrl && parentCtrl.$$router) || rootRouter;

    var currentScope,
        newScope,
        currentController,
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

    router.registerOutlet({
      canDeactivate: function(instruction) {
        if (currentController && currentController.canDeactivate) {
          return invoke(currentController.canDeactivate, currentController, instruction);
        }
        return true;
      },
      activate: function(instruction) {
        var nextInstruction = serializeInstruction(instruction);
        if (nextInstruction === previousInstruction) {
          return;
        }

        var controllerConstructor = instruction.controllerConstructor;

        if (!instruction.locals.$scope) {
          instruction.locals.$scope = scope.$new();
        }
        newScope = instruction.locals.$scope;

        if (controllerConstructor === NOOP_CONTROLLER) {
          console.warn && console.warn('Could not find controller for', $componentMapper.controllerName(instruction.component));
        }
        var ctrl = $controller(controllerConstructor, instruction.locals);
        instruction.controllerAs = $componentMapper.controllerAs(instruction.component);
        instruction.controller = ctrl;

        myCtrl.$$router = instruction.router;
        myCtrl.$$template = instruction.template;
        var controllerAs = instruction.controllerAs || instruction.component;
        var clone = $transclude(newScope, function(clone) {
          $animate.enter(clone, null, currentElement || $element);
          cleanupLastView();
        });

        var newController = instruction.controller;
        newScope[controllerAs] = newController;

        var result;
        if (currentController && currentController.deactivate) {
          result = $q.when(invoke(currentController.deactivate, currentController, instruction));
        }

        currentController = newController;

        currentElement = clone;
        currentScope = newScope;

        previousInstruction = nextInstruction;

        // finally, run the hook
        if (newController.activate) {
          var activationResult = $q.when(invoke(newController.activate, newController, instruction));
          if (result) {
            return result.then(activationResult);
          } else {
            return activationResult;
          }
        }
        return result;
      }
    }, outletName);
  }

  // TODO: how best to serialize?
  function serializeInstruction(instruction) {
    return JSON.stringify({
      path: instruction.path,
      component: instruction.component,
      params: Object.keys(instruction.params).reduce(function (acc, key) {
        return (key !== 'childRoute' && (acc[key] = instruction.params[key])), acc;
      }, {})
    });
  }
}

function ngOutletFillContentDirective($compile) {
  return {
    restrict: 'EA',
    priority: -400,
    require: 'ngOutlet',
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
 * @name ngLink
 * @description
 * Lets you link to different parts of the app, and automatically generates hrefs.
 *
 * ## Use
 * The directive uses a simple syntax: `ng-link="componentName({ param: paramValue })"`
 *
 * ## Example
 *
 * ```js
 * angular.module('myApp', ['ngFuturisticRouter'])
 *   .controller('AppController', ['$router', function($router) {
 *     $router.config({ path: '/user/:id' component: 'user' });
 *     this.user = { name: 'Brian', id: 123 };
 *   });
 * ```
 *
 * ```html
 * <div ng-controller="AppController as app">
 *   <a ng-link="user({id: app.user.id})">{{app.user.name}}</a>
 * </div>
 * ```
 */
function ngLinkDirective($router, $location, $parse) {
  var rootRouter = $router;

  return {
    require: '?^^ngOutlet',
    restrict: 'A',
    link: ngLinkDirectiveLinkFn
  };

  function ngLinkDirectiveLinkFn(scope, elt, attrs, ctrl) {
    var router = (ctrl && ctrl.$$router) || rootRouter;
    if (!router) {
      return;
    }

    var link = attrs.ngLink || '';
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


function anchorLinkDirective($router) {
  return {
    restrict: 'E',
    link: function(scope, element) {
      // If the linked element is not an anchor tag anymore, do nothing
      if (element[0].nodeName.toLowerCase() !== 'a') return;

      // SVGAElement does not use the href attribute, but rather the 'xlinkHref' attribute.
      var hrefAttrName = Object.prototype.toString.call(element.prop('href')) === '[object SVGAnimatedString]' ?
                     'xlink:href' : 'href';

      element.on('click', function(event) {
        if (event.which !== 1)
          return;

        var href = element.attr(hrefAttrName);
        if (!href) {
          event.preventDefault();
        }
        if ($router.recognize(href)) {
          $router.navigate(href);
          event.preventDefault();
        }
      });
    }
  }
}

function setupRoutersStepFactory() {
  return function (instruction) {
    return instruction.router.makeDescendantRouters(instruction);
  }
}

//TODO: rename to "normalize" step
/*
 * $initLocalsStep
 */
function initLocalsStepFactory($componentMapper, $controllerIntrospector) {
  return function initLocals(instruction) {
    return instruction.router.traverseInstruction(instruction, function(instruction) {
      if (typeof instruction.component === 'function') {
        instruction.controllerConstructor = instruction.component;
      } else {
        var controllerName = $componentMapper.controllerName(instruction.component);
        if (typeof controllerName === 'function') {
          instruction.controllerConstructor = controllerName;
        } else {
          instruction.controllerConstructor = $controllerIntrospector.getTypeByName(controllerName) || NOOP_CONTROLLER;
        }
      }
      return instruction.locals = {
        $router: instruction.router,
        $routeParams: (instruction.params || {})
      };
    });
  }
}


function runCanDeactivateHookStepFactory() {
  return function runCanDeactivateHook(instruction) {
    return instruction.router.canDeactivatePorts(instruction);
  };
}

function runCanActivateHookStepFactory($injector) {

  function invoke(method, context, instruction) {
    return $injector.invoke(method, context, {
      $routeParams: instruction.params
    });
  }

  return function runCanActivateHook(instruction) {
    return instruction.router.traverseInstruction(instruction, function(instruction) {
      var controllerConstructor = instruction.controllerConstructor;
      return !controllerConstructor.canActivate || invoke(controllerConstructor.canActivate, null, instruction);
    });
  }
}

function loadTemplatesStepFactory($componentMapper, $templateRequest) {
  return function loadTemplates(instruction) {
    return instruction.router.traverseInstruction(instruction, function(instruction) {
      var componentTemplateUrl = $componentMapper.template(instruction.component);
      return $templateRequest(componentTemplateUrl).then(function (templateHtml) {
        return instruction.template = templateHtml;
      });
    });
  };
}


function activateStepValue(instruction) {
  return instruction.router.activatePorts(instruction);
}


function pipelineProvider() {
  var stepConfiguration;

  var protoStepConfiguration = [
    '$setupRoutersStep',
    '$initLocalsStep',
    '$runCanDeactivateHookStep',
    '$runCanActivateHookStep',
    '$loadTemplatesStep',
    '$activateStep'
  ];

  return {
    steps: protoStepConfiguration.slice(0),
    config: function (newConfig) {
      protoStepConfiguration = newConfig;
    },
    $get: function ($injector, $q) {
      stepConfiguration = protoStepConfiguration.map(function (step) {
        return $injector.get(step);
      });
      return {
        process: function(instruction) {
          // make a copy
          var steps = stepConfiguration.slice(0);

          function processOne(result) {
            if (steps.length === 0) {
              return result;
            }
            var step = steps.shift();
            return $q.when(step(instruction)).then(processOne);
          }

          return processOne();
        }
      }
    }
  };
}


/**
 * @name $componentMapperFactory
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
function $componentMapperFactory() {

  var DEFAULT_SUFFIX = 'Controller';

  var componentToCtrl = function componentToCtrlDefault(name) {
    return name[0].toUpperCase() + name.substr(1) + DEFAULT_SUFFIX;
  };

  var componentToTemplate = function componentToTemplateDefault(name) {
    var dashName = dashCase(name);
    return './components/' + dashName + '/' + dashName + '.html';
  };

  var ctrlToComponent = function ctrlToComponentDefault(name) {
    return name[0].toLowerCase() + name.substr(1, name.length - DEFAULT_SUFFIX.length - 1);
  };

  var componentToControllerAs = function componentToControllerAsDefault(name) {
    return name;
  };

  return {
    controllerName: function (name) {
      return componentToCtrl(name);
    },

    controllerAs: function (name) {
      return componentToControllerAs(name);
    },

    template: function (name) {
      return componentToTemplate(name);
    },

    component: function (name) {
      return ctrlToComponent(name);
    },

    /**
     * @name $componentMapper#setCtrlNameMapping
     * @description takes a function for mapping component names to component controller names
     */
    setCtrlNameMapping: function(newFn) {
      componentToCtrl = newFn;
      return this;
    },

    /**
     * @name $componentMapper#setCtrlAsMapping
     * @description takes a function for mapping component names to controllerAs name in the template
     */
    setCtrlAsMapping: function(newFn) {
      componentToControllerAs = newFn;
      return this;
    },

    /**
     * @name $componentMapper#setComponentFromCtrlMapping
     * @description takes a function for mapping component controller names to component names
     */
    setComponentFromCtrlMapping: function (newFn) {
      ctrlToComponent = newFn;
      return this;
    },

    /**
     * @name $componentMapper#setTemplateMapping
     * @description takes a function for mapping component names to component template URLs
     */
    setTemplateMapping: function(newFn) {
      componentToTemplate = newFn;
      return this;
    }
  };
}

// this is a hack as a result of the build system used to transpile
function privatePipelineFactory($pipeline) {
  return $pipeline;
}


function dashCase(str) {
  return str.replace(/([A-Z])/g, function ($1) {
    return '-' + $1.toLowerCase();
  });
}
