import {INVOKE_LIFECYCLE, REPLACE} from './navigationPlan';
import {Redirect} from './redirect';

export var affirmations = ['yes', 'ok', 'true'];

export class CanDeactivatePreviousStep {
  run(navigationContext, next) {
    return processDeactivatableControllers(navigationContext.plan, 'canDeactivate', next);
  }
}

export class CanActivateNextStep {
  run(navigationContext, next) {
    return processActivatableViewPorts(navigationContext, 'canActivate', next);
  }
}

export class DeactivatePreviousStep {
  run(navigationContext, next) {
    return processDeactivatableControllers(navigationContext.plan, 'deactivate', next, true);
  }
}

export class ActivateNextStep {
  run(navigationContext, next) {
    return processActivatableViewPorts(navigationContext, 'activate', next, true);
  }
}

function processDeactivatableControllers(plan, callbackName, next, ignoreResult) {
  var controllers = findDeactivatableControllers(plan, callbackName),
      i = controllers.length; //query from inside out

  function inspect(val) {
    if (ignoreResult || shouldContinue(val)) {
      return iterate();
    } else {
      return next.cancel(val);
    }
  }

  function iterate() {
    if (i--) {
      var controller = controllers[i];
      var boolOrPromise = controller[callbackName]();

      if (boolOrPromise instanceof Promise) {
        return boolOrPromise.then(inspect);
      } else {
        return inspect(boolOrPromise);
      }
    } else {
      return next();
    }
  }

  return iterate();
}

function findDeactivatableControllers(plan, callbackName, list) {
  list = list || [];

  for (var viewPortName in plan) {
    var viewPortPlan = plan[viewPortName];
    var prevComponent = viewPortPlan.prevComponent;

    if ((viewPortPlan.strategy == INVOKE_LIFECYCLE ||
        viewPortPlan.strategy == REPLACE) &&
        prevComponent) {

      var controller = prevComponent.executionContext;

      if (callbackName in controller) {
        list.push(controller);
      }
    }

    if (viewPortPlan.childNavigationContext) {
      findDeactivatableControllers(viewPortPlan.childNavigationContext.plan, callbackName, list);
    } else if (prevComponent) {
      addPreviousDeactivatableControllers(prevComponent, callbackName, list);
    }
  }

  return list;
}

function addPreviousDeactivatableControllers(component, callbackName, list) {
  var controller = component.executionContext;

  if (controller.router && controller.router.currentInstruction) {
    var viewPortInstructions = controller.router.currentInstruction.viewPortInstructions;

    for (var viewPortName in viewPortInstructions) {
      var viewPortInstruction = viewPortInstructions[viewPortName];
      var prevComponent = viewPortInstruction.component;
      var prevController = prevComponent.executionContext;

      if (callbackName in prevController) {
        list.push(prevController);
      }

      addPreviousDeactivatableControllers(prevComponent, callbackName, list)
    }
  }
}

function processActivatableViewPorts(navigationContext, callbackName, next, ignoreResult) {
  var viewPorts = findActivatableViewPorts(navigationContext, callbackName),
      length = viewPorts.length,
      i = -1; //query from top down

  function inspect(val) {
    if (ignoreResult || shouldContinue(val)) {
      return iterate();
    } else {
      return next.cancel(val);
    }
  }

  function iterate() {
    i++;

    if (i < length) {
      var viewPortInstruction = viewPorts[i];
      var boolOrPromise = viewPortInstruction.component.executionContext[callbackName](...viewPortInstruction.lifecycleArgs);

      if (boolOrPromise instanceof Promise) {
        return boolOrPromise.then(inspect);
      } else {
        return inspect(boolOrPromise);
      }
    } else {
      return next();
    }
  }

  return iterate();
}

function findActivatableViewPorts(navigationContext, callbackName, list) {
  var plan = navigationContext.plan;
  var next = navigationContext.nextInstruction;

  list = list || [];

  Object.keys(plan).filter(viewPortName => {
    var viewPortPlan = plan[viewPortName];
    var viewPortInstruction = next.viewPortInstructions[viewPortName];

    if ((viewPortPlan.strategy === INVOKE_LIFECYCLE || viewPortPlan.strategy === REPLACE) &&
        callbackName in viewPortInstruction.component.executionContext) {
      list.push(viewPortInstruction);
    }

    if (viewPortPlan.childNavigationContext) {
      findActivatableViewPorts(viewPortPlan.childNavigationContext, callbackName, list);
    }
  });

  return list;
}

function shouldContinue(output) {
  if (output instanceof Error || output instanceof Redirect) {
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
