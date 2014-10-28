# Angular 2.0 Router

A new router for Angular 2.0, written in ES6.

This router's feature set is derived from Durandal's router, but the design and implementation are
very different.
Additionally, this router aims to fulfill the requirements mentioned in the [Angular 2.0 router design document](https://docs.google.com/document/d/1I3UC0RrgCh9CKrLxeE4sxwmNSBl3oSXQGt9g3KZnTJI).

The router's design is based around the idea of a customizable async pipeline and screen activator.
Generally speaking, the router allows for great customization at almost every point, understands basic conventions, and has sensible defaults.


## Setup

1. Install [NodeJS](http://nodejs.org/)
2. Install [Gulp](http://gulpjs.com/) with `npm install -g gulp`
3. Install [Bower](http://bower.io/) with `npm install -g bower`
4. Clone and `cd` into this repo.
5. From the repo, install npm dependencies with `npm install`
6. From the repo, install bower dependencies with `bower install`


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


## Features

* Supports sibling router "view ports" (think `ng-view`s in Angular 1.x).

* Supports nested routers. This allows components to define sub-navigation and router hierarchies, completely encapsulating entire areas of an application if desired. This is important for large projects that are split across multiple teams.

* Exposes a "navigation model" which can be used to generate a navigation UI (think menus).
  * Each item in the nav model has an href that can be data-bound. `href` generation understands hash/pushState urls and router hierarchies.
  * Each item in the nav model has a property `isActive` which reflects whether or not it is the current active route (useful in styling a nav).

* Provides a `router-view-port` TemplateDirective which serves as a composition site for the router's active component.

* Can lazy-load components.

* Can reuse component instances, even in complex hierarchies of routers. You can override the reuse behavior based on internal state or route parameters.

* The router can run in push state or hash change mode.
* Handles updating the document title (even with child routers).

## Configuration

The router config is based on a Plain Old JavaScript Object:

```javascript
router.configure(config => {
  config.map([
    { pattern: ['', 'intro'],   componentUrl: 'intro' },
    { pattern: 'one',           componentUrl: 'one',   nav: true, title: 'Question 1' },
    { pattern: 'two',           componentUrl: 'two',   nav: true, title: 'Question 2' },
    { pattern: 'three',         componentUrl: 'three', nav: true, title: 'Question 3' },
    { pattern: 'end',           componentUrl: 'end' },
  ]);
});
```

* The router also provides a configuration DSL on top of the raw config object.
* The router and config DSL are decoupled, so you can create your own DSL.
* Reasonable, convention-based fallbacks. All conventions are customizable. "Not Found" routes are automatically handled. Simple convention-based routing can also be hooked in.

* Customizable internal asynchronous pipeline.
  * Want to add authentication? Just add a step to the pipeline that guards route access, cancel routing, redirect or allow navigation easily at any point.
  * Want to automatically load model data based on route parameters and type annotations? Just add a step to the pipeline.




## Implementation Details

* Uses the [route-recognizer.js](https://github.com/tildeio/route-recognizer) library to match routes. This allows for static routes, named parameters, splats and query strings.

* Uses a consistent async programming model with promises.

* The async pipeline pulls from an internal instruction queue which handles "overlapping" route requests common in async scenarios. There are hooks provided to tap into the internal instruction data and control what the router is doing.

* Fully integrated with DI. In particular, this helps set up child router scenarios.

* Supports manipulating history for replacing, with or without triggering a route activation.

### Screen Activator

TODO: explain screen activator

The router understands the notion of "screen activation" for components, enabling them to allow/reject navigation into or out of a component.

* Lifecycle hooks include: `canActivate`, `activate`, `canDeactivate` and `deactivate`.
* These hooks understand promises, as well as a few other "primitives" (for instance a `Redirect` command object).
* You can "teach" the activation mechanism about new primitives.
* The router uses the activator mechanism to pass parameters to a component. The `canActivate` and `activate` callbacks recieve the route parameters, parsed query string parameters and route config which they can use to control navigation or load model data.


## To Do
* Tests!!! (Coming Soon)
