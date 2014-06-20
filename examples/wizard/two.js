import {ComponentDirective} from 'templating';
import {Answers} from './index';
import {Inject} from 'di';
import {Redirect} from 'router';

@ComponentDirective
export class QuestionTwo{
  constructor(){
    this.question = 'What...is your quest?';
    this.answers = Answers.instance;
  }

  canActivate(){
    if(!this.answers.name){
      return new Redirect('one');
    }

    return true;
  }
}