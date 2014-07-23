import {TemplateDirective, View, ViewPort, ViewFactory, InitAttrs} from 'templating';
import {Inject, Provide} from 'di';
import {Router} from './router';

@TemplateDirective({selector: 'router-view-port'})
export class RouterViewPort {
  @Inject(ViewFactory, ViewPort, 'executionContext', InitAttrs)
  constructor(viewFactory, viewPort, executionContext, attrs) {
    this.viewFactory = viewFactory;
    this.viewPort = viewPort;
    this.executionContext = executionContext;
    this.view = null;

    if ('router' in this.executionContext) {
      this.executionContext.router.registerViewPort(this, attrs.name);
    }
  }

  getComponent(directive, createChildRouter){
    createChildRouter.annotations = [new Provide(Router)];

    var component = this.viewFactory.createComponentView({
      component: directive,
      providers: [createChildRouter],
      viewPort: this.viewPort
    });

    component.executionContext = component.injector.get(directive);

    return component;
  }

  process(viewPortInstruction) {
    this.tryRemoveView();
    this.view = viewPortInstruction.component;
    this.view.appendTo(this.viewPort);
  }

  tryRemoveView() {
    if (this.view) {
      this.view.remove();
      this.view = null;
    }
  }
}
