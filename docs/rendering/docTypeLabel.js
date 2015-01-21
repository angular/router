var path = require('canonical-path');

var LABELS = {
  markdown: 'Guide',
  js: 'API'
};

module.exports = {
  name: 'docTypeLabel',
  process: function(docType) {
    return LABELS[docType];
  }
};
