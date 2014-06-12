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
        { route: ['','welcome'], title:'Welcome', moduleId: 'welcome', nav: true },
        { route: 'flickr', moduleId: 'flickr', nav: true }
      ]);
    });
  }
}