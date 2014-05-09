import {Inject} from 'di';
import {ComponentDirective} from 'templating';
import {RootRouter} from 'router';

@ComponentDirective({
	selector:'ng-app'
})
export class App {
  @Inject(RootRouter)
  constructor(router) {
  	this.router = router;

  	router.title = 'Router Demo';
    router = router.map([
    	{ route: ['','welcome'], title:'Welcome', moduleId: 'welcome', nav: true },
      { route: 'flickr', moduleId: 'flickr', nav: true }
    ]);
  }
}