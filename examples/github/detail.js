import {ComponentDirective} from 'templating';
import {GhService} from 'gh-service';
import {Http} from '../http';

@ComponentDirective
export class Detail {
  constructor() {
    this.service = new GhService(Http());
  }

  activate(params){
    return this.service.issue(params.id).then((issue) =>{
      this.issue = issue;
    });
  }
}