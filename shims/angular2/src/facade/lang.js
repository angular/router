exports.Math = Math;

exports.CONST = function CONST() {
  return (function(target) {
    return target;
  });
};

exports.CONST_EXPR = function CONST_EXPR(expr) {
  return expr;
};

exports.isPresent = function isPresent (x) {
  return !!x;
};

exports.isBlank = function isBlank (x) {
  return !x;
};

exports.isString = function isString(obj) {
  return typeof obj === 'string';
};

exports.isType = function isType (x) {
  return typeof x === 'function';
};

exports.isStringMap = function isStringMap(obj) {
  return typeof obj === 'object' && obj !== null;
};

exports.isArray = function isArray(obj) {
  return Array.isArray(obj);
};

exports.getTypeNameForDebugging = function getTypeNameForDebugging (fn) {
  return fn.name || 'Root';
};

exports.RegExpWrapper = {
  create: function(regExpStr, flags) {
    flags = flags ? flags.replace(/g/g, '') : '';
    return new RegExp(regExpStr, flags + 'g');
  },
  firstMatch: function(regExp, input) {
    regExp.lastIndex = 0;
    return regExp.exec(input);
  },
  matcher: function (regExp, input) {
    regExp.lastIndex = 0;
    return { re: regExp, input: input };
  }
};



exports.StringWrapper = {
  charCodeAt: function(s, i) {
    return s.charCodeAt(i);
  },

  equals: function (s1, s2) {
    return s1 === s2;
  },

  split: function(s, re) {
    return s.split(re);
  },

  replaceAll: function(s, from, replace) {
    return s.replace(from, replace);
  },

  replaceAllMapped: function(s, from, cb) {
    return s.replace(from, function(matches) {
      // Remove offset & string from the result array
      matches.splice(-2, 2);
      // The callback receives match, p1, ..., pn
      return cb.apply(null, matches);
    });
  },

  contains: function(s, substr) {
    return s.indexOf(substr) != -1;
  }

};