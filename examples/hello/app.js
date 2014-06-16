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
        { route: ['','welcome'], componentUrl: 'welcome', nav: true, title:'Home' },
        { route: 'flickr', componentUrl: 'flickr', nav: true },
        { route: 'settings', componentUrl: 'settings', nav: true }
      ]);
    });
  }
}