import {TemplateDirective, View, ViewPort, ViewFactory} from 'templating';
import {Injector, Inject} from 'di';

@TemplateDirective({
  selector: 'router-port',
  bind: {'router': 'router'},
  observe: {'router': 'routerChanged'}
})
export class RouterPort {
  @Inject(ViewFactory, ViewPort, View, Injector)
  constructor(viewFactory, viewPort, parentView, injector) {
    this.viewFactory = viewFactory;
    this.viewPort = viewPort;
    this.parentView = parentView;
    this.injector = injector;
    this.view = null;

    if('router' in parentView.executionContext){
      this.router = parentView.executionContext.router;
      this.routerChanged(this.router);
    }
  }

  routerChanged(value, oldValue){
    if (oldValue) {
      this.tryRemoveView();
    }

    if(value){
      value.connect(this);
    }else{
      this.tryRemoveView();
    }
  }

  followInstruction(instruction){
    this.tryRemoveView();
    this.view = instruction.component;
    this.viewPort.append(this.view);
  }

  tryRemoveView(){
    if(this.view){
      this.viewPort.remove(this.view);
      this.view.destroy();
      this.view = null;
    }
  }
}