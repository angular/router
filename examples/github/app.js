import {Inject} from 'di';
import {ComponentDirective} from 'templating';
import {AppRouter, PipelineProvider} from 'router';

@ComponentDirective({selector:'ng-app'})
export class App {
  constructor() {
    this.router = new AppRouter(new PipelineProvider());

    this.router.configure((config)=>{
      config.map([
        { route: ['','issues'], title:'Issues', moduleId: 'overview' },
        { route: 'issues/:id', moduleId: 'detail' }
      ]);
    });
  }
}