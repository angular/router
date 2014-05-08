import {ComponentDirective} from 'templating';

@ComponentDirective({
  selector: 'exp-app'
})
export class App {
    constructor() {
        this.route = null;
    }
}
