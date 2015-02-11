'use strict';

/*
 * A module for adding new a routing system Angular 1.
 */
angular.module('ngFuturisticRouter', ['ngFuturisticRouter.generated']).
  value('routeParams', {}).
  provider('componentLoader', componentLoaderProvider).
  directive('routerViewPort', routerViewPortDirective).
  directive('routerLink', routerLinkDirective);



/**
 * @name routerViewPort
 *
 * @description
 * A routerViewPort is where resolved content goes.
 *
 * ## Use
 * `<router-view-port>` needs to appear inside of a routerComponent
 *
 * ```html
 * <div router-view-port="name"></div>
 * ```
 *
 * The value for the `routerViewComponent` attribute is optional.
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
    require: '?^^routerViewPort',
    link: viewPortLink,
    controller: function() {},
    controllerAs: '$$routerViewPort'
  };

  function viewPortLink(scope, elt, attrs, ctrl) {
    var viewPortName = attrs.routerViewPort || 'default',
        router = (ctrl && ctrl.$$router && ctrl.$$router) || rootRouter;

    var oldCtrl = null,
        oldChildScope = null,
        oldLocals = null,
        template = '',
        ctrl = null,
        childScope = null,
        locals = null;

    function getComponentFromInstruction(instruction) {
        var component = instruction[0].handler.component;
        var componentName = typeof component === 'string' ? component : component[viewPortName];
        return componentLoader(componentName);
    }
    router.registerViewPort({
      canDeactivate: function (instruction) {
        return !ctrl || !ctrl.canDeactivate || ctrl.canDeactivate();
      },
      instantiate: function (instruction) {
        if (ctrl) {
          oldCtrl = ctrl;
          oldChildScope = childScope;
        }

        var controllerName = getComponentFromInstruction(instruction).controllerName;

        // build up locals for controller
        childScope = scope.$new();

        var locals = {
          $scope: childScope,
          router: scope.$$routerViewPort.$$router = router.childRouter()
        };

        if (router.context) {
          locals.routeParams = router.context.params;
        }
        ctrl = $controller(controllerName, locals);
      },
      canActivate: function (instruction) {
        return !ctrl || !ctrl.canActivate || ctrl.canActivate(instruction);
      },
      load: function (instruction) {
        var componentTemplateUrl = getComponentFromInstruction(instruction).template;
        return $templateRequest(componentTemplateUrl).then(function(templateHtml) {
          template = templateHtml;
        });
      },
      activate: function (instruction) {
        var component = instruction[0].handler.component;
        var componentName = typeof component === 'string' ? component : component[viewPortName];

        // note that we remove the old contents, compile the new, then put back the old
        var oldContents = elt.contents();
        if (oldContents.length) {
          oldContents.remove();
        }

        elt.html(template);
        var link = $compile(elt.contents());
        var newContents = elt.contents();
        childScope[componentName] = ctrl;
        link(childScope);
        newContents.remove();

        if (oldContents.length) {
          elt.append(oldContents);
          $animate.leave(oldContents);
        }

        $animate.enter(newContents, elt);

        // finally, run the hook
        if (ctrl.activate) {
          ctrl.activate(instruction);
        }
      }
    }, viewPortName);
  }
}

function makeComponentString(name) {
  return [
    '<router-component component-name="', name, '">',
    '</router-component>'
  ].join('');
}

var LINK_MICROSYNTAX_RE = /^(.+?)(?:\((.*)\))?$/;

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
          return routeParamsGetter(scope, ctrl.one);
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
 * @type provider
 * @description
 *
 * This lets you configure conventions for what controllers are named and where to load templates from.
 *
 * The default behavior is to dasherize and serve from `./components`. `myWidget`
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
     * @name setCtrlNameMapping
     * @description takes a template name
     */
    setCtrlNameMapping: function(newFn) {
      componentToCtrl = newFn;
    },
    /**
     * @name setTemplateMapping
     * @description
     */
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
