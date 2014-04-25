import {TemplateDirective, View, ViewPort} from 'templating';
import {Injector, Inject} from 'di';

@TemplateDirective({
  selector: '[router-port]',
  bind: {'router': 'router'},
  observe: {'router': 'routerChanged'}
})
export class RouterPort {
  @Inject(ViewPort, Injector)
  constructor(viewPort, injector) {
    this.viewPort = viewPort;
    this.injector = injector;
    this.view = null;
  }

  routerChanged(value, oldValue){
    if (oldValue) {
      oldValue.activator.onCurrentChanged = null;
      tryRemoveView();
    }

    if(value){
      value.activator.onCurrentChanged = followInstruction.bind(this);
      if(value.activator.current){
        followInstruction(value.activator.current);
      }
    }else{
      tryRemoveView();
    }
  }

  followInstruction(instruction){
    this.tryRemoveView();
    this.view = instruction.viewFactory.createChildView(this.injector, instruction.controller);
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
