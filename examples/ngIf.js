import {TemplateDirective} from 'templating';
import {Inject} from 'di';
import {BoundViewFactory, ViewPort} from 'templating';

@TemplateDirective({
  selector: '[ng-if]',
  bind: {'ngIf': 'ngIf'},
  observe: {'ngIf': 'ngIfChanged'}
})
export class NgIf {
  @Inject(BoundViewFactory, ViewPort)
  constructor(viewFactory, viewPort) {
    this.viewFactory = viewFactory;
    this.viewPort = viewPort;
    this.view = null;
  }
  ngIfChanged(value) {
    if (typeof value === 'string') {
      // parse initial attribute
      value = value === 'true';
    }
    if (!value && this.view) {
      this.view.remove();
      this.view = null;
    }
    if (value) {
      this.view = this.viewFactory.createView();
      this.viewPort.append(this.view);
    }
  }
}
