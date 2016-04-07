module.exports = {
  context: __dirname + '/tmp',
  entry: './angular-component-router.js',
  output: {
    path: __dirname + '/dist',
    pathInfo: true,
    filename: 'angular-component-router.js'
  },
  resolve: {
    root: __dirname + '/shims',
  },
  debug: true,
  devtool: 'source-map'
};