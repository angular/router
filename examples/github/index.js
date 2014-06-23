import {ComponentDirective} from 'templating';
import {AppRouter} from 'router';

@ComponentDirective({selector:'ng-app'})
export class App {
  constructor(router:AppRouter) {
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