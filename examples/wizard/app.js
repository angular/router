import {Inject} from 'di';
import {ComponentDirective} from 'templating';
import {AppRouter, PipelineProvider} from 'router';

export class Answers{
  constructor(){
    this.name = null;
    this.quest = null;
    this.favoriteColor = null;
  }
}

Answers.instance = new Answers();

@ComponentDirective({selector:'ng-app'})
export class App {
  constructor() {
    this.router = new AppRouter(new PipelineProvider());

    this.router.configure((config)=>{
      config.title = 'The Bridge of Death';

      config.map([
        { pattern: ['', 'intro'],   componentUrl: 'intro' },
        { pattern: 'one',           componentUrl: 'one',   nav: true, title: 'Question 1'  },
        { pattern: 'two',           componentUrl: 'two',   nav: true, title: 'Question 2' },
        { pattern: 'three',         componentUrl: 'three', nav: true, title: 'Question 3' },
        { pattern: 'end',           componentUrl: 'end' },
      ]);
    });
  }
}