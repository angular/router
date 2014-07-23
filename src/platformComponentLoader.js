import {ComponentLoader} from 'templating';

export class PlatformComponentLoader {
  constructor(loader:ComponentLoader){
    this.loader = loader;
  }

  loadComponent(config){
    var url = config.componentUrl;

    if(url.indexOf('.html') == -1){
      url += '.html';
    }

    return new Promise((resolve, reject) => {
      this.loader.loadFromTemplateUrl({
        templateUrl: url,
        done: ({directive})=> {
          resolve(directive);
        }
      });
    });
  }
}