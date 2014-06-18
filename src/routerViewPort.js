import {TemplateDirective, View, ViewPort, ViewFactory} from 'templating';
import {Injector, Inject} from 'di';

@TemplateDirective({
  selector: 'router-view-port',
  observe: {
    'viewPortName': 'viewPortNameChanged'
  }
})
export class RouterViewPort {
  @Inject(ViewFactory, ViewPort, 'executionContext', Injector)
  constructor(viewFactory, viewPort, executionContext, injector) {
    this.viewFactory = viewFactory;
    this.viewPort = viewPort;
    this.injector = injector;
    this.view = null;
    this.executionContext = executionContext;
  }

  viewPortNameChanged(name) {
    if ('router' in this.executionContext) {
      this.executionContext.router.registerViewPort(this, name);
    }
  }

  process(viewPortInstruction) {
    this.tryRemoveView();
    this.view = viewPortInstruction.component;
    this.viewPort.append(this.view);
  }

  tryRemoveView() {
    if (this.view) {
      this.view.remove();
      this.view = null;
    }
  }
}
