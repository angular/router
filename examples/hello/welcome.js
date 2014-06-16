import {ComponentDirective} from 'templating';

@ComponentDirective
export class Welcome{
	constructor(){
		this.heading = 'Welcome to the Angular 2.0 Router Demo!';
	}
}