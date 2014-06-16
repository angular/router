import {ComponentDirective} from 'templating';
import {GhService} from 'gh-service';
import {Http} from '../http';

@ComponentDirective
export class Events {
  constructor() {
    this.service = new GhService(Http());
  }

  activate(params){
    return this.service.events(params.$parent.id).then((events) =>{
      this.events = events;
    });
  }
}