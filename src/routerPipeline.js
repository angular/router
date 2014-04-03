
class SelectNextController {
	run(context){
		var currentInstruction = context.currentInstruction;
		var currentController = context.currentController;
		var nextInstruction = context.nextInstruction;

		if (this.canReuseCurrentController(context)) {
      context.activator = context.createActivator();
      context.activator.setCurrentAndBypassLifecycle(currentController);
      context.nextController = currentController;
      return context.next();
    } else {
      return this.resolveControllerInstance(nextInstruction.config.moduleId).then(function (controller) {
        context.nextController = controller;
        return context.next();
      }).catch(function (err) {
        //log('Failed to load routed module (' + instruction.config.moduleId + '). Details: ' + err.message);
        return context.cancel();
      });
    }
	}

	resolveControllerInstance(id){
		//TODO: load module, and use injector to get controller instance
	}

	canReuseCurrentController(context){
		var currentInstruction = context.currentInstruction;
		var nextInstruction = context.nextInstruction;
		var currentController = context.currentController;

		return currentInstruction
      && currentInstruction.config.moduleId == nextInstruction.config.moduleId
      && currentController
      && ((currentController.canReuseForRoute && currentController.canReuseForRoute(nextInstruction.params, nextInstruction.queryParams))
      	|| (!currentController.canReuseForRoute && currentController.router && currentController.router.loadUrl));
	}
}