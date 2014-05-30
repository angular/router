export function extend(obj) {
	var rest = Array.prototype.slice.call(arguments, 1);

	for (var i = 0, length = rest.length; i < length; i++) {
		var source = rest[i];

		if (source) {
			for (var prop in source) {
				obj[prop] = source[prop];
			}
		}
	}

	return obj;
}

export function getWildCardName(route){
  var wildcardIndex = route.lastIndexOf('*');
  return route.substr(wildcardIndex + 1);
}

export function getWildcardPath(route, params, qs) {
  var wildcardName = getWildCardName(route),
      path = params[wildcardName];

  if (qs) {
    path += "?" + qs;
  }

  return path;
}