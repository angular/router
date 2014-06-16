import {ComponentDirective} from 'templating';
import {GhService} from 'gh-service';
import {Http} from '../http';

@ComponentDirective
export class Overview {
  constructor() {
    this.service = new GhService(Http());
  }

  activate(){
    return this.service.allIssues().then((issues) =>{
      this.issues = issues;
    });
  }
}