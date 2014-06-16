import {Inject} from 'di';
import {ComponentDirective} from 'templating';
import {AppRouter, PipelineProvider} from 'router';

@ComponentDirective({selector:'ng-app'})
export class App {
  constructor() {
    this.router = new AppRouter(new PipelineProvider());

    this.router.configure((config)=>{
      config.title = 'Router Demo';

      config.map([
        { route: ['','welcome'], title:'Home', moduleId: 'welcome', nav: true },
        { route: 'flickr', moduleId: 'flickr', nav: true },
        { route: 'settings', moduleId: 'settings', nav: true }
      ]);
    });
  }
}