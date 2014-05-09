import {Inject} from 'di';
import {ComponentDirective} from 'templating';
import {RootRouter} from 'router';

@ComponentDirective
export class App {
  @Inject(RootRouter)
  constructor(router) {
    this.router = router.map([
    	{ route: ['','welcome'], title:'Welcome', moduleId: './welcome', nav: true },
        { route: 'flickr', moduleId: './flickr', nav: true }
    ]);
  }
}