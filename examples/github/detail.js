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
        { route: ['','comments'], componentUrl: 'comments', nav:true, title:'Comments' },
        { route: 'events', componentUrl: 'events', nav:true }
      ]);
    });
  }

  activate(params){
    return this.service.issue(params.id).then((issue) =>{
      this.issue = issue;
    });
  }
}