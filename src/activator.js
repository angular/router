import Pipeline from './pipeline';

function handleOutput(context, output, onContinue){
  context.output = output;

  if(context.shouldContinue(output)){
    if(onContinue){
      onContinue(context);
    }

    return context.next();
  }else{
    return context.cancel();
  }
}

function invoke(target, method, context){
  if(Array.isArray(context.input)){
    target[method].apply(target, context.input);
  }

  return target[method](context.input);
}

function createFakeChild(){
  return {
    process(){
      return Promise.resolve({completed:true});
    }
  };
}

class Step{
  constructor(itemName, methodName, invokeChild=false, onContinue=null){
    this.itemName = itemName;
    this.methodName = this.name = methodName;
    this.invokeChild = invokeChild;
    this.onContinue = onContinue;
  }

  getChildActivator(context){
    if(!this.invokeChild){
      return createFakeChild();
    }

    return context.findChildActivator() || createFakeChild();
  }

  run(context){
    var childActivator = this.getChildActivator(context);

    return childActivator.process(this.methodName).then((result) => {
      if(!result.completed){
        context.output = result.output;
        return context.cancel();
      }

      var item = context[this.itemName];

      if(item && this.methodName in item){
        try{
          var value = invoke(item, this.methodName, context);

          Promise.all([value]).then((results) => {
            return handleOutput(context, results[0], this.onContinue);
          }).catch((e1) =>{
            return handleOutput(context, e1);
          });
        }catch(e2){
          return handleOutput(context, e2);
        }
      }

      return context.next();
    }
  }
}

export var canDeactivatePrevious = new Step('prevItem', 'canDeactivate', true);
export var canActivateNext = new Step('nextItem', 'canActivate');
export var deactivatePrevious = new Step('prevItem', 'deactivate', true);
export var activateNext = new Step('nextItem', 'activate', false, (context) => context.currentItem = context.nextItem);

export function processResult(context){
  return context.next().then((result) =>{
    if(result.completed && context.currentItem != context.prevItem){
      context.activator.current = context.currentItem;
    }

    return result;
  }).catch((e) =>{
    return handleOutput(context, e);
  });
}

export function shouldContinue(output){
  if(output instanceof Error){
    return false;
  }

  return output;
}

export function findChildActivator(context){
  if(context.currentItem){
    return context.currentItem.activator;
  }

  return null;
}

export class Activator{
  construtor(){
    this.current = null;
    this.shouldContinue = shouldContinue;
    this.findChildActivator = findChildActivator;
  }

  createContext(operation, input, nextItem){
    return { 
      operation:operation,
      input: input,
      output: null,
      currentItem:this.current, 
      prevItem:this.current, 
      nextItem:nextItem,
      activator:this,
      shouldContinue:this.shouldContinue,
      findChildActivator:this.findChildActivator
    };
  }

  setCurrentAndBypassLifecycle(current){
    this.current = current;
  }

  activate(item, input){
    var context = this.createContext('activate', input, item);
    var pipeline = new Pipeline()
      .withStep(processResult)
      .withStep(canDeactivatePrevious)
      .withStep(canActivateNext)
      .withStep(deactivatePrevious)
      .withStep(activateNext);

    return pipeline.run(context);
  }

  process(stepName, input){
    var context = this.createContext(stepName, input);
    var pipeline = new Pipeline();

    switch(stepName){
      case 'canDeactivate':
        pipeline.withStep(canDeactivatePrevious);
        break;
      case 'deactivate':
        pipeline.withStep(deactivatePrevious);
        break;
    }

    return pipeline.run(context);
  }
}
