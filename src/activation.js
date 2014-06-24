import {INVOKE_LIFECYCLE, REPLACE} from './navigationPlan';
import {isNavigationCommand} from './navigationCommand';

export var affirmations = ['yes', 'ok', 'true'];

export class CanDeactivatePreviousStep {
  run(navigationContext, next) {
    return processDeactivatable(navigationContext.plan, 'canDeactivate', next);
  }
}

export class CanActivateNextStep {
  run(navigationContext, next) {
    return processActivatable(navigationContext, 'canActivate', next);
  }
}

export class DeactivatePreviousStep {
  run(navigationContext, next) {
    return processDeactivatable(navigationContext.plan, 'deactivate', next, true);
  }
}

export class ActivateNextStep {
  run(navigationContext, next) {
    return processActivatable(navigationContext, 'activate', next, true);
  }
}

function processDeactivatable(plan, callbackName, next, ignoreResult) {
  var infos = findDeactivatable(plan, callbackName),
      i = infos.length; //query from inside out

  function inspect(val) {
    if (ignoreResult || shouldContinue(val)) {
      return iterate();
    } else {
      return next.cancel(val);
    }
  }

  function iterate() {
    if (i--) {
      var controller = infos[i];
      var result = controller[callbackName]();
      return processResult(result, inspect);
    } else {
      return next();
    }
  }

  return iterate();
}

function findDeactivatable(plan, callbackName, list) {
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
      findDeactivatable(viewPortPlan.childNavigationContext.plan, callbackName, list);
    } else if (prevComponent) {
      addPreviousDeactivatable(prevComponent, callbackName, list);
    }
  }

  return list;
}

function addPreviousDeactivatable(component, callbackName, list) {
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

      addPreviousDeactivatable(prevComponent, callbackName, list)
    }
  }
}

function processActivatable(navigationContext, callbackName, next, ignoreResult) {
  var infos = findActivatable(navigationContext, callbackName),
      length = infos.length,
      i = -1; //query from top down

  function inspect(val, router) {
    if (ignoreResult || shouldContinue(val, router)) {
      return iterate();
    } else {
      return next.cancel(val);
    }
  }

  function iterate() {
    i++;

    if (i < length) {
      var current = infos[i];
      var result = current.controller[callbackName](...current.lifecycleArgs);
      return processResult(result, val => inspect(val, current.router));
    } else {
      return next();
    }
  }

  return iterate();
}

function findActivatable(navigationContext, callbackName, list, router) {
  var plan = navigationContext.plan;
  var next = navigationContext.nextInstruction;

  list = list || [];

  Object.keys(plan).filter(viewPortName => {
    var viewPortPlan = plan[viewPortName];
    var viewPortInstruction = next.viewPortInstructions[viewPortName];
    var controller = viewPortInstruction.component.executionContext;

    if ((viewPortPlan.strategy === INVOKE_LIFECYCLE || viewPortPlan.strategy === REPLACE) 
      && callbackName in controller) {
      list.push({
        controller:controller,
        lifecycleArgs:viewPortInstruction.lifecycleArgs,
        router:router
      });
    }

    if (viewPortPlan.childNavigationContext) {
      findActivatable(
        viewPortPlan.childNavigationContext, 
        callbackName, 
        list, 
        controller.router || router
      );
    }
  });

  return list;
}

function processResult(obj, callback){
  if(obj instanceof Promise || (obj && typeof obj.then === 'function')){
    return obj.then(callback);
  }else{
    return callback(obj);
  }
}

function shouldContinue(output, router) {
  if (output instanceof Error) {
    return false;
  }

  if(isNavigationCommand(output)){
    output.router = router;
    return !!output.shouldContinueProcessing;
  }

  if (typeof output == 'string') {
    return affirmations.indexOf(value.toLowerCase()) !== -1;
  }

  if (typeof output == 'undefined') {
    return true;
  }

  return output;
}