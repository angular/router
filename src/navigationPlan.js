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

    for (var viewPortName in prev.viewPortInstructions) {
      var prevViewPortInstruction = prev.viewPortInstructions[viewPortName];
      var nextViewPortConfig = next.config.viewPorts[viewPortName];
      var viewPortPlan = plan[viewPortName] = {
        name: viewPortName,
        config: nextViewPortConfig,
        prevComponent: prevViewPortInstruction.component,
        prevComponentUrl: prevViewPortInstruction.componentUrl
      };

      if (prevViewPortInstruction.componentUrl != nextViewPortConfig.componentUrl) {
        viewPortPlan.strategy = REPLACE;
      } else if ('determineActivationStrategy' in prevViewPortInstruction.component.executionContext) {
         //TODO: should we tell them if the parent had a lifecycle min change?
        viewPortPlan.strategy = prevViewPortInstruction.component.executionContext.determineActivationStrategy(...next.lifecycleArgs);
      } else if (newParams || forceLifecycleMinimum) {
        viewPortPlan.strategy = INVOKE_LIFECYCLE;
      } else {
        viewPortPlan.strategy = NO_CHANGE;
      }

      if (viewPortPlan.strategy !== REPLACE && prevViewPortInstruction.childRouter) {
        var path = getWildcardPath(next.config.pattern, next.params, next.queryString);
        var task = prevViewPortInstruction.childRouter.createNavigationInstruction(path, next).then((childInstruction) => {
          viewPortPlan.childNavigationContext = prevViewPortInstruction.childRouter.createNavigationContext(childInstruction);

          return buildNavigationPlan(viewPortPlan.childNavigationContext, viewPortPlan.strategy == INVOKE_LIFECYCLE).then((childPlan) => {
            viewPortPlan.childNavigationContext.plan = childPlan;
          });
        });

        pending.push(task);
      }
    }

    return Promise.all(pending).then(() => {
      return plan;
    });
  }else{
    for (var viewPortName in next.config.viewPorts) {
      plan[viewPortName] = {
        name: viewPortName,
        strategy: REPLACE,
        config: next.config.viewPorts[viewPortName]
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
