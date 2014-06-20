import {TemplateDirective} from 'templating';
import {Inject} from 'di';
import {BoundViewFactory, ViewPort, InitAttrs} from 'templating';

@TemplateDirective({
  selector: '[ng-if]',
  bind: {'ngIf': 'ngIf'},
  observe: {'ngIf': 'ngIfChanged'}
})
export class NgIf {
  @Inject(BoundViewFactory, ViewPort, InitAttrs)
  constructor(viewFactory, viewPort, attrs) {
    this.viewFactory = viewFactory;
    this.viewPort = viewPort;
    this.view = null;
    this.ngIf = attrs.ngIf === 'true';
  }
  ngIfChanged(value) {
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
