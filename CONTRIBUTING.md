# Contributing

This doc explains how to build the router module yourself

## Releases

Releases of this module live in the `dist` directory. Releases (tagged `vx.y.z`) of this module published on npm
or will have up-to-date build artifacts checked in.

## Setup

1. Install [NodeJS](http://nodejs.org/)
2. Install [Gulp](http://gulpjs.com/) with `npm install -g gulp`
3. Clone and `cd` into this repo.
4. Install dependencies with `npm install` and `bower install`


## Running the Examples

1. Start the development server with `gulp build watch serve`
2. Open a browser and navigate to [http://localhost:8000/temp/examples/index.html](http://localhost:8000/temp/examples/index.html)


## Development

1. Install [Karma](http://karma-runner.github.io/) with `npm install -g karma`
2. Install the cli for [Karma](http://karma-runner.github.io/) with `npm install -g karma-cli`
3. Start karma with `karma start`
4. Add new tests to the `test` folder. Be sure to give them an extension of `.spec.js`.

## Code Style Guide

* Use 2 spaces as tab, see `.editorconfig`
