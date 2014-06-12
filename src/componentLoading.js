import {REPLACE, buildNavigationPlan} from './navigationPlan';
import {getWildcardPath} from './util';
import {Router} from './router';
import {Provide} from 'di';
import {ViewFactory} from 'templating';

export class LoadNewComponentsStep{
	run(navigationContext, next){
		return loadNewComponents(navigationContext)
			.then(next)
			.catch(next.cancel);
	}
}

export function loadNewComponents(navigationContext){
	var toLoad = determineWhatToLoad(navigationContext);
	var loadPromises = [];

	for(var i = 0, len = toLoad.length; i < len; i++){
		var current = toLoad[i];
		loadPromises.push(loadComponent(current.navigationContext, current.zonePlan));
	}

	return Promise.all(loadPromises);
}

function determineWhatToLoad(navigationContext, toLoad){
	var plan = navigationContext.plan;
	var next = navigationContext.nextInstruction;

	toLoad = toLoad || [];

	for(var zoneName in plan){
		var zonePlan = plan[zoneName];

		if(zonePlan.strategy == REPLACE){
			toLoad.push({
				zonePlan:zonePlan,
				navigationContext:navigationContext
			});

			if(zonePlan.childNavigationContext){
				determineWhatToLoad(zonePlan.childNavigationContext, toLoad);
			}
		}else{
			var zoneInstruction = next.addZoneInstruction(
          zoneName, 
          zonePlan.strategy,
          zonePlan.prevModuleId, 
          zonePlan.prevComponent
          );

      if(zonePlan.childNavigationContext){
        zoneInstruction.childNavigationContext = zonePlan.childNavigationContext;
        determineWhatToLoad(zonePlan.childNavigationContext, toLoad);
      }
		}
	}

	return toLoad;
}

function loadComponent(navigationContext, zonePlan){
	var moduleId = zonePlan.config.moduleId;
	var next = navigationContext.nextInstruction;

	return resolveComponentInstance(navigationContext.router, zonePlan).then(function(component) {
		var zoneInstruction = next.addZoneInstruction(
      zonePlan.name, 
      zonePlan.strategy,
      moduleId, 
      component
      );

    var controller = component.executionContext;

  	if(controller.router){
      controller.router.injector = component.injector;

  		var path = getWildcardPath(next.config.route, next.params, next.queryString);

      return controller.router.createNavigationInstruction(path).then((childInstruction) =>{
        zonePlan.childNavigationContext = controller.router.createNavigationContext(childInstruction);

        return buildNavigationPlan(zonePlan.childNavigationContext).then((childPlan) =>{
          zonePlan.childNavigationContext.plan = childPlan;
          zoneInstruction.childNavigationContext = zonePlan.childNavigationContext;
          return loadNewComponents(zonePlan.childNavigationContext);
        });
      });
  	}
  });
}

function resolveComponentInstance(router, zonePlan){
	return new Promise((resolve, reject) => {
    require([zonePlan.config.moduleId], (moduleInstance) => {

      @Provide(Router)
      function childRouterProvider() {
        return router.createChild();
      }

      var modules = [moduleInstance, childRouterProvider],
          componentType = getComponentTypeFromModule(moduleInstance),
          zone = router.zones[zonePlan.name],
          component = createComponent((zone && zone.injector) || router.injector, componentType, modules);

      resolve(component);
    }, reject);
  });
}

function createComponent(injector, componentType, modules){
  var viewFactory = injector.get(ViewFactory);
  var componentInjector = injector.createChild(modules);

  return viewFactory.createComponentView({
    component: componentType,
    parentInjector: componentInjector
  });
}

function getComponentTypeFromModule(moduleInstance) {
	for(var key in moduleInstance) {
    	return moduleInstance[key];
    }
}