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
        { route: ['','comments'], title:'Comments', moduleId: 'comments', nav:true },
        { route: 'events', title:'Events', moduleId: 'events', nav:true }
      ]);
    });
  }

  activate(params){
    return this.service.issue(params.id).then((issue) =>{
      this.issue = issue;
    });
  }
}