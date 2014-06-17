import {Inject} from 'di';
import {ComponentDirective} from 'templating';
import {AppRouter, PipelineProvider} from 'router';

@ComponentDirective({selector:'ng-app'})
export class App {
  constructor() {
    this.router = new AppRouter(new PipelineProvider());

    this.router.configure((config)=>{
      config.title = 'Angular Issues';

      config.map([
        { pattern: ['','issues'], componentUrl: 'overview', title:'Issues' },
        { pattern: 'issues/:id',  componentUrl: 'detail' }
      ]);
    });
  }
}