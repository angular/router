import {REPLACE} from './navigationPlan';

export class NavigationContext {
  constructor(router, nextInstruction) {
    this.router = router;
    this.nextInstruction = nextInstruction;
    this.currentInstruction = router.currentInstruction;
    this.prevInstruction = router.currentInstruction;
  }

  commitChanges() {
    var next = this.nextInstruction,
        prev = this.prevInstruction,
        viewPortInstructions = next.viewPortInstructions,
        router = this.router;

    router.currentInstruction = next;

    if (prev) {
      prev.config.navModel.isActive = false;
    }

    next.config.navModel.isActive = true;

    router.refreshBaseUrl();
    router.refreshNavigation();

    for (var viewPortName in viewPortInstructions) {
      var viewPortInstruction = viewPortInstructions[viewPortName];
      var viewPort = router.viewPorts[viewPortName];

      if (viewPortInstruction.strategy === REPLACE) {
        viewPort.process(viewPortInstruction);
      }

      if ('childNavigationContext' in viewPortInstruction) {
        viewPortInstruction.childNavigationContext.commitChanges();
      }
    }
  }

  buildTitle(separator=' | ') {
    var next = this.nextInstruction,
        title = next.config.navModel.title || '',
        viewPortInstructions = next.viewPortInstructions,
        childTitles = [];

    for (var viewPortName in viewPortInstructions) {
      var viewPortInstruction = viewPortInstructions[viewPortName];

      if ('childNavigationContext' in viewPortInstruction) {
        var childTitle = viewPortInstruction.childNavigationContext.buildTitle(separator);
        if (childTitle) {
          childTitles.push(childTitle);
        }
      }
    }

    if (childTitles.length) {
      title = childTitles.join(separator) + (title ? separator : '') + title;
    }

    if (this.router.title) {
      title += (title ? separator : '') + this.router.title;
    }

    return title;
  }
}

export class CommitChangesStep {
  run(navigationContext, next) {
    navigationContext.commitChanges();

    var title = navigationContext.buildTitle();
    if (title) {
      document.title = title;
    }

    return next();
  }
}