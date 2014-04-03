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

export class Router{
  constructor(parent:Router=null){
    this.parent = parent;
    this.reset();
  }

  get isNavigating(){
    return false;
  }

  get navigationModel(){
    if(this._needsNavModelBuild){
      var nav = [], routes = this.routes;
      var fallbackOrder = 100;

      for (var i = 0; i < routes.length; i++) {
          var current = routes[i];

          if (current.nav) {
              if (!(typeof current.nav == 'number')) {
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
        first.handler(new Instruction(fragment, queryString, params, queryParams));
      }else{
        instruction.config = first.handler;
        this.queueInstruction(new Instruction(fragment, queryString, params, queryParams, first.handler));
      }
    }else{
      //log('Route Not Found');
      //this.trigger('router:route:not-found', url, this);

      if (this.currentInstruction) {
        history.navigate(reconstructUrl(this.currentInstruction), { trigger: false, replace: true });
      }
    }
  }

  generate(name, params){
    return this.recognizer.generate(name, params);
  }

  queueInstruction(instruction){
    this.queue.unshift(instruction);
    this.dequeueInstruction();
  }

  dequeueInstruction(){
    if(this.isProcessing){
      return;
    }

    var instruction = this.queue.shift();
    this.queue = [];

    if (!instruction) {
        return;
    }

    this.isProcessing = true;

    var context = { 
      operation:'navigate',
      output: null,
      currentInstruction:this.currentInstruction, 
      prevInstruction:this.currentInstruction, 
      nextInstruction:instruction,
      activator: this.activator,
      router:this,
      createActivator:this.createActivator
    };

    this.createPipeline().run(context).then((result) => {
      //check result and do different things?

      this.isProcessing = false;
      this.dequeueInstruction();
    });
  }

  createActivator(){
    var activator = new Activator();

    //TODO: configure

    return activator;
  }

  createPipeline(){
    var pipeline = new Pipeline();

    //TODO: configure

    return pipeline;
  }

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
          history.navigate(replaceRoute, { trigger: false, replace: true });
        }
      } else if (typeof config == 'function') {
        var result = config(instruction);
        if (result && result.then) {
          result.then(() => {
            //this.trigger('router:route:before-config', instruction.config, this);
            //this.trigger('router:route:after-config', instruction.config, this);
            this.queueInstruction(instruction);
          });

          return;
        }
      } else {
        instruction.config = config;
        instruction.config.route = catchAllRoute;
      }

      //this.trigger('router:route:before-config', instruction.config, this);
      //this.trigger('router:route:after-config', instruction.config, this);
      this.queueInstruction(instruction);
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

  reset() {
    this.recognizer = new RouteRecognizer();
    this.routes = [];
    this.queue = [];
    this.isProcessing = false;
    this.currentInstruction = null;
    delete this.options;
  };

  createChildRouter() {
    return new Router(this);
  };
}