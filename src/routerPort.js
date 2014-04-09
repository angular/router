import {TemplateDirective} from 'templating';
import {Injector} from 'di';
import {Inject} from 'di';
import {View, ViewPort} from 'templating';

@TemplateDirective({
  selector: '[router-port]',
  exports: ['routerPort']
})
export class RouterPort {
  @Inject(ViewPort, Injector)
  constructor(viewPort, injector) {
    this.viewPort = viewPort;
    this.injector = injector;
    this.view = null;
    this._router = null;

    Object.defineProperty(this, 'router', {
      get: function() {
        return this.routerGetter();
      },
      set: function(value) {
        this.routerSetter(value);
      }
    });
  }

  /* TODO: not working with traceur right now
  set router(value) {}
  */
  routerGetter() {
    return this._router;
  }

  routerSetter(value) {
    var that = this;

    if (value === this._router) {
      return;
    }

    this._router = value;

    if(value){
      value.activator.onCurrentChanged = function(instruction){
        if(that.view){
          that.viewPort.remove(that.view);
        }

        that.view = instruction.viewFactory.createChildView(that.injector, instruction.controller);
        that.viewPort.append(that.view);
      };
    }
  }
}
