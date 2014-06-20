import {REPLACE, buildNavigationPlan} from './navigationPlan';
import {getWildcardPath} from './util';
import {Router} from './router';
import {Provide} from 'di';
import {ViewFactory, ComponentLoader} from 'templating';

export class LoadNewComponentsStep {
  run(navigationContext, next) {
    return loadNewComponents(navigationContext)
      .then(next)
      .catch(next.cancel);
  }
}

export function loadNewComponents(navigationContext) {
  var toLoad = determineWhatToLoad(navigationContext);
  var loadPromises = toLoad
      .map((current) => loadComponent(current.navigationContext, current.viewPortPlan));

  return Promise.all(loadPromises);
}

function determineWhatToLoad(navigationContext, toLoad) {
  var plan = navigationContext.plan;
  var next = navigationContext.nextInstruction;

  toLoad = toLoad || [];

  for (var viewPortName in plan) {
    var viewPortPlan = plan[viewPortName];

    if (viewPortPlan.strategy == REPLACE) {
      toLoad.push({
        viewPortPlan: viewPortPlan,
        navigationContext: navigationContext
      });

      if (viewPortPlan.childNavigationContext) {
        determineWhatToLoad(viewPortPlan.childNavigationContext, toLoad);
      }
    } else {
      var viewPortInstruction = next.addViewPortInstruction(
          viewPortName,
          viewPortPlan.strategy,
          viewPortPlan.prevComponentUrl,
          viewPortPlan.prevComponent
          );

      if (viewPortPlan.childNavigationContext) {
        viewPortInstruction.childNavigationContext = viewPortPlan.childNavigationContext;
        determineWhatToLoad(viewPortPlan.childNavigationContext, toLoad);
      }
    }
  }

  return toLoad;
}

function loadComponent(navigationContext, viewPortPlan) {
  var componentUrl = viewPortPlan.config.componentUrl;
  var next = navigationContext.nextInstruction;

  return resolveComponentInstance(navigationContext.router, viewPortPlan).then((component) => {

    //TODO: remove this hack
    component.injector = component._injector._children[0];
    component.executionContext = component.injector.get('executionContext');

    var viewPortInstruction = next.addViewPortInstruction(
      viewPortPlan.name,
      viewPortPlan.strategy,
      componentUrl,
      component
      );

    var controller = component.executionContext;

    if (controller.router) {
      controller.router.injector = component.injector;

      var path = getWildcardPath(next.config.pattern, next.params, next.queryString);

      return controller.router.createNavigationInstruction(path, next).then((childInstruction) => {
        viewPortPlan.childNavigationContext = controller.router.createNavigationContext(childInstruction);

        return buildNavigationPlan(viewPortPlan.childNavigationContext).then((childPlan) => {
          viewPortPlan.childNavigationContext.plan = childPlan;
          viewPortInstruction.childNavigationContext = viewPortPlan.childNavigationContext;
          return loadNewComponents(viewPortPlan.childNavigationContext);
        });
      });
    }
  });
}

function resolveComponentInstance(router, viewPortPlan) {
  var viewPort = router.viewPorts[viewPortPlan.name],
      injector = (viewPort && viewPort.injector) || router.injector._root,
      loader = injector.get(ComponentLoader);

  var url = viewPortPlan.config.componentUrl + '.html';

  return new Promise((resolve, reject) => {
    loader.loadFromTemplateUrl({
      templateUrl: url,
      done: ({directive})=> {
        @Provide(Router)
        function childRouterProvider() {
          return router.createChild();
        }

        var modules = [childRouterProvider],
            component = createComponent(injector, directive, modules);

        resolve(component);
      }
    });
  });
}

function createComponent(injector, componentType, modules) {
  var viewFactory = injector.get(ViewFactory);

  return viewFactory.createComponentView({
    component: componentType,
    providers: modules
  });
}
