import {PromiseBackend} from '../node_modules/deferred/src/PromiseMock';
import {Pipeline} from '../src/pipeline';

describe('Pipeline', () => {
  PromiseBackend.setGlobal(window);
  PromiseBackend.patchWithMock();

  it('should run even when there are not steps', () => {
    var pipeline = new Pipeline();
    var context = {};
    var resolved = false;

    pipeline.run(context).then((result) => {
      expect(result.completed).toBe(true);
    });

    PromiseBackend.flush(true);
  });
});
