/*
 * This is for Angular 1.3
 */

angular.module('ngFuturisticRouter', ['ngFuturisticRouter.generated']).
  directive('routerComponent', routerComponentDirective).
  value('routeParams', {}).
  directive('routerViewPort', routerViewPortDirective);

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
    var parentRouter = (ctrl && ctrl.$$router) || router;
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

      // if the template has router-view-ports then
      // we should create a child router
      if (template.indexOf('router-view-port') > -1) {
        scope.$$routerComponentController.$$router =
            locals.router =
            parentRouter.childRouter();
      }

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
function routerViewPortDirective($compile) {
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
        var componentName = typeof instruction.component === 'string' ?
            instruction.component : instruction.component[name];

        var template = makeComponentString(componentName);
        elt.html(template);
        var link = $compile(elt.contents());
        ctrl.$$router.context = instruction[0];
        link(scope.$new());
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
