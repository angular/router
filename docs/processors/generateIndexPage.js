"use strict";

var path = require('canonical-path');

/**
 * @dgProcessor generateIndexPageProcessor
 * @description
 * This processor creates a doc that will be rendered as the index page for the app
 */
module.exports = function generateIndexPageProcessor() {
  return {
    includeDocFn: function(doc) { return ['js', 'markdown', 'module'].indexOf(doc.docType) >= 0; },
    $runAfter: ['adding-extra-docs'],
    $runBefore: ['extra-docs-added'],
    $process: function(docs) {

      var includeDocFn = this.includeDocFn;

      // Collect up all the areas in the docs
      var docTypes = {};
      docs.forEach(function(doc) {
        if (includeDocFn(doc)) {
          docTypes[doc.docType] = docTypes[doc.docType] || [];
          docTypes[doc.docType].push(doc);
        }
      });

      var indexDoc = {
        docType: 'indexPage',
        docTypes: docTypes,
        id: 'index',
        aliases: ['index'],
        path: '/',
        outputPath: 'index.html'
      };

      docs.push(indexDoc);
    }
  };
};