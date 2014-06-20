import {ComponentDirective} from 'templating';
import {GhService} from 'gh-service';

@ComponentDirective
export class Comments {
  constructor(service:GhService) {
    this.service = service;
  }

  activate(params){
    return this.service.comments(params.$parent.id).then((comments) =>{
      this.comments = comments;
    });
  }
}