var lang_1 = require('angular2/src/facade/lang');

function hasLifecycleHook(e, type) {
    if (!(type instanceof lang_1.Type))
        return false;
    return e.name in type.prototype;
}
exports.hasLifecycleHook = hasLifecycleHook;

function getCanActivateHook(directiveName) {
  // This is going to be monkey patched from inside
  // the routerFactory closure, because the implementation
  // will need access to $injector
}

exports.getCanActivateHook = getCanActivateHook;