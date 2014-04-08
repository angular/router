import {TemplateDirective} from 'templating';
import {Injector} from 'di';
import {Inject} from 'di';
import {View, ViewPort} from 'templating';

@TemplateDirective({
  selector: '[router-port]',
  exports: ['routerPort']
})
export class RouterPort {
  @Inject(ViewPort, View, Injector)
  constructor(viewPort, parentView, injector) {
    this.viewPort = viewPort;
    this.injector = injector;
    this.parentView = parentView;
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
    if (value === this._router) {
      return;
    }

    this._router = value;

    //TODO: register for router's active instruction change
    //use instruction data to create a bound view
    //push the view into the view port

    //if (!value && this.view) {
    //  this.viewPort.remove(this.view);
    //  this.view = null;
    //}

    //if (value) {
    //  this.view = this.viewFactory.createChildView(this.injector, this.parentView.executionContext);
    //  this.viewPort.append(this.view);
    //}
  }
}
