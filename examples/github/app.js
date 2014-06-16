import {Inject} from 'di';
import {ComponentDirective} from 'templating';
import {AppRouter, PipelineProvider} from 'router';

@ComponentDirective({selector:'ng-app'})
export class App {
  constructor() {
    this.router = new AppRouter(new PipelineProvider());

    this.router.configure((config)=>{
      config.map([
        { route: ['','issues'], componentUrl: 'overview', title:'Issues' },
        { route: 'issues/:id', componentUrl: 'detail' }
      ]);
    });
  }
}