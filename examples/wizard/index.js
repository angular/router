import {ComponentDirective} from 'templating';
import {AppRouter} from 'router';

export class Answers{
  constructor(){
    this.name = null;
    this.quest = null;
    this.favoriteColor = null;
  }
}

@ComponentDirective
export class App {
  constructor(router:AppRouter) {
    this.router = router;

    this.router.configure(config => {
      config.title = 'The Bridge of Death';

      config.map([
        { pattern: ['', 'intro'],   componentUrl: 'intro' },
        { pattern: 'one',           componentUrl: 'one',   nav: true, title: 'Question 1' },
        { pattern: 'two',           componentUrl: 'two',   nav: true, title: 'Question 2' },
        { pattern: 'three',         componentUrl: 'three', nav: true, title: 'Question 3' },
        { pattern: 'end',           componentUrl: 'end' },
      ]);
    });
  }
}