function OpaqueToken(desc) {
  this._desc = desc;
}

OpaqueToken.prototype.toString = function() {
  return 'Token ' + this._desc;
};

exports.OpaqueToken = OpaqueToken;
exports.Injectable = function() { return function() {}; };
exports.Inject = function() { return function() {}; };