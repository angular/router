function createResult(ctx, next) {
  return {
    status: next.status,
    context: ctx,
    output: next.output,
    completed: next.status == COMPLETED
  };
}

export var COMPLETED = 'completed';
export var CANCELLED = 'cancelled';
export var REJECTED = 'rejected';
export var RUNNING = 'running';

export class Pipeline {
  constructor() {
    this.steps = [];
  }

  withStep(step) {
    var run;

    if (typeof step == 'function') {
      run = step;
    } else {
      run = step.run.bind(step);
    }

    this.steps.push(run);

    return this;
  }

  run(ctx) {
    var index = -1,
        steps = this.steps,
        next,
        currentStep;

    function next() {
      index++;

      if (index < steps.length) {
        currentStep = steps[index];

        try {
          return currentStep(ctx, next);
        } catch(e) {
          return next.reject(e);
        }
      } else {
        return next.complete();
      }
    };

    next.complete = () => {
      next.status = COMPLETED;
      return Promise.resolve(createResult(ctx, next));
    };

    next.cancel = (reason) => {
      next.status = CANCELLED;
      next.output = reason;
      return Promise.resolve(createResult(ctx, next));
    };

    next.reject = (error) => {
      next.status = REJECTED;
      next.output = error;
      return Promise.reject(createResult(ctx, next));
    };

    next.status = RUNNING;

    return next();
  }
}
