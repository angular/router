import {TemplateDirective} from 'templating';
import {Inject} from 'di';
import {View, ViewPort, BoundViewFactory} from 'templating';

@TemplateDirective({
  selector: '[ng-if]',
  bind: {'ngIf': 'ngIf'},
  observe: {'ngIf': 'ngIfChanged'}
})
export class NgIf {
  @Inject(BoundViewFactory, ViewPort, View)
  constructor(viewFactory, viewPort, parentView) {
    this.viewPort = viewPort;
    this.viewFactory = viewFactory;
    this.parentView = parentView;
    this.view = null;
  }
  ngIfChanged(value) {
    if (typeof value === 'string') {
      // parse initial attribute
      value = value === 'true';
    }
    if (!value && this.view) {
      this.viewPort.remove(this.view);
      this.view.destroy();
      this.view = null;
    }
    if (value) {
      this.view = this.viewFactory.createView();
      this.viewPort.append(this.view);
    }
  }
}
