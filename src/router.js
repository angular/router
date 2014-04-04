import Pipeline from './pipeline';
import history from './history';
import extend from './util';
import Activator from './activator';

function stripParametersFromRoute(route) {
  var colonIndex = route.indexOf(':');
  var length = colonIndex > 0 ? colonIndex - 1 : route.length;
  return route.substring(0, length);
}

function reconstructUrl(instruction) {
  if(!instruction.queryString) {
    return instruction.fragment;
  }

  return instruction.fragment + '?' + instruction.queryString;
}

function setTitle(value) {
  if (Router.appTitle) {
    document.title = value + " | " + Router.appTitle;
  } else {
    document.title = value;
  }
}

function areSameInputs(prev, next){
  var prevParams, nextParams;

  if(prev == next){
    return true;
  }

  if(!prev || !next){
    return false;
  }

  return JSON.stringify(prev.params) === JSON.stringify(next.params)
    && JSON.stringify(prev.queryParams) === JSON.stringify(next.queryParams);
}

export class Instruction{
  constructor(fragment, queryString, params, queryParams, config={}){
    this.fragment = fragment;
    this.queryString = queryString;
    this.params = params;
    this.queryParams = queryParams;
    this.config = config;
  }

  canActivate(){
    if('canActivate' in this.controller){
      return this.controller.canActivate.appy(this.controller, arguments);
    }
  }

  activate(){
    if('activate' in this.controller){
      return this.controller.activate.appy(this.controller, arguments);
    }
  }

  canDeactivate(){
    if('canDeactivate' in this.controller){
      return this.controller.canDeactivate.appy(this.controller, arguments);
    }
  }

  deactivate(){
    if('deactivate' in this.controller){
      return this.controller.deactivate.appy(this.controller, arguments);
    }
  }
}

export class Redirect {
  constructor(url){
    this.url = url;
  }
}

export class NavigationContext {
  constructor(router, nextInstruction){
      this.output = null;
      this.currentInstruction = router.activator.current;
      this.prevInstruction = router.activator.current;
      this.nextInstruction = nextInstruction;
      this.activator = router.activator;
      this.router = router;
      this.createActivator = router.createActivator.bind(router);
  }

  get hasChildRouter(){
    var controller = this.nextInstruction.controller;
    return controller && controller.router && controller.router.parent == this.router;
  }

  redirect(redirect){
    this.output = redirect;
    return this.cancel();
  }
}

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
        return context.next();
      }else if(result.output instanceof Redirect){
        return context.redirect(result.output);
      }else{
        return context.cancel();
      }
    });
  }
}

export class CompleteNavigation {
  run(context){
    this.setInstructionIsActive(context.currentInstruction, false);
    context.currentInstruction = context.nextInstruction;
    this.setInstructionIsActive(context.currentInstruction, true);
    return context.next();
  }

  setInstructionIsActive(instruction, isActive){
    if (instruction && instruction.config) {
      instruction.config.isActive = isActive;
    }
  }
}

export class DelegateToChildRouter{
  run(context){
    var instruction = context.nextInstruction,
        controller = instruction.controller;

    if(context.hasChildRouter){
      var fullFragment = instruction.fragment;//TODO: construct from wildcard segment

      if (instruction.queryString) {
          fullFragment += "?" + instruction.queryString;
      }

      return controller.router.loadUrl(fullFragment).then((result) =>{
        if(result.completed){
          return context.next();
        }

        return context.cancel();
      });
    }else{
      return context.next();
    }
  }
}

export class Router{
  constructor(parent:Router=null){
    this.parent = parent;
    this.activator = this.createActivator();
    this.reset();
  }

  static redirect(url){
    return new Redirect(url);
  }

  get navigationModel(){
    if(this._needsNavModelBuild){
      var nav = [], routes = this.routes;
      var fallbackOrder = 100;

      for (var i = 0, length = routes.length; i < length; i++) {
        var current = routes[i];

        if (current.nav) {
          if (typeof current.nav != 'number') {
            current.nav = ++fallbackOrder;
          }

          nav.push(current);
        }
      }

      nav.sort(function (a, b) { return a.nav - b.nav; });

      this._navigationModel = nav;
      this._needsNavModelBuild = false;
    }

    return this._navigationModel;
  }

  navigate(fragment, options) {
    if (fragment && fragment.indexOf('://') != -1) {
        window.location.href = fragment;
        return true;
    }

    return history.navigate(fragment, options);
  };

  navigateBack() {
    history.navigateBack();
  }

  loadUrl(url){
    var results = this.recognizer.recognize(url);

    if(results.length){
      var first = results[0];
      var fragment = url; //split query string...
      var queryString = url;

      if(typeof first.handler == 'function'){
        instruction.config = {};
        return first.handler(new Instruction(fragment, queryString, params, queryParams));
      }else{
        instruction.config = first.handler;
        return this.queueInstruction(new Instruction(fragment, queryString, params, queryParams, first.handler));
      }
    }else{
      //log('Route Not Found');
      //this.trigger('router:route:not-found', url, this);

      if (this.currentInstruction) {
        history.navigate(reconstructUrl(this.currentInstruction), { trigger: false, replace: true });
        return Promise.resolve();
      }
    }
  }

  generate(name, params){
    return this.recognizer.generate(name, params);
  }

  queueInstruction(instruction){
    return new Promise((resolve) =>{
      instruction.resolve = resolve;
      this.queue.unshift(instruction);
      this.dequeueInstruction();
    });
  }

  dequeueInstruction(){
    if(this.isNavigating){
      return;
    }

    var instruction = this.queue.shift();
    this.queue = [];

    if (!instruction) {
        return;
    }

    this.isNavigating = true;

    var context = this.createNavigationContext();
    var pipeline = this.createNavigationPipeline();

    pipeline.run(context).then((result) => {
      this.isNavigating = false;

      if(result.completed){
        if (!context.hasChildRouter) {
          this.updateDocumentTitle(context.currentInstruction);
        }
      }else if(result.output instanceof Redirect){
        this.navigate(result.output.url, { trigger: true, replace: true });
      }else if (context.currentInstruction) {
        this.navigate(reconstructUrl(context.prevInstruction), false);
      }
      
      instruction.resolve(result);
      this.dequeueInstruction();
    });
  }

  createNavigationContext(){
    return new NavigationContext(this, instruction);
  }

  createNavigationPipeline(){
    return new Pipeline()
      .withStep(new SelectController())
      .withStep(new SelectView())
      .withStep(new ActivateInstruction())
      .withStep(new CompleteNavigation())
      .withStep(new DelegateToChildRouter());
  }

  createActivator(){
    return new Activator({
      areSameItem(context){
        var prevController = context.prevItem.controller,
            nextController = context.nextItem.controller;

        if(prevController == nextController){
          return areSameInputs(context.prevInput, context.nextInput);
        }

        return false;
      },
      findChildActivator(context){
        var controller = context.prevItem.controller;
        if(!controller){
          return null;
        }

        var childRouter = controller.router;
        if(childRouter){
          return childRouter.activator;
        }

        return controller.activator;
      }
    });
  }

  updateDocumentTitle = function (instruction) {
    var title = instruction.config.title;

    //TODO: dispose previous watch

    if (title) {
      //TODO: setup new watch
      setTitle(title);
    } else if (Router.appTitle) {
      document.title = Router.appTitle;
    }
  };

  map(route, config) {
    if (Array.isArray(route)) {
        for (var i = 0; i < route.length; i++) {
            this.map(route[i]);
        }

        return this;
    }

    if (typeof route == string) {
        if (!config) {
            config = {};
        } else if (typeof config == 'string') {
            config = { moduleId: config };
        }

        config.route = route;
    } else {
        config = route;
    }

    return this.mapRoute(config);
  }

  mapRoute(config) {
    if (Array.isArray(config.route)) {
      var isActive = false;

      for (var i = 0, length = config.route.length; i < length; i++) {
          var current = extend({}, config);

          current.route = config.route[i];

          Object.defineProperty(current, 'isActive', {
              get: function() {
                  return isActive;
              },
              set: function(value) {
                  isActive = value;
              }
          });

          if (i > 0) {
              delete current.nav;
          }

          this.configureRoute(current);
      }
    } else {
      this.configureRoute(config);
    }

    return this;
  }

  configureRoute(config) {
    this._needsNavModelBuild = true;

    //this.trigger('router:route:before-config', config, this);

    config.name = config.name || this.deriveName(config);
    config.route = config.route || this.deriveRoute(config);
    config.title = config.title || this.deriveTitle(config);
    config.moduleId = config.moduleId || this.deriveModuleId(config);
    
    this.ensureHash(config);

    if(!('isActive' in config)) {
      config.isActive = false;
    }

    //this.trigger('router:route:after-config', config, this);

    this.routes.push(config);
    this.recognizer.add([{path:config.route, handler: config}]);
  }

  mapUnknownRoutes(config, replaceRoute){
    var catchAllRoute = "*path";

    var callback = (instruction) => {
      if (!config) {
        instruction.config.moduleId = instruction.fragment;
      } else if (typeof config == 'string') {
        instruction.config.moduleId = config;
        if (replaceRoute) {
          return history.navigate(replaceRoute, { trigger: false, replace: true });
        }
      } else if (typeof config == 'function') {
        var result = config(instruction);
        if (result && result.then) {
          return result.then(() => {
            //this.trigger('router:route:before-config', instruction.config, this);
            //this.trigger('router:route:after-config', instruction.config, this);
            return this.queueInstruction(instruction);
          });

          return;
        }
      } else {
        instruction.config = config;
        instruction.config.route = catchAllRoute;
      }

      //this.trigger('router:route:before-config', instruction.config, this);
      //this.trigger('router:route:after-config', instruction.config, this);
      return this.queueInstruction(instruction);
    };

    this.recognizer.add([{path:catchAllRoute, handler: callback}]);

    return this;
  }

  deriveName(config){
    return config.title || (config.route ? stripParametersFromRoute(config.route) : config.moduleId);
  }

  deriveRoute(config){
    return config.moduleId || config.name;
  }

  deriveTitle(config){
    var value = config.name;
    return value.substring(0, 1).toUpperCase() + value.substring(1);
  }

  deriveModuleId(config){
    return stripParametersFromRoute(config.route);
  }

  ensureLink(config){
    var that = this;

    if(config.link){
      return;
    }

    Object.defineProperty(config, 'link', {
      get:function(){
        if(that.parent && that.parent.activeInstruction){
          var instruction = that.parent.activeInstruction,
              link = instruction.config.link + '/' + config.route;

            if (history._hasPushState) {
                link = '/' + link;
            }

            link = link.replace('//', '/').replace('//', '/');
            return link;
        }

        if (history._hasPushState) {
            return config.route;
        }

        return "#" + config.route;
      }
    });
  }

  reset(clearController=true) {
    this.recognizer = new RouteRecognizer();
    this.routes = [];
    this.queue = [];
    this.isNavigating = false;

    delete this.options;

    if(clearController){
      this.activator.setCurrentAndBypassLifecycle(null);
    }
  };

  createChildRouter() {
    return new Router(this);
  };
}