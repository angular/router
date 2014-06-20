import {ComponentDirective} from 'templating';
import {Redirect} from 'router';
import {Answers} from './app';

@ComponentDirective
export class End {
  constructor(){
    this.answers = Answers.instance;
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