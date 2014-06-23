import {Router} from 'router';
import {ComponentDirective} from 'templating';
import {GhService} from 'gh-service';

@ComponentDirective
export class Detail {
  constructor(router:Router, service:GhService) {
    this.router = router;
    this.service = service;

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