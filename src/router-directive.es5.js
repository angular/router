'use strict';

/*
 * A module for adding new a routing system Angular 1.
 */
angular.module('ngFuturisticRouter', ['ngFuturisticRouter.generated']).
  value('routeParams', {}).
  provider('componentLoader', componentLoaderProvider).
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
function routerViewPortDirective($animate, $compile, $controller, $templateRequest, $rootScope, $location, componentLoader, router) {
  var rootRouter = router;

  $rootScope.$watch(function () {
    return $location.path();
  }, function (newUrl) {
    router.navigate(newUrl);
  });

  var nav = router.navigate;
  router.navigate = function (url) {
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
      return componentLoader(componentName);
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
          router: scope.$$routerViewPort.$$router = router.childRouter()
        };

        if (router.context) {
          locals.routeParams = router.context.params;
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
 *   .controller('AppController', ['router', fucntion(router) {
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
function routerLinkDirective(router, $location, $parse) {
  var rootRouter = router;

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
 * @name componentLoaderProvider
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
function componentLoaderProvider() {
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
      template: componentToTemplate(name),
    };
  }

  return {
    $get: function () {
      return componentLoader;
    },
    /**
     * @name componentLoaderProvider#setCtrlNameMapping
     * @description takes a function for mapping component names to component controller names
     */
    setCtrlNameMapping: function(newFn) {
      componentToCtrl = newFn;
      return this;
    },
    /**
     * @name componentLoaderProvider#setTemplateMapping
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
