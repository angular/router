import {TemplateDirective} from 'templating';
import {Inject} from 'di';
import {View, ViewPort, BoundViewFactory} from 'templating';

@TemplateDirective({
  selector: '[ng-repeat]',
  bind: {
    'ngRepeat': 'ngRepeat'
  },
  observe: {
    'ngRepeat[]': 'ngRepeatChanged'
  }
})
export class NgRepeat {
  @Inject(BoundViewFactory, ViewPort, View)
  constructor(viewFactory, viewPort, parentView) {
    this.viewPort = viewPort;
    this.viewFactory = viewFactory;
    this.parentView = parentView;
    this.views = [];
    this.ngRepeat = [];
  }
  ngRepeatChanged(changeRecord) {
    var rows;
    if (changeRecord) {
      rows = changeRecord.iterable;
    } else {
      rows = [];
    }
    // TODO: Update the views incrementally!
    this.views.forEach((view) => {
      this.viewPort.remove(view);
      view.destroy();
    });
    this.views = rows.map((row) => {
      var context = Object.create(this.parentView.executionContext);
      context.row = row;
      var view = this.viewFactory.createView({executionContext: context});
      this.viewPort.append(view);
      return view;
    });
  }
}
