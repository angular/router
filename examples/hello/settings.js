import {ComponentDirective} from 'templating';
import {Router} from 'router';

@ComponentDirective
export class Welcome{
  constructor(router:Router){
    this.heading = 'Settings';
    this.router = router;

    router.configure((config) =>{
      config.map([
        { pattern: ['','welcome'],  componentUrl: 'welcome',  nav: true, title:'Welcome' },
        { pattern: 'flickr',        componentUrl: 'flickr',   nav: true },
        { pattern: 'settings',      componentUrl: 'settings', nav: true, title:'Settings (What!?)' }
      ]);
    });
  }
}