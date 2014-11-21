/*
 * This is for Angular 1.3
 */

angular.module('ngFuturisticRouter', ['ngFuturisticRouter.generated']).
  directive('routerComponent', routerComponentDirective).
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
function routerComponentDirective($controller, $compile, $templateRequest, router, componentLoader) {
  return {
    restrict: 'AE',
    scope: {},
    require: '?^^routerComponent',
    link: routerComponentLinkFn,
    controller: function () {},
    controllerAs: '$$routerComponentController'
  };

  function routerComponentLinkFn(scope, elt, attrs, ctrl) {
    var childRouter = (ctrl && ctrl.$$router && ctrl.$$router.childRouter()) || router;
    var parentRouter = childRouter.parent || childRouter;

    var componentName = attrs.routerComponent || attrs.componentName;

    var component = componentLoader(componentName);
    var controllerName = component.controllerName;

    $templateRequest(component.template).then(function(template) {

      elt.html(template);

      var link = $compile(elt.contents());

      var locals = {
        $scope: scope
      };

      if (parentRouter.context) {
        locals.routeParams = parentRouter.context.params;
      }

      scope.$$routerComponentController.$$router = locals.router = childRouter;

      // TODO: the pipeline should probably be responsible for creating this...
      var ctrl = $controller(controllerName, locals);

      link(scope);

      scope[componentName] = ctrl;

      if (ctrl.activate) {
        ctrl.activate();
      }

    });

  }
}


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
function routerViewPortDirective($compile, $templateRequest, componentLoader) {
  return {
    restrict: 'AE',
    require: '^^routerComponent',
    link: viewPortLink
  };

  function viewPortLink(scope, elt, attrs, ctrl) {
    var router = ctrl.$$router;

    var name = attrs.routerViewPort || 'default';

    router.registerViewPort({
      activate: function (instruction) {
        var component = instruction[0].handler.component;
        var componentName = typeof component === 'string' ? component : component[name];

        var template = makeComponentString(componentName);
        elt.html(template);
        var link = $compile(elt.contents());
        ctrl.$$router.context = instruction[0];
        link(scope.$new());

        // TODO: this is a hack to avoid ordering constraint issues
        return $templateRequest(componentLoader(componentName).template);
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
      router.navigate(url);
      $location.path(url);
      ev.preventDefault();
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
    return name + '.html';
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
