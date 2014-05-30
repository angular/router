import {REPLACE, buildNavigationPlan} from './navigationPlan';
import {getWildcardPath} from './util';
import {Router} from './router';
import {Provide} from 'di';

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
			var zoneInstruction = next.addZoneInstruction(zoneName, zonePlan.prevModuleId, zonePlan.prevComponent);

      if(zonePlan.childNavigationContext){
        zoneInstruction.childNavigationContext = zonePlan.childNavigationContext;
      }
		}
	}

	return toLoad;
}

function loadComponent(navigationContext, zonePlan){
	var moduleId = zonePlan.config.moduleId;
	var next = navigationContext.nextInstruction;

	return resolveComponentInstance(navigationContext.router, zonePlan).then(function(component) {
		var zoneInstruction = next.addZoneInstruction(zonePlan.name, moduleId, component);

  	if(component.router){
  		var path = getWildcardPath(next.config.route, next.params, next.queryString);

      return component.router.createNavigationInstruction(path).then((childInstruction) =>{
        zonePlan.childNavigationContext = component.router.createNavigationContext(childInstruction);

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
          component = zone.createComponent(componentType, modules);

      resolve(component);
    }, reject);
  });
}

function getComponentTypeFromModule(moduleInstance) {
	for(var key in moduleInstance) {
    	return moduleInstance[key];
    }
}