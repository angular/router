import {ComponentDirective} from 'templating';
import {GhService} from 'gh-service';
import {Http} from '../http';

@ComponentDirective
export class Comments {
  constructor() {
    this.service = new GhService(Http());
  }

  activate(params){
    return this.service.comments(params.$parent.id).then((comments) =>{
      this.comments = comments;
    });
  }
}