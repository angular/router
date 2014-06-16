export class NavigationInstruction{
  constructor(fragment, queryString, params, queryParams, config, parentInstruction) {
    this.fragment = fragment;
    this.queryString = queryString;
    this.params = params;
    this.queryParams = queryParams;
    this.config = config;
    this.lifecycleArgs = [params, queryParams, config];
    this.zoneInstructions = {};

    if(parentInstruction && this.params){
      this.params.$parent = parentInstruction.params;
    }
  }

  addZoneInstruction(zoneName, strategy, componentUrl, component){
    return this.zoneInstructions[zoneName] = {
      name:zoneName,
      strategy: strategy,
      componentUrl: componentUrl,
      component:component,
      childRouter:component.executionContext.router,
      lifecycleArgs:this.lifecycleArgs.slice()
    };
  }
}