// This Location class is a direct replacement for the Location in the Angular 2 Router
// This version accepts the angular $location services as a dependency
function Location($location){

  this.subscribe = function () {
    //TODO: implement
  };

  this.path = function () {
    return $location.url();
  };

  this.go = function (path, query) {
    return $location.url(path + query);
  };
}

exports.Location = Location;
