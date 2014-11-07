import {ComponentDirective} from 'templating';
import {Answers} from './index';
import {Redirect} from 'router';

@ComponentDirective
export class End {
  constructor(answers:Answers){
    this.answers = answers;
  }

  canActivate(){
    if(!this.answers.name){
      return new Redirect('one');
    }

    if(!this.answers.quest){
      return new Redirect('two');
    }

    if(!this.answers.favoriteColor){
      return new Redirect('three');
    }

    return true;
  }
}