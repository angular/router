import {ComponentDirective} from 'templating';
import {Answers} from './app';
import {Inject} from 'di';

@ComponentDirective
export class QuestionOne{
  constructor(){
    this.question = 'What...is your name?';
    this.answers = Answers.instance;
  }
}