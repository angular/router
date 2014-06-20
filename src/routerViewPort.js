import {TemplateDirective, View, ViewPort, ViewFactory, InitAttrs} from 'templating';
import {Injector, Inject} from 'di';

@TemplateDirective({
  selector: 'router-view-port'
})
export class RouterViewPort {
  @Inject(ViewFactory, ViewPort, 'executionContext', Injector, InitAttrs)
  constructor(viewFactory, viewPort, executionContext, injector, attrs) {
    this.viewFactory = viewFactory;
    this.viewPort = viewPort;
    this.injector = injector;
    this.view = null;
    this.executionContext = executionContext;
    if ('router' in this.executionContext) {
      this.executionContext.router.registerViewPort(this, attrs.name);
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
