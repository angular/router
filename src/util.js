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

export function getWildCardName(pattern) {
  var wildcardIndex = pattern.lastIndexOf('*');
  return pattern.substr(wildcardIndex + 1);
}

export function getWildcardPath(pattern, params, qs) {
  var wildcardName = getWildCardName(pattern),
      path = params[wildcardName];

  if (qs) {
    path += "?" + qs;
  }

  return path;
}
