var PromiseWrapper = {
    resolve: function (reason) {
      return PromiseWrapper.$q.when(reason);
    },

    reject: function (reason) {
      return PromiseWrapper.$q.reject(reason);
    },

    catchError: function (promise, fn) {
      return promise.then(null, fn);
    },
    all: function (promises) {
      return PromiseWrapper.$q.all(promises);
    }
};

function EventEmitter() {
  //TODO: implement?
  // I think it's too heavy to ask 1.x users to bring in Rx for the router...
}

var ObservableWrapper = {
  callNext: function(ob, val) {
    ob.fn(val);
  },
  callEmit: function(ob, val) {
    ob.fn(val);
  },
  callError: function(ob, val) {
    if (ob.errorFn) ob.errorFn(val);
  },

  subscribe: function(ob, fn, errorFn) {
    ob.fn = fn;
    ob.errorFn = errorFn;
  }
};

module.exports = {
  PromiseWrapper: PromiseWrapper,
  EventEmitter: EventEmitter,
  ObservableWrapper: ObservableWrapper
};