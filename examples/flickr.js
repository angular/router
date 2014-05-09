import {ComponentDirective} from 'templating';

@ComponentDirective
export class Flickr{
	constructor(){
		this.heading = 'Flickr';
		this.images = [];
	}
}