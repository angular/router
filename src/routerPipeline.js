
export class SelectController {
	run(context){
		var currentInstruction = context.currentInstruction,
				nextInstruction = context.nextInstruction;

		if (this.canReuseCurrentController(currentInstruction, nextInstruction)) {
      context.activator = context.createActivator();
      context.activator.setCurrentAndBypassLifecycle(currentInstruction);
      context.nextInstruction = currentInstruction;
      return context.next();
    } else {
    	var moduleId = this.determineModuleId(nextInstruction);

      return this.resolveControllerInstance(moduleId).then(function (controller) {
        context.nextInstruction.controller = controller;
        return context.next();
      }).catch(function (err) {
        //log('Failed to load routed module (' + instruction.config.moduleId + '). Details: ' + err.message);
        return context.cancel();
      });
    }
	}

	determineModuleId(nextInstruction){
		return nextInstruction.config.moduleId;
	}

	resolveControllerInstance(nextInstruction){
		//TODO: load module, and use injector to get controller instance
	}

	canReuseCurrentController(currentInstruction, nextInstruction){
		var currentController = currentInstruction.controller;

		return currentInstruction
      && currentInstruction.config.moduleId == nextInstruction.config.moduleId
      && currentController
      && ((currentController.canReuseForRoute && currentController.canReuseForRoute(nextInstruction.params, nextInstruction.queryParams))
      	|| (!currentController.canReuseForRoute && currentController.router && currentController.router.loadUrl));
	}
}

export class SelectView{
	run(context){
		var nextInstruction = context.nextInstruction;

		if('viewFactory' in nextInstruction){
			return context.next();
		}

		var viewId = this.determineViewId(nextInstruction);

		return this.resolveViewFactory(viewId).then((viewFactory) => {
			nextInstruction.viewFactory = viewFactory;
			return context.next();
		}).catch(function (err) {
      //log('Failed to load routed module (' + instruction.config.moduleId + '). Details: ' + err.message);
      return context.cancel();
    });
	}

	determineViewId(nextInstruction){
		return nextInstruction.config.viewId || nextInstruction.config.moduleId + '.html'; //TODO: apply proper plugin to path
	}

	resolveViewFactory(id){
		//TODO: load and compile view factory
	}
}

export class ActivateInstruction {
	run(context){
		var input = [
			context.nextInstruction.params, 
			context.nextInstruction.queryParams,
			context.nextInstruction.config
		];

		//trigger('router:route:activating', instance, instruction, router);

		return context.activator.activate(context.nextInstruction, input).then((result) => {
			if(result.completed){

			}else{

			}
		});
	}
}