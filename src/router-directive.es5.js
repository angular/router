/*
 * This is for Angular 1.3
 */

angular.module('ngFuturisticRouter', ['ngFuturisticRouter.generated']).
  directive('routerComponent', routerComponentDirective).
  value('routeParams', {}).
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
function routerComponentDirective($controller, $compile, $templateRequest, router) {
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

    var controllerName = componentName[0].toUpperCase() +
                         componentName.substr(1) +
                         'Controller';

    $templateRequest(componentName + '.html').then(function(template) {

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
function routerViewPortDirective($compile, $templateRequest) {
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

        return $templateRequest(componentName + '.html');
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

function routerLinkDirective(router) {
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

    var url = router.generate(attrs.routerLink);
    elt.attr('href', url);

    elt.on('click', function (ev) {
      router.navigate(url);
      ev.preventDefault();
    });
  }

}
