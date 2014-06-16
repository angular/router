import {ComponentDirective} from 'templating';
import {Jsonp} from './jsonp';

var url = 'http://api.flickr.com/services/feeds/photos_public.gne?tags=angularjs&tagmode=any&format=json';

@ComponentDirective
export class Flickr{
	constructor(){
		this.heading = 'Flickr';
		this.images = [];
    this.jsonp = Jsonp();
	}

  activate(){
    return this.jsonp(url).then((result) =>{
      this.images = result.items;
    });
  }

  canDeactivate(){
    return confirm('Are you sure you want to leave?');
  }
}