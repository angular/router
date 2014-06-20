import {REPLACE, buildNavigationPlan} from './navigationPlan';
import {getWildcardPath} from './util';
import {Router} from './router';
import {Provide} from 'di';

export class LoadNewComponentsStep {
  constructor(componentLoader, viewFactory){
    this.componentLoader = componentLoader;
    this.viewFactory = viewFactory;
  }

  run(navigationContext, next) {
    return loadNewComponents(this.componentLoader, this.viewFactory, navigationContext)
      .then(next)
      .catch(next.cancel);
  }
}

export function loadNewComponents(componentLoader, viewFactory, navigationContext) {
  var toLoad = determineWhatToLoad(navigationContext);
  var loadPromises = toLoad.map(current => loadComponent(
    componentLoader, 
    viewFactory, 
    current.navigationContext, 
    current.viewPortPlan
    )
  );

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

function loadComponent(componentLoader, viewFactory, navigationContext, viewPortPlan) {
  var componentUrl = viewPortPlan.config.componentUrl;
  var next = navigationContext.nextInstruction;

  return resolveComponentInstance(
    componentLoader,
    viewFactory, 
    navigationContext.router, 
    viewPortPlan
    ).then(component => {

    //TODO: remove this hack
    component.executionContext = component._injector._children[0].get('executionContext');

    var viewPortInstruction = next.addViewPortInstruction(
      viewPortPlan.name,
      viewPortPlan.strategy,
      componentUrl,
      component
      );

    var controller = component.executionContext;

    if (controller.router) {
      var path = getWildcardPath(next.config.pattern, next.params, next.queryString);

      return controller.router.createNavigationInstruction(path, next).then((childInstruction) => {
        viewPortPlan.childNavigationContext = controller.router
          .createNavigationContext(childInstruction);

        return buildNavigationPlan(viewPortPlan.childNavigationContext).then((childPlan) => {
          viewPortPlan.childNavigationContext.plan = childPlan;
          viewPortInstruction.childNavigationContext = viewPortPlan.childNavigationContext;
          
          return loadNewComponents(
            componentLoader, 
            viewFactory, 
            viewPortPlan.childNavigationContext
            );
        });
      });
    }
  });
}

function resolveComponentInstance(componentLoader, viewFactory, router, viewPortPlan) {
  var viewPort = router.viewPorts[viewPortPlan.name];
  var url = viewPortPlan.config.componentUrl + '.html';

  return new Promise((resolve, reject) => {
    componentLoader.loadFromTemplateUrl({
      templateUrl: url,
      done: ({directive})=> {

        @Provide(Router)
        function childRouterProvider() {
          return router.createChild();
        }

        function createComponent(port){
          var component = viewFactory.createComponentView({
            component: directive,
            providers: [childRouterProvider],
            viewPort: port
          });

          resolve(component);
        }

        if(viewPort){
          createComponent(viewPort);
        }else{
          router.viewPorts[viewPortPlan.name] = createComponent;
        }
      }
    });
  });
}