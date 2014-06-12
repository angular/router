import {TemplateDirective, View, ViewPort, ViewFactory} from 'templating';
import {Injector, Inject} from 'di';

@TemplateDirective({selector: 'router-zone'})
export class RouterZone {
  @Inject(ViewFactory, ViewPort, 'executionContext', Injector)
  constructor(viewFactory, viewPort, executionContext, injector) {
    this.viewFactory = viewFactory;
    this.viewPort = viewPort;
    this.injector = injector;
    this.view = null;

    if ('router' in executionContext) {
      executionContext.router.registerZone(this);
    }
  }

  process(zoneInstruction){
    this.tryRemoveView();
    this.view = zoneInstruction.component;
    this.viewPort.append(this.view);
  }

  tryRemoveView() {
    if (this.view) {
      this.view.remove();
      this.view = null;
    }
  }
}