import {getWildcardPath, getWildCardName} from './util';

export var NO_CHANGE = 'no-change';
export var INVOKE_LIFECYCLE = 'invoke-lifecycle';
export var REPLACE = 'replace';

export function buildNavigationPlan(navigationContext, forceLifecycleMinimum) {
  var prev = navigationContext.prevInstruction;
  var next = navigationContext.nextInstruction;
  var plan = {};

  if (prev) {
    var newParams = hasDifferentParameterValues(prev, next);
    var pending = [];

    for (var zoneName in prev.zoneInstructions) {
      var prevZoneInstruction = prev.zoneInstructions[zoneName];
      var nextZoneConfig = next.config.zones[zoneName];
      var zonePlan = plan[zoneName] = {
        name: zoneName,
        config: nextZoneConfig,
        prevComponent: prevZoneInstruction.component,
        prevComponentUrl: prevZoneInstruction.componentUrl
      };

      if (prevZoneInstruction.componentUrl != nextZoneConfig.componentUrl) {
        zonePlan.strategy = REPLACE;
      } else if ('determineActivationStrategy' in prevZoneInstruction.component.executionContext) {
        zonePlan.strategy = prevZoneInstruction.component.executionContext.determineActivationStrategy(...next.lifecycleArgs); //TODO: should we tell them if the parent had a lifecycle min change?
      } else if (newParams || forceLifecycleMinimum) {
        zonePlan.strategy = INVOKE_LIFECYCLE;
      } else {
        zonePlan.strategy = NO_CHANGE;
      }

      if (zonePlan.strategy !== REPLACE && prevZoneInstruction.childRouter) {
        var path = getWildcardPath(next.config.pattern, next.params, next.queryString);
        var task = prevZoneInstruction.childRouter.createNavigationInstruction(path, next).then((childInstruction) => {
          zonePlan.childNavigationContext = prevZoneInstruction.childRouter.createNavigationContext(childInstruction);

          return buildNavigationPlan(zonePlan.childNavigationContext, zonePlan.strategy == INVOKE_LIFECYCLE).then((childPlan) => {
            zonePlan.childNavigationContext.plan = childPlan;
          });
        });

        pending.push(task);
      }
    }

    return Promise.all(pending).then(() => {
      return plan;
    });
  }else{
    for (var zoneName in next.config.zones) {
      plan[zoneName] = {
        name:zoneName,
        strategy:REPLACE,
        config:next.config.zones[zoneName]
      };
    }

    return Promise.resolve(plan);
  }
}

export class BuildNavigationPlanStep {
	run(navigationContext, next) {
    return buildNavigationPlan(navigationContext).then((plan) => {
      navigationContext.plan = plan;
      return next();
    });
	}
}

function hasDifferentParameterValues(prev, next) {
  var prevParams = prev.params,
      nextParams = next.params,
      nextWildCardName = next.config.hasChildRouter ? getWildCardName(next.config.pattern) : null;

  for (var key in nextParams) {
    if (key == nextWildCardName) {
      continue;
    }

    if (prevParams[key] != nextParams[key]) {
      return true;
    }
  }

  return false;
}
