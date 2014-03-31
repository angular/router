import {ComponentDirective} from 'templating/annotations';
import {viewFactory} from 'templating/requirejs-html!./greet';

@ComponentDirective({
  selector: 'exp-hello',
  template: viewFactory
})
export class FirstComponent {
  constructor() {
  }
  greet(name) {
    return 'Hello '+name;
  }
}
