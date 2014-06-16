import {TemplateDirective, View, ViewPort, ViewFactory} from 'templating';
import {Injector, Inject} from 'di';

@TemplateDirective({
  selector: 'router-zone',
  observe: {
    'zoneName': 'zoneNameChanged'
  }
})
export class RouterZone {
  @Inject(ViewFactory, ViewPort, 'executionContext', Injector)
  constructor(viewFactory, viewPort, executionContext, injector) {
    this.viewFactory = viewFactory;
    this.viewPort = viewPort;
    this.injector = injector;
    this.view = null;
    this.executionContext = executionContext;
  }

  zoneNameChanged(name){
    if ('router' in this.executionContext) {
      this.executionContext.router.registerZone(this, name);
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