# Contributing

This doc explains how to build this module yourself


## Setup

1. Install [NodeJS](http://nodejs.org/)
2. Install [Gulp](http://gulpjs.com/) with `npm install -g gulp`
3. Install [Bower](http://bower.io/) with `npm install -g bower`
4. Clone and `cd` into this repo.
5. Install dependencies with `npm install` and `bower install`


## Running the Examples

1. Start the development server with `gulp build watch serve`
2. Open a browser and navigate to [http://localhost:8000/temp/examples/index.html](http://localhost:8000/temp/examples/index.html)


## Development

1. Install [Karma](http://karma-runner.github.io/) with `npm install -g karma`
2. Install the cli for [Karma](http://karma-runner.github.io/) with `npm install -g karma-cli`
3. Start karma with `karma start`
4. Add new tests to the `test` folder. Be sure to give them an extension of `.spec.js`.

### Code Style Guide

* Use 2 spaces as tab, see `.editorconfig`
