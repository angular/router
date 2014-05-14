import {PromiseBackend} from '../node_modules/deferred/src/PromiseMock';
import {Pipeline} from '../src/pipeline';

describe('Pipeline', () => {
  PromiseBackend.setGlobal(window);
  PromiseBackend.patchWithMock();

  var pipeline,
      spy,
      context;

  beforeEach(() => {
    context = {};
    pipeline = new Pipeline();
  });

  it('should run even when there are not steps', () => {
    pipeline.run(context).then((result) => {
      expect(result.completed).toBe(true);
    });

    PromiseBackend.flush(true);
  });

  it('should pass the context to the step', () => {
    var step = mockStep();
    pipeline.withStep(step);
    pipeline.run(context).then((result) => {
      expect(result.completed).toBe(true);
    });

    expect(step.spy).toHaveBeenCalledWith(context);
  });


  it('should set the context to incomplete if a step cancels', () => {
    pipeline.withStep((context) => context.cancel()).
    run(context).catch((result) => {
      expect(result.completed).toBe(false);
      expect(result.status).toBe('rejected');
    });

    PromiseBackend.flush(true);
  });


  it('should set the context to incomplete if a step throws', () => {
    pipeline.withStep(() => {
      throw new Error('oops');
    }).
    run(context).catch((result) => {
      expect(result.completed).toBe(false);
      expect(result.status).toBe('rejected');
    });

    PromiseBackend.flush(true);
  });


  it('should delegate to the next step if the previous one cancels', () => {
    var firstStep = false;

    pipeline.
      withStep((context) => {
        firstStep = true;
        return context.next();
      }).
      withStep((context) => context.complete()).
      run(context).then((result) => {
        expect(firstStep).toBe(true);
        expect(result.completed).toBe(true);
        expect(result.status).toBe('completed');
      });

    PromiseBackend.flush(true);
  });



  function mockStep (name) {
    var spy = jasmine.createSpy(name ? (name + ' step') : 'step');
    return {
      run: (ctx) => {
        spy(ctx);
        return Promise.resolve();
      },
      name: name,
      spy: spy
    };
  }
});
