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
  if(Array.isArray(context.nextInput)){
    target[method].apply(target, context.nextInput);
  }

  return target[method](context.nextInput);
}

function createFakeChild(){
  return {
    process(){
      return Promise.resolve({completed:true});
    }
  };
}

function shouldContinue(output){
  if(output instanceof Error){
    return false;
  }

  if(output === Object(output)){
    output = output.next || false;
  }

  if(typeof output == 'string'){
    return affirmations.indexOf(value.toLowerCase()) !== -1;
  }

  return output;
}

function findChildActivator(context){
  if(context.currentItem){
    return context.currentItem.activator;
  }

  return null;
}

function areSameItem(context) {
  return context.currentItem == context.nextItem;
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

          return Promise.all([value]).then((results) => {
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
export var activateNext = new Step('nextItem', 'activate', false, (context) => {
  context.currentItem = context.nextItem;
  context.currentInput = context.nextInput;
});

export function processResult(context){
  return context.next().then((result) =>{
    if(result.completed && context.currentItem != context.prevItem){
      context.activator.current = context.currentItem;
      context.activator.currentInput = context.currentInput;
    }

    return result;
  }).catch((err) =>{
    return handleOutput(context, err);
  });
}

export function equivalenceCheck(context){
  if(context.areSameItem(context)){
    return context.complete();
  }

  return context.next();
}

export var affirmations: ['yes', 'ok', 'true'];

export class Activator{
  construtor(options){
    this.current = null;
    this.currentInput = null;
    this.shouldContinue = options.shouldContinue || shouldContinue;
    this.findChildActivator = options.findChildActivator || findChildActivator;
    this.areSameItem = options.areSameItem || areSameItem;
  }

  createContext(operation, nextInput, nextItem){
    return { 
      operation:operation,
      prevInput: this.currentInput,
      currentInput: this.currentInput,
      nextInput: nextInput,
      output: null,
      currentItem:this.current, 
      prevItem:this.current, 
      nextItem:nextItem,
      activator:this,
      shouldContinue:this.shouldContinue,
      findChildActivator:this.findChildActivator,
      areSameItem:this.areSameItem
    };
  }

  setCurrentAndBypassLifecycle(current){
    this.current = current;
  }

  activate(item, input){
    var context = this.createContext('activate', input, item);
    var pipeline = new Pipeline()
      .withStep(processResult)
      .withStep(equivalenceCheck)
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