import {Inject} from 'di';
import {Router} from 'router';
import {ComponentDirective} from 'templating';
import {GhService} from 'gh-service';
import {Http} from '../http';

@ComponentDirective
export class Detail {
  @Inject(Router)
  constructor(router) {
    this.router = router;
    this.service = new GhService(Http());

    this.router.configure((config)=>{
      config.map([
        { pattern: ['','comments'], componentUrl: 'comments', nav:true, title:'Comments' },
        { pattern: 'events',        componentUrl: 'events',   nav:true }
      ]);
    });
  }

  activate(params, qs, config){
    return this.service.issue(params.id).then((issue) =>{
      config.navModel.title = 'Issue ' + params.id.toString();
      this.issue = issue;
    });
  }
}