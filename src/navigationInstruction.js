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

  addZoneInstruction(zoneName, moduleId, component){
    return this.zoneInstructions[zoneName] = {
      name:zoneName,
      moduleId: moduleId,
      component:component,
      childRouter:component.router,
      lifecycleArgs:this.lifecycleArgs.slice()
    };
  }
}