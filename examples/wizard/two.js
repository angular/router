import {ComponentDirective} from 'templating';
import {Answers} from './index';
import {Redirect} from 'router';

@ComponentDirective
export class QuestionTwo{
  constructor(answers:Answers){
    this.question = 'What...is your quest?';
    this.answers = answers;
  }

  canActivate(){
    if(!this.answers.name){
      return new Redirect('one');
    }

    return true;
  }
}