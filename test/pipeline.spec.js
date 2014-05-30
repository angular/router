import {PromiseBackend} from '../node_modules/deferred/src/PromiseMock';
import {Pipeline, COMPLETED, REJECTED, CANCELLED} from '../src/pipeline';

describe('Pipeline', () => {
  var pipeline,
      spy,
      context;

  beforeEach(() => {
    context = {};
    pipeline = new Pipeline();
  });

  it('should run even when there are not steps', async function() {
    var result  = await pipeline
      .run(context);

    expect(result.completed).toBe(true);
  });

  it('should pass the context to the step', async function() {
    var step = mockStep();

    var result = await pipeline
      .withStep(step)
      .run(context);

    expect(result.completed).toBe(true);
    expect(step.spy).toHaveBeenCalledWith(context);
  });

  it('should set the context to CANCELLED if a step cancels', async function() {
    var result = await pipeline
      .withStep((ctx, next) => next.cancel())
      .run(context);

    expect(result.completed).toBe(false);
    expect(result.status).toBe(CANCELLED);
  });

  it('should set the context to REJECTED if a step throws', async function() {
    var result = await pipeline
      .withStep(() => { throw new Error('oops'); })
      .run(context);

    expect(result.completed).toBe(false);
    expect(result.status).toBe(REJECTED);
  });

  it('should move to the next step if the current one calls next', async function() {
    var firstStep = false;

    var result = await pipeline.withStep((ctx, next) => {
        firstStep = true;
        return next();
      })
      .withStep((ctx, next) => next.complete())
      .run(context);

    expect(firstStep).toBe(true);
    expect(result.completed).toBe(true);
    expect(result.status).toBe(COMPLETED);
  });

  function mockStep () {
    var spy = jasmine.createSpy('step');

    return {
      run: (ctx, next) => {
        spy(ctx);
        return next();
      },
      spy: spy
    };
  }
});