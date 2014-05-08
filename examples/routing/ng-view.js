import {Inject} from 'di';
import {TemplateDirective, ViewPort, View, ViewFactory} from 'templating';

@TemplateDirective({
  selector: '[ng-view]',
  bind: {
    'ngView': 'ngView'
  },
  observe: {
    'ngView': 'routeChanged'
  }
})
export class NgView {
  @Inject(ViewFactory, ViewPort, View)
  constructor(viewFactory, viewPort, parentView) {
    this.viewPort = viewPort;
    this.viewFactory = viewFactory;
    this.parentView = parentView;
    this.view = null;
  }
  routeChanged(newRoute) {
    if (this.view) {
      this.viewPort.remove(this.view);
      this.view.destroy();
      this.view = null;
    }
    if (newRoute) {
      this.view = this.viewFactory.createComponentView(newRoute, this.parentView.injector);
      this.viewPort.append(this.view);
    }

  }
}
