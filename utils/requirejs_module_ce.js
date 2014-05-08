/*
 * Polyfill for <module src="..."> that loads a module via requirejs.
 *
 * Usage: <script type="module" is="requirejs-module" src="path"></script>
 * The element will be decorated with the property "promise" that will resolve
 * to the loaded module.
 */
(function() {
  var ScriptModuleProto = Object.create(HTMLScriptElement.prototype);
  var modulePromises = {};
  var nextId = 0;

  document.modules = [];

  // TODO: Somehow we can't store the promise on the node.
  // This only occurs some times, e.g. when adding a breakpoint this is fine!
  Object.defineProperty(ScriptModuleProto, 'promise', {
    get: function() {
      return modulePromises[this.getAttribute('load-id')];
    }
  });

  ScriptModuleProto.load = function(ownerDocument, moduleId) {
    var a = ownerDocument.createElement('a');
    a.href = moduleId;
    var moduleUrl = getRelativeUrl(a.href, window.location.href);
    return new Promise(function(resolve) {
      require([moduleUrl], function(module) {
        resolve(module);
      });
    });
  };

  // Use the createdCallback and not the attachedCallback
  // as attached is never called for modules in html imports!
  ScriptModuleProto.createdCallback = function() {
    var promise = this.load(this.ownerDocument, this.getAttribute('src'));
    var id = nextId++;
    this.setAttribute('load-id', id);
    modulePromises[id] = promise;
    document.modules.push(promise);
  };

  window.HTMLScriptModuleElement = document.registerElement('rjs-module', {
    prototype: ScriptModuleProto
  });

  function getRelativeUrl(src, base) {
    var srcSlashParts = src.split('/');
    var baseSlashParts = base.split('/');
    var res = [];
    for (i=0; i<Math.min(srcSlashParts.length, baseSlashParts.length); i++) {
      var srcPart = srcSlashParts[i];
      var basePart = baseSlashParts[i];
      if (srcPart !== basePart) {
        break;
      }
    }
    var count = baseSlashParts.length - i - 1;
    while (count>0) {
      res.push('..');
      count--;
    }
    while (i<srcSlashParts.length) {
      res.push(srcSlashParts[i]);
      i++;
    }
    return res.join('/');
  }
})();
