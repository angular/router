exports.PromiseWrapper = {
  // This is going to be monkey patched from inside
  // the routerFactory closure, because the implementation
  // will need access to $q
};

exports.EventEmitter = function EventEmitter() {
  //TODO: implement?
  // I think it's too heavy to ask 1.x users to bring in Rx for the router...
};

exports.ObservableWrapper = {
  callNext: function(ob, val) {
    ob.fn(val);
  },
  callEmit: function(ob, val) {
    ob.fn(val);
  },
  callError: function(ob, val) {
    ob.errorFn && ob.errorFn(val);
  },

  subscribe: function(ob, fn, errorFn) {
    ob.fn = fn;
    ob.errorFn = errorFn;
  }
};