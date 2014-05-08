import {Inject} from 'di';
import {ComponentDirective} from 'templating';
import {Route} from '../route';

@ComponentDirective({
  selector: 'gh-detail'
})
export class Detail {
  @Inject(Route)
  constructor(route) {
    this.route = route;
  }
}
