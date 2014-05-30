import RouteRecognizer from 'route-recognizer';
import {NavigationContext} from './navigationContext';
import {NavigationInstruction} from './navigationInstruction';
import {RouterConfiguration} from './routerConfiguration';

RouteRecognizer = RouteRecognizer['default'];

export class Router{
  constructor() {
    this.zones = {};
    this.reset();
    this.config = new RouterConfiguration(this);
  }

  registerZone(zone, name) {
    name = name || zone.name || 'default';
    this.zones[name] = zone;

    if('activate' in this){
      if(!this.isActive){
        this.activate();
      }else{
        this.dequeueInstruction();
      }
    }
  }

  configure(callback){
    callback(this.config);
    return this;
  }

  navigate(fragment, options) {
    return history.navigate(fragment, options);
  }

  navigateBack() {
    history.navigateBack();
  }

  createChild() {
    var childRouter = new Router();
    child.parent = this;
    return childRouter;
  }

  createNavigationInstruction(url){
    var results = this.recognizer.recognize(url);

    if(!results || !results.length){
      results = this.childRecognizer.recognize(url);
    }

    if (results && results.length) {
      var first = results[0],
          fragment = url,
          queryIndex = fragment.indexOf('?'),
          queryString;

      if (queryIndex != -1) {
        fragment = url.substring(0, queryIndex);
        queryString = url.substr(queryIndex + 1);
      }

      var instruction = new NavigationInstruction(
        fragment, 
        queryString, 
        first.params, 
        first.queryParams, 
        first.handler
        );

      if (typeof first.handler == 'function') {
        instruction.config = {};
        return first.handler(instruction);
      }
      
      return Promise.resolve(instruction);
    } else{
      //log('Route Not Found');
      return Promise.resolve(null);
    }
  }

  createNavigationContext(instruction) {
    return new NavigationContext(this, instruction);
  }

  generate(name, params) {
    return this.recognizer.generate(name, params);
  }

  addRoute(config, navModel = {}){
    if(!('zones' in config)){
      config.zones = {
        'default':{moduleId:config.moduleId}
      };
    }

    this.routes.push(config);
    this.recognizer.add([{path:config.route, handler: config}]);

    var withChild = JSON.parse(JSON.stringify(config));
    withChild.route += "*childRoute";
    withChild.hasChildRouter = true;
    this.childRecognizer.add([{path:withChild.route, handler: withChild}]);
    
    config.navModel = navModel;
    withChild.navModel = navModel;

    if(('nav' in config || 'order' in navModel) 
      && this.navigation.indexOf(navModel) === -1) {
      navModel.title = navModel.title || config.title;
      navModel.order = navModel.order || config.nav;
      navModel.href = navModel.href || config.href;
      navModel.isActive = false;
      navModel.config = config;

      if (typeof navModel.order != 'number') {
        navModel.order = ++this.fallbackOrder;
      }

      this.navigation.push(navModel);
      this.navigation = this.navigation.sort((a, b) => { return a.order - b.order; });
    }
  }

  handleUnknownRoutes(config){
    var catchAllRoute = "*path";

    var callback = (instruction) => {
      return new Promise((resolve) =>{
        if (!config) {
          instruction.config.moduleId = instruction.fragment;
        } else if (typeof config == 'string') {
          instruction.config.moduleId = config;
        } else if (typeof config == 'function') {
          var result = config(instruction);
          
          if (result instanceof Promise) {
            result.then(() => {
              instruction.config.route = catchAllRoute;
              resolve(instruction);
            });

            return;
          }
        } else {
          instruction.config = config;
        }

        instruction.config.route = catchAllRoute;
        resolve(instruction);
      });
    };

    this.childRecognizer.add([{path:catchAllRoute, handler: callback}]);
  }

  reset() {
    this.fallbackOrder = 100;
    this.recognizer = new RouteRecognizer();
    this.childRecognizer = new RouteRecognizer();
    this.routes = [];
    this.isNavigating = false;
    this.navigation = [];
  };
}