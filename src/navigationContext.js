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

    //TODO: update calculated hrefs for all navigation models (navModel.href)

    for(var zoneName in zoneInstructions){
      var zoneInstruction = zoneInstructions[zoneName];
      var zone = router.zones[zoneName];

      if(!zone){
        continue;
      }

      zone.process(zoneInstruction);

      if('childNavigationContext' in zoneInstruction){
        zoneInstruction.childNavigationContext.commitChanges();
      }
    }
  }
}

export class CommitChangesStep{
  run(navigationContext, next){
    navigationContext.commitChanges();

    //update title?

    return next();
  }
}

function updateDocumentTitle(instruction) {
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