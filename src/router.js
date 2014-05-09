import {Pipeline} from './pipeline';
import {history} from './history';
import {extend} from './util';
import {Activator} from './activator';
import {Injector, Provide, Inject} from 'di';

function ensureConfigValue(config, property, getter){
  var value = config[property];

  if(value || value == ''){
    return value;
  }

  return getter(config);
}

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

function targetIsThisWindow(target) {
  var targetWindow = target.getAttribute('target');

  if(!targetWindow ||
      targetWindow === window.name ||
      targetWindow === '_self' ||
      (targetWindow === 'top' && window === window.top)) {
      return true;
  }

  return false;
}

function getWildcardPath(route, params){
  var wildcardIndex = route.lastIndexOf('*'),
      wildcardName = route.substr(wildcardIndex + 1),
      path = params[wildcardName];

  return path;
}

export class Instruction{
  constructor(fragment, queryString, params, queryParams, config={}){
    this.fragment = fragment;
    this.queryString = queryString;
    this.params = params;
    this.queryParams = queryParams;
    this.config = config;
    this.activationInput = [params, queryParams, config];
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
    this.injector = router.injector;
    this.createActivator = router.createActivator.bind(router);
  }

  get hasChildRouter(){
    var controller = this.nextInstruction.controller;
    return controller && controller.router && controller.router.parent == this.router;
  }

  redirect(redirect){
    this.output = typeof redirect == 'string' ? new Redirect(redirect) : redirect;
    return this.cancel();
  }
}

export class SelectController {
  run(context){
    var currentInstruction = context.currentInstruction,
        nextInstruction = context.nextInstruction;

    if('controller' in nextInstruction){
      return context.next();
    }

    if (this.canReuseCurrentController(currentInstruction, nextInstruction)) {
      context.activator = context.createActivator();
      context.activator.setCurrentAndBypassLifecycle(currentInstruction);
      context.nextInstruction = currentInstruction;
      return context.next();
    } else {
      var moduleId = this.determineModuleId(nextInstruction);

      return this.resolveControllerInstance(context, moduleId).then(function (controller) {
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

  resolveControllerInstance(context, moduleId){
    return new Promise((resolve, reject) => {
      require([moduleId], (moduleInstance) => {

        @Provide(ChildRouter)
        function childRouterProvider() {
          return context.router.createChild();
        }

        var modules = [moduleInstance, childRouterProvider];
        var controllerInjector = context.injector.createChild(modules);
        var controllerType = this.getControllerTypeFromModule(moduleInstance);
        var controller = controllerInjector.get(controllerType);
        
        resolve(controller);
      }, reject);
    });
  }

  getControllerTypeFromModule(moduleInstance){
    for(var key in moduleInstance){
      return moduleInstance[key];
    }
  }

  canReuseCurrentController(currentInstruction, nextInstruction){
    var currentController;

    return currentInstruction
      && currentInstruction.config.moduleId == nextInstruction.config.moduleId
      && (currentController = currentInstruction.controller)
      && ((currentController.canReuseForRoute && currentController.canReuseForRoute.apply(currentController, nextInstruction.activationInput))
        || (!currentController.canReuseForRoute && currentController.router && currentController.router.loadUrl));
  }
}

export class SelectView{
  run(context){
    var nextInstruction = context.nextInstruction;

    if('template' in nextInstruction){
      return context.next();
    }

    var templateId = this.determineTemplateId(nextInstruction);

    return this.resolveTemplate(templateId).then((template) =>{
      nextInstruction.template = template;
      return context.next();
    }).catch(function (err) {
      //log('Failed to load routed module (' + instruction.config.moduleId + '). Details: ' + err.message);
      return context.cancel();
    });
  }

  determineTemplateId(nextInstruction){
    //TODO: look for the component annotation first
    return nextInstruction.config.templateId || nextInstruction.config.moduleId + '.html';
  }

  resolveTemplate(templateId){
    return new Promise((resolve, reject) => {
      require([templateId], (viewModule) => {
        viewModule.promise.then((templateAndModules) => {
          resolve(templateAndModules.template);
        }).catch(reject);
      }, reject);
    });
  }
}

export class ActivateInstruction {
  run(context){
    var nextInstruction = context.nextInstruction;
    //trigger('router:route:activating', instance, instruction, router);

    return context.activator.activate(nextInstruction, nextInstruction.activationInput).then((result) => {
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
      var path = getWildcardPath(instruction.config.route, instruction.params);

      if (instruction.queryString) {
        path += "?" + instruction.queryString;
      }

      return controller.router.loadUrl(path).then((result) =>{
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
  constructor(){
    this.activator = this.createActivator();
    this.reset();
  }

  static redirect(url){
    return new Redirect(url);
  }

  addToNavigation(current){
    if (current.nav) {
      if (typeof current.nav != 'number') {
        current.nav = ++this.fallbackOrder;
      }

      this.navigation.push(current);
      this.navigation = this.navigation.sort(function (a, b) { return a.nav - b.nav; });
    }
  }

  connect(routerPort){
    this._port = routerPort;

    this.injector = routerPort.injector;
    this.activator.onCurrentChanged = routerPort.followInstruction.bind(routerPort);

    if(!this.isActive && 'activate' in this){
      this.activate();
    }else{
      this.dequeueInstruction();
    }   
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

  createChild(){
    var childRouter = new ChildRouter();
    child.parent = this;
    child.title = this.title;
    return childRouter;
  }

  loadUrl(url){
    var results = this.recognizer.recognize(url);

    if(results && results.length){
      var first = results[0],
          fragment = url,
          queryIndex = fragment.indexOf('?'),
          queryString;

      if (queryIndex != -1) {
        fragment = url.substring(0, queryIndex);
        queryString = url.substr(queryIndex + 1);
      }

      if(typeof first.handler == 'function'){
        return first.handler(new Instruction(fragment, queryString, first.params, first.queryParams));
      }else{
        return this.queueInstruction(new Instruction(fragment, queryString, first.params, first.queryParams, first.handler));
      }
    }else{
      //log('Route Not Found');
      //trigger('router:route:not-found', url, this);

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
    if(this.isNavigating || !this._port){
      return;
    }

    var instruction = this.queue.shift();
    this.queue = [];

    if (!instruction) {
        return;
    }

    this.isNavigating = true;

    var context = this.createNavigationContext(instruction);
    var pipeline = this.createNavigationPipeline();

    pipeline.run(context).then((result) => {
      this.isNavigating = false;

      if(result.completed){
        if (!context.hasChildRouter) {
          this.updateDocumentTitle(context.currentInstruction);
        }
      }else if(result.output instanceof Redirect){
        this.navigate(result.output.url, { trigger: true, replace: true });
      }else if (context.prevInstruction) {
        this.navigate(reconstructUrl(context.prevInstruction), false);
      }
      
      instruction.resolve(result);
      this.dequeueInstruction();
    });
  }

  createNavigationContext(instruction){
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
        var prev = context.prevItem,
            next = context.nextItem;

        if((!prev && next) || (prev && !next)){
          return false;
        }

        var prevController = prev.controller,
            nextController = next.controller;

        if(prevController == nextController){
          return areSameInputs(context.prevInput, context.nextInput);
        }

        return false;
      },
      findChildActivator(context){
        if(!context.prevItem){
          return null;
        }

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

  updateDocumentTitle(instruction) {
    var title = instruction.config.title;

    //TODO: dispose previous title watch

    if (title) {
      //TODO: setup new title watch
      if (this.title) {
        document.title = title + " | " + this.title;
      } else {
        document.title = title;
      }
    } else if (this.title) {
      document.title = this.title;
    }
  };

  map(route, config) {
    if (Array.isArray(route)) {
        for (var i = 0; i < route.length; i++) {
            this.map(route[i]);
        }

        return this;
    }

    if (typeof route == 'string') {
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

    //trigger('router:route:before-config', config, this);

    this.ensureDefaultsForRouteConfig(config);

    //trigger('router:route:after-config', config, this);

    this.routes.push(config);
    this.recognizer.add([{path:config.route, handler: config}]);
    this.addToNavigation(config);
  }

  ensureDefaultsForRouteConfig(config){
    config.name =  ensureConfigValue(config, 'name', this.deriveName);
    config.route = ensureConfigValue(config, 'route', this.deriveRoute);
    config.title = ensureConfigValue(config, 'title', this.deriveTitle);
    config.moduleId = ensureConfigValue(config, 'moduleId', this.deriveModuleId);
    
    this.ensureHREF(config);

    if(!('isActive' in config)) {
      config.isActive = false;
    }
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
            //trigger('router:route:before-config', instruction.config, this);
            //trigger('router:route:after-config', instruction.config, this);
            return this.queueInstruction(instruction);
          });

          return;
        }
      } else {
        instruction.config = config;
        instruction.config.route = catchAllRoute;
      }

      //trigger('router:route:before-config', instruction.config, this);
      //trigger('router:route:after-config', instruction.config, this);
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

  ensureHREF(config){
    var that = this;

    if(config.href){
      return;
    }

    //TODO: consider re-writing this to update manually on route changes so we don't need a getter
    Object.defineProperty(config, 'href', {
      get:function(){
        var href = config.route; //TODO: strip * at end

        if(that.parent && that.parent.activator.current){
          var instruction = that.parent.activator.current,
              path = getWildcardPath(instruction.config.route, instruction.params),
              fragment = fragment.slice(0, -path.length);

          href = fragment + '/' + href;

          if (instruction.queryString) {
            href += "?" + instruction.queryString;
          }

          if (history._hasPushState) {
            href = '/' + href;
          }
        } else if(!history._hasPushState) {
          href = '#' + href;
        }

        return href;
      }
    });
  }

  reset(clearController=true) {
    this.recognizer = new RouteRecognizer();
    this.routes = [];
    this.queue = [];
    this.isNavigating = false;
    this.fallbackOrder = 100;
    this.navigation = [];

    delete this.options;

    if(clearController){
      this.activator.setCurrentAndBypassLifecycle(null);
    }
  };
}

export class ChildRouter extends Router {
  constructor(){
    super();
  }
}

export class RootRouter extends Router {
  constructor(){
    super();
    document.addEventListener('click', this.handleLinkClick.bind(this), true);
  }

  handleLinkClick(evt) {
    if(!this.isActive){
      return;
    }

    var target = evt.target;
    if(target.tagName != 'A') {
      return;
    }

    if(history._hasPushState) {
      if(!evt.altKey && !evt.ctrlKey && !evt.metaKey && !evt.shiftKey && targetIsThisWindow(target)) {
        var href = target.getAttribute('href');

        // Ensure the protocol is not part of URL, meaning its relative.
        // Stop the event bubbling to ensure the link will not cause a page refresh.
        if(href != null && !(href.charAt(0) === "#" || /^[a-z]+:/i.test(href))) {
          evt.preventDefault();
          history.navigate(href);
        }
      }
    }
  }

  activate(options) {
    if(this.isActive){
      return;
    }

    this.isActive = true;
    this.options = extend({ routeHandler: this.loadUrl.bind(this) }, this.options, options);
    history.activate(this.options);
    this.dequeueInstruction();
  }

  deactivate() {
    this.isActive = false;
    history.deactivate();
  }
}