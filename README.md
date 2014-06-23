# Angular 2.0 Router

A new router for Angular 2.0, written in ES6.

This router's feature set is derived from Durandal's router, but the design and implementation are
very different.
Additionally, this router aims to fulfill the requirements mentioned in the[Angular 2.0 router design document](https://docs.google.com/document/d/1I3UC0RrgCh9CKrLxeE4sxwmNSBl3oSXQGt9g3KZnTJI).

The router's design is based around the idea of a customizable async pipeline and screen activator.
Generally speaking, the router allows for great customization at almost every point, understands basic conventions, and has sensible defaults.

## Setup

1. Install [NodeJS](http://nodejs.org/)
2. Install [Gulp](http://gulpjs.com/) with `npm install -g gulp`
3. Install [Bower](http://bower.io/) with `npm install -g bower`
4. Clone and `cd` into this repo.
5. From the repo, install npm dependencies with `npm install`
6. From the repo, install bower dependencies with `bower install`

## Running the Samples

1. Start the development server with `gulp build watch serve`
2. Open a browser and navigate to [http://localhost:8000/temp/examples/index.html](http://localhost:8000/temp/examples/index.html)

## Development

1. Install [Karma](http://karma-runner.github.io/) with `npm install -g karma`
2. Install the cli for [Karma](http://karma-runner.github.io/) with `npm install -g karma-cli`
3. Start karma with `karma start`
4. Add new tests to the `test` folder. Be sure to give them an extension of `.spec.js`.

### Code Style Guide

* Use 2 spaces as tab, see `.editorconfig`

## Features

* The core configuration of the router is based on a simple JavaScript data structure. Minimal config is required, with reasonable convention-based fallbacks. All conventions are customizable.
* A configuration DSL is provided on top of the raw config data structure to allow for fluent router configuration. There is no coupling from the router to the specific config DSL, so you can even create your own DSL as long as it can export to the simple underlying data structure of the router.
* Router pattern maching is handled by [route-recognizer.js](https://github.com/tildeio/route-recognizer). This allows for static routes, named parameters, splats and query strings. Route generation is also supported.
* The router can run in push state or hash change mode.
* "Not Found" routes are automatically handled. This can be customized easily. Simple convention-based routing can also be hooked in.
* Automatic construction of a "navigation model" which can be used to generate a navigation UI. Each item in the nav model has an href that can be data-bound. Href generation understands hash/pushState urls and router hierarchies. Each item in the nav model has a property `isActive` which reflects whether or not it is the current active route (useful in styling a nav).
* The router can update the document title correctly (even with child routers).
* The core off the router consists of a fully customizable internal asynchronous pipeline. Want to add security? Just add a step to the pipeline and guard route access, cancel routing, redirect or allow navigation easily at any point. Want to automatically load model data based on route parameters and type annotations? Just add a step to the pipeline. Teach Angular about your app and let it do the work for you.
* A consistent async programming model via promises is used throughout.
* The router understand the notion of "screen activation" for components, enabling them to allow/reject navigation into or out of a component. Lifecycle hooks include: canActivate, activate, canDeactivate and deactivate. Components can implement any or none of these hooks and can return promises or boolean values to control navigation. Components can also return other "primitives" understood by the router, such as a Redirect command object. You can also "teach" the activation mechanism about new primitives.
* The router uses the activator mechanism to pass parameters to a component. The canActivate and activate callbacks recieve the route parameters, parsed query string parameters and route config which they can use to control navigation or load model data.
* The router automatically handles component "re-use" but the developer can override this on a case by case basis, based on internal state or router parameter info.
* Supports n-levels of nested routers. This allows components to define sub-navigation and router hierarchies, completely encapsulating entire areas of an application if desired. This is important for large projects that are split across multiple teams.
* Supports intelligent component re-use and activation/deactivation semantics in complex hierarchies of routers. (Completely customizable, of course, but with sensible defaults.)
* There are public apis for route registration (in various forms), navigation to a url, navigating back and href generation. You can also completely reset the router and/or change routes dynamically at runtime in the root router or in any child router.
* The async pipeline pulls from an internal instruction queue which handles "overlapping" route requests common in async scenarios. There are hooks provided to tap into the internal instruction data and control what the router is doing.
* Basic history manipulation for replacing with/without triggering activation is supported.
* Fully integrated with DI. In particular, this helps set up child router scenarios.
* Full dynamic loading of components.
* Has a custom TemplateDirective `router-view-port` which serves as a composition site for the router's active component.
* Support sibling router view ports.

## To Do
* Tests!!! (Coming Soon)
