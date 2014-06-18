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
	var loadPromises = [];

	for (var i = 0, len = toLoad.length; i < len; i++) {
		var current = toLoad[i];
		loadPromises.push(loadComponent(current.navigationContext, current.zonePlan));
	}

	return Promise.all(loadPromises);
}

function determineWhatToLoad(navigationContext, toLoad) {
	var plan = navigationContext.plan;
	var next = navigationContext.nextInstruction;

	toLoad = toLoad || [];

	for (var zoneName in plan) {
		var zonePlan = plan[zoneName];

		if (zonePlan.strategy == REPLACE) {
			toLoad.push({
				zonePlan: zonePlan,
				navigationContext: navigationContext
			});

			if (zonePlan.childNavigationContext) {
				determineWhatToLoad(zonePlan.childNavigationContext, toLoad);
			}
		} else {
			var zoneInstruction = next.addZoneInstruction(
          zoneName,
          zonePlan.strategy,
          zonePlan.prevComponentUrl,
          zonePlan.prevComponent
          );

      if (zonePlan.childNavigationContext) {
        zoneInstruction.childNavigationContext = zonePlan.childNavigationContext;
        determineWhatToLoad(zonePlan.childNavigationContext, toLoad);
      }
		}
	}

	return toLoad;
}

function loadComponent(navigationContext, zonePlan) {
	var componentUrl = zonePlan.config.componentUrl;
	var next = navigationContext.nextInstruction;

	return resolveComponentInstance(navigationContext.router, zonePlan).then((component) => {
    component.injector = component._injector._children[0];
    component.executionContext = component.injector.get('executionContext');

		var zoneInstruction = next.addZoneInstruction(
      zonePlan.name,
      zonePlan.strategy,
      componentUrl,
      component
      );

    var controller = component.executionContext;

  	if (controller.router) {
      controller.router.injector = component.injector;

  		var path = getWildcardPath(next.config.pattern, next.params, next.queryString);

      return controller.router.createNavigationInstruction(path, next).then((childInstruction) => {
        zonePlan.childNavigationContext = controller.router.createNavigationContext(childInstruction);

        return buildNavigationPlan(zonePlan.childNavigationContext).then((childPlan) => {
          zonePlan.childNavigationContext.plan = childPlan;
          zoneInstruction.childNavigationContext = zonePlan.childNavigationContext;
          return loadNewComponents(zonePlan.childNavigationContext);
        });
      });
  	}
  });
}

function resolveComponentInstance(router, zonePlan) {
  var zone = router.zones[zonePlan.name],
      injector = (zone && zone.injector) || router.injector._root,
      loader = injector.get(ComponentLoader);

  var url = zonePlan.config.componentUrl + '.html';

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
