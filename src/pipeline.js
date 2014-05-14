function createResult(context) {
  return {
    status: context.status,
    input: context.input,
    output: context.output,
    completed: context.status == 'completed'
  };
}

export class Pipeline {
  constructor() {
    this.steps = [];
    this.stepsByName = {};
  }

  withStep(step, name) {
    var run;

    if (typeof step == 'function') {
      run = step;
    } else {
      run = step.run.bind(step);
    }

    this.steps.push(run);

    name = name || step.name;
    if (name) {
      this.stepsByName[name] = run;
    }

    return this;
  }

  run(context) {
    var index = -1,
        steps = this.steps,
        next,
        currentStep;

    context.next = () => {
      index++;

      if (index < steps.length) {
        currentStep = steps[index];

        try {
          return currentStep(context);
        } catch(e) {
          return context.reject(e);
        }
      } else {
        return context.complete();
      }
    };

    context.complete = () => {
      context.status = 'completed';
      return Promise.resolve(createResult(context));
    };

    context.cancel = () => {
      context.status = 'cancelled';
      return Promise.resolve(createResult(context));
    };

    context.reject = (error) => {
      context.status = 'rejected';
      context.output = error;
      return Promise.reject(createResult(context));
    };

    context.status = 'running';
    return context.next();
  }
}