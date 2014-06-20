import {Inject} from 'di';
import {ComponentDirective} from 'templating';
import {AppRouter} from 'router';

@ComponentDirective({selector:'ng-app'})
export class App {
  @Inject(AppRouter)
  constructor(router) {
    this.router = router;
    this.router.configure((config)=>{
      config.title = 'Angular Issues';

      config.map([
        { pattern: ['','issues'], componentUrl: 'overview', title:'Issues' },
        { pattern: 'issues/:id',  componentUrl: 'detail' }
      ]);
    });
  }
}