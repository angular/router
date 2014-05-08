import {Inject, Provide} from 'di';
import {TemplateDirective, ViewPort, View, ViewFactory} from 'templating';
import {Routes, Route} from './route';

@TemplateDirective({
  selector: '[ng-view]',
  bind: {
    'ngView': 'ngView'
  },
  observe: {
    'ngView': 'urlChanged'
  }
})
export class NgView {
  @Inject(ViewFactory, ViewPort, View, Routes)
  constructor(viewFactory, viewPort, parentView, routes) {
    this.viewPort = viewPort;
    this.viewFactory = viewFactory;
    this.parentView = parentView;
    this.view = null;
    this.routes = routes;
  }
  urlChanged(newUrl) {
    var route;
    @Provide(Route)
    function routeProvider() {
      return route;
    }

    if (this.view) {
      this.viewPort.remove(this.view);
      this.view.destroy();
      this.view = null;
    }
    newUrl = newUrl || '';
    var route = this._findRoute(newUrl);
    if (route) {
      var injector = this.parentView.injector.createChild([routeProvider]);
      this.view = this.viewFactory.createComponentView(route.definition.element, injector);
      this.viewPort.append(this.view);
    }
  }
  _findRoute(url) {
    return this.routes.reduce((foundRoute, route) => {
      if (foundRoute) {
        return foundRoute;
      }
      var match = route.pattern.exec(url);
      if (match) {
        var params = {};
        route.params.forEach((paramName, i) => {
          params[paramName] = match[i+1];
        });
        foundRoute = new Route({
          definition: route,
          params: params
        });
      }
      return foundRoute;
    }, null);
  }

}
