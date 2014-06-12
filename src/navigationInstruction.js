export class NavigationInstruction{
  constructor(fragment, queryString, params, queryParams, config) {
    this.fragment = fragment;
    this.queryString = queryString;
    this.params = params;
    this.queryParams = queryParams;
    this.config = config;
    this.lifecycleArgs = [params, queryParams, config];
    this.zoneInstructions = {};
  }

  addZoneInstruction(zoneName, strategy, moduleId, component){
    return this.zoneInstructions[zoneName] = {
      name:zoneName,
      strategy: strategy,
      moduleId: moduleId,
      component:component,
      childRouter:component.executionContext.router,
      lifecycleArgs:this.lifecycleArgs.slice()
    };
  }
}