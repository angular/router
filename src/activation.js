import {INVOKE_LIFECYCLE, REPLACE} from './navigationPlan';
import {Redirect} from './redirect';

export var affirmations = ['yes', 'ok', 'true'];

export class CanDeactivatePreviousStep {
	run(navigationContext, next){
		return processDeactivatableControllers(navigationContext.plan, 'canDeactivate', next);
	}
}

export class CanActivateNextStep {
	run(navigationContext, next){
		return processActivatableZones(navigationContext, 'canActivate', next);
	}
}

export class DeactivatePreviousStep {
	run(navigationContext, next){
		return processDeactivatableControllers(navigationContext.plan, 'deactivate', next, true);
	}
}

export class ActivateNextStep {
	run(navigationContext, next){
		return processActivatableZones(navigationContext, 'activate', next, true);
	}
}

function processDeactivatableControllers(plan, callbackName, next, ignoreResult){
	var controllers = findDeactivatableControllers(plan, callbackName),
      i = controllers.length; //query from inside out

	function inspect(val){
    if(ignoreResult || shouldContinue(val)){
      return iterate();
    } else{
			return next.cancel(val);
		}
	}

	function iterate(){
		if(i--){
			var controller = controllers[i];
			var boolOrPromise = controller[callbackName]();

			if(boolOrPromise instanceof Promise){
				return boolOrPromise.then(inspect);
			}else{
				return inspect(boolOrPromise);
			}
		}else{
			return next();
		}
	}

	return iterate();
}

function findDeactivatableControllers(plan, callbackName, list){
	list = list || [];

	for(var zoneName in plan){
		var zonePlan = plan[zoneName];

		if((zonePlan.strategy == INVOKE_LIFECYCLE 
			|| zonePlan.strategy == REPLACE) && zonePlan.prevComponent){
			var controller = zonePlan.prevComponent.executionContext;

			if(callbackName in controller){
				list.push(controller);
			}

			if(plan.childNavigationContext){
				findDeactivatableControllers(plan.childNavigationContext.plan, callbackName, list);
			}
		}
	}

	return list;
}

function processActivatableZones(navigationContext, callbackName, next, ignoreResult){
	var zones = findActivatableZones(navigationContext, callbackName),
      length = zones.length,
      i = -1; //query from top down

	function inspect(val){
    if(ignoreResult || shouldContinue(val)){
      return iterate();
    } else{
      return next.cancel(val);
    }
  }

	function iterate(){
		i++;

		if(i < length){
			var zoneInstruction = zones[i];
			var boolOrPromise = zoneInstruction.component.executionContext[callbackName](...zoneInstruction.lifecycleArgs);

			if(boolOrPromise instanceof Promise){
				return boolOrPromise.then(inspect);
			}else{
				return inspect(boolOrPromise);
			}
		}else{
			return next();
		}
	}

	return iterate();
}

function findActivatableZones(navigationContext, callbackName, list){
	var plan = navigationContext.plan;
	var next = navigationContext.nextInstruction;

	list = list || [];

	for(var zoneName in plan){
		var zonePlan = plan[zoneName];
		var zoneInstruction = next.zoneInstructions[zoneName];

		if(zonePlan.strategy == INVOKE_LIFECYCLE || zonePlan.strategy == REPLACE){
			if(callbackName in zoneInstruction.component.executionContext){
				list.push(zoneInstruction);
			}

			if(plan.childNavigationContext){
				findActivatableZones(plan.childNavigationContext, callbackName, list);
			}
		}
	}

	return list;
}

function shouldContinue(output) {
  if (output instanceof Error) {
    return false;
  }

  if (output instanceof Redirect) {
    return false;
  }

  if (typeof output == 'string') {
    return affirmations.indexOf(value.toLowerCase()) !== -1;
  }

  if (typeof output == 'undefined') {
    return true;
  }

  return output;
}