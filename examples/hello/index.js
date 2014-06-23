import {ComponentDirective} from 'templating';
import {AppRouter} from 'router';

@ComponentDirective
export class App {
  constructor(router:AppRouter) {
    this.router = router;

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