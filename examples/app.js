import {Inject} from 'di';
import {ComponentDirective} from 'templating';
import {AppRouter} from 'router';

@ComponentDirective({selector:'ng-app'})
export class App {
  @Inject(AppRouter)
  constructor(router) {
    this.router = router;

    router.configure((config)=>{
      config.title = 'Router Demo';

      config.map([
        { route: ['','welcome'], title:'Welcome', moduleId: 'welcome', nav: true },
        { route: 'flickr', moduleId: 'flickr', nav: true }
      ]);
    });
  }
}