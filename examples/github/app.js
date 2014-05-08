import {ComponentDirective} from 'templating';

export {GhRoutes} from './views/routes';

@ComponentDirective({
  selector: 'gh-app'
})
export class App {
  constructor() {
    this.route = null;
  }
}
