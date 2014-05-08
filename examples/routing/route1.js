import {Inject} from 'di';
import {App} from './app';
import {ComponentDirective} from 'templating';

@ComponentDirective({
  selector: 'exp-route1'
})
export class Route1 {
  @Inject(App)
  constructor(app, node:Node) {
    this.app = app;
    this.node = node;
  }
  attached() {
    console.log('attached. size:', this.node.getBoundingClientRect());
  }
  detached() {
    console.log('detached');
  }
}
