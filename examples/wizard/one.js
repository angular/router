import {ComponentDirective} from 'templating';
import {Answers} from './index';

@ComponentDirective
export class QuestionOne{
  constructor(answers:Answers){
    this.question = 'What...is your name?';
    this.answers = answers;
  }
}