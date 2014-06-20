import {ComponentDirective} from 'templating';
import {Answers} from './index';
import {Inject} from 'di';
import {Redirect} from 'router';

@ComponentDirective
export class QuestionThree{
  constructor(){
    this.question = 'What...is your favorite color?';
    this.answers = Answers.instance;
  }

  canActivate(){
    if(!this.answers.name){
      return new Redirect('one');
    }

    if(!this.answers.quest){
      return new Redirect('two');
    }

    return true;
  }
}