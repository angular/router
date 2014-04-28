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
  }

  routerChanged(value, oldValue){
    console.log('router changed');

    if (oldValue) {
      oldValue.activator.onCurrentChanged = null;
      this.tryRemoveView();
    }

    if(value){
      value.activator.onCurrentChanged = this.followInstruction.bind(this);
      if(value.activator.current){
        this.followInstruction(value.activator.current);
      }
    }else{
      this.tryRemoveView();
    }
  }

  followInstruction(instruction){
    this.tryRemoveView();
    this.view = this.viewFactory.createChildView({
      template:instruction.template, 
      parentView:this.parentView, 
      executionContext:instruction.controller
    });

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
