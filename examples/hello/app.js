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
        { pattern: ['','welcome'],  componentUrl: 'welcome',  nav: true, title:'Home' },
        { pattern: 'flickr',        componentUrl: 'flickr',   nav: true },
        { pattern: 'settings',      componentUrl: 'settings', nav: true }
      ]);
    });
  }
}