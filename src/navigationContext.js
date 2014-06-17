import {REPLACE} from './navigationPlan';

export class NavigationContext {
  constructor(router, nextInstruction) {
    this.router = router;
    this.nextInstruction = nextInstruction;
    this.currentInstruction = router.currentInstruction;
    this.prevInstruction = router.currentInstruction;
  }

  commitChanges(){
    var next = this.nextInstruction,
        prev = this.prevInstruction,
        zoneInstructions = next.zoneInstructions,
        router = this.router;

    router.currentInstruction = next;

    if(prev){
      prev.config.navModel.isActive = false;
    }

    next.config.navModel.isActive = true;

    router.refreshBaseUrl();
    router.refreshNavigation();

    for(var zoneName in zoneInstructions){
      var zoneInstruction = zoneInstructions[zoneName];
      var zone = router.zones[zoneName];

      if(zone){
        makeProcessor(zoneInstruction)(zone);
      }else{
        router.zones[zoneName] = makeProcessor(zoneInstruction);
      }
    }
  }

  buildTitle(separator=' | '){
    var next = this.nextInstruction,
        title = next.config.navModel.title || '',
        zoneInstructions = next.zoneInstructions,
        childTitles = [];

    for(var zoneName in zoneInstructions){
      var zoneInstruction = zoneInstructions[zoneName];
      
      if('childNavigationContext' in zoneInstruction){
        var childTitle = zoneInstruction.childNavigationContext.buildTitle(separator);
        if(childTitle){
          childTitles.push(childTitle);
        }
      }
    }

    if(childTitles.length){
      title = childTitles.join(separator) + (title ? separator : '') + title;
    }

    if(this.router.title){
      title += (title ? separator : '') + this.router.title;
    }

    return title;
  }
}

export class CommitChangesStep{
  run(navigationContext, next){
    navigationContext.commitChanges();

    var title = navigationContext.buildTitle();
    if(title){
      document.title = title;
    }

    return next();
  }
}

function makeProcessor(zoneInstruction){
  return (zone) =>{
    if(zoneInstruction.strategy === REPLACE){
      zone.process(zoneInstruction);
    }

    if('childNavigationContext' in zoneInstruction){
      zoneInstruction.childNavigationContext.commitChanges();
    }
  };
}