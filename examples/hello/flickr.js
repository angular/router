import {ComponentDirective} from 'templating';

@ComponentDirective
export class Flickr{
	constructor(){
		this.heading = 'Flickr';
		this.images = [];
	}

  canDeactivate(){
    return confirm('Are you sure you want to leave?');
  }
}