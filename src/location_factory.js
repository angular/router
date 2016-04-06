module.exports = function locationFactory($location, $rootScope) {
  var onNextHandlers = [];

  var location = {

    subscribe: function (onNext, onThrow, onReturn) {
      onNextHandlers.push(onNext);
      return {
        dispose: function() {
          var index = onNextHandlers.indexOf(onNext);
          onNextHandlers.splice(index, 1);
        }
      };
    },

    path: function () {
      return $location.url();
    },

    go: function (path, query) {
      return $location.url(path + query);
    }
  };

  $rootScope.$watch(function () { return $location.url(); }, function (url) {
    onNextHandlers.forEach(function(handler) { handler(url); });
  });

  return location;
};