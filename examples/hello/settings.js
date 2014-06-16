import {Inject} from 'di';
import {ComponentDirective} from 'templating';
import {Router} from 'router';

@ComponentDirective
export class Welcome{
  @Inject(Router)
  constructor(router){
    this.heading = 'Settings';
    this.router = router;

    router.configure((config) =>{
      config.map([
        { route: ['','welcome'], componentUrl: 'welcome', nav: true, title:'Welcome' },
        { route: 'flickr', componentUrl: 'flickr', nav: true }
      ]);
    });
  }
}