import Pipeline from './pipeline';

export class ChildRouter {

}

function ensureRoute(config){
  config.route = config.route || config.name || config.module;
}

export class Router{
  constructor(){
    this.recognizer = new RouteRecognizer();
    this.queue = [];
    this.isProcessing = false;
    this.currentInstruction = null;
    this.currentActivation = null;
  }

  get isNavigating(){
    return false;
  }

  map(config){
    config = Array.isArray(config) ? config : [config];
    config.forEach((x) => { ensureRoute(x); });

    this.recognizer.add(config.map((x) => {path:x.route, handler: x}));
  }

  loadUrl(url){
    var results = this.recognizer.recognize(url);

    if(results.length){
      var first = results[0];

      this.queueInstruction({ 
        fragment:route, //might need to split query string...
        config:first.handler, 
        params:first.params, 
        queryParams:first.queryParams 
      });
    }else{
      //not found
    }
  }

  generate(name, params){
    return this.recognizer.generate(name, params);
  }

  queueInstruction(instruction){
    this.queue.unshift(instruction);
    this.dequeueInstruction();
  }

  dequeueInstruction(){
    if(this.isProcessing){
      return;
    }

    var instruction = this.queue.shift();
    this.queue = [];

    if (!instruction) {
        return;
    }

    this.isProcessing = true;

    var context = { 
      operation:'navigate',
      output: null,
      currentInstruction:this.currentInstruction, 
      prevInstruction:this.currentInstruction, 
      nextInstruction:instruction,
      router:this
    };

    var pipeline = new Pipeline();

    //what?

    pipeline.run(context).then((result) => {
      this.isProcessing = false;
      this.dequeueInstruction();
    });
  }
}
