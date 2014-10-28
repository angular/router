import {ComponentDirective} from 'templating';
import {Answers} from './index';
import {Redirect} from 'router';

@ComponentDirective
export class QuestionThree{
  constructor(answers:Answers){
    this.question = 'What...is your favorite color?';
    this.answers = answers;
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
