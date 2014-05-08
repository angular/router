import {Provide} from 'di';
import {ComponentDirective} from 'templating';
import {ChangeEventConfig} from 'templating';

// component
@ComponentDirective({
  selector: 'exp-greet',
  bind: {
    'user': 'user'
  }
})
export class FirstComponent {
  constructor() {
    this.counter = 0;
    this.user = null;
    this.userValid = {};
  }

  greet(name) {
    if (!name) {
      return 'Hello everybody (' + this.counter + ')';
    }

    return 'Hello ' + name + ' (' + this.counter + ')';
  }

  incCounter() {
    this.counter++;
  }
}

// config for DI
@Provide(ChangeEventConfig)
export function GreetChangeEventConfig() {
  var res = [];
  res.push(...ChangeEventConfig());
  res.push({
    nodeName: 'x-toggle', events: ['change'], properties: ['checked']
  });
  return res;
}