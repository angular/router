# Angular 2.0 Router

This is a prototype of a new router for Angular 2.0. Its feature set is based on the router used by Durandal. This router has been ported to ES6. It has also had bugs fixed from Durandal's router and a few new features have been added to faciliate greater flexibility. The internals of the router have been re-designed to use a customizable async pipeline. The screen activator has also had a similar re-design. Generally speaking, it allows for tons of customization at almost every point, understands basic conventions, has sensible defaults, etc.

> **Note:** This prototype should fullfill almost, if not all, the requirements mentioned in the Angular 2.0 router design doc.

## Setup

1. Install [NodeJS](http://nodejs.org/)
2. At the command prompt install [Gulp](http://gulpjs.com/) with `npm install -g gulp`
3. At the command promit install [Bower](http://bower.io/) with `npm install -g bower`
4. From the repo, install npm dependencies with `npm install`
5. From the repo, install bower dependencies with `bower install`

## Running the Samples

1. At the command prompt, start the development web server with `gulp build watch serve`
2. Open a browser and navigate to [http://localhost:8000/temp/examples/index.html](http://localhost:8000/temp/examples/index.html)

## Development

1. At the command prompt, install [Karma](http://karma-runner.github.io/) with `npm install -g karma`
2. At the command prompt, install the cli for [Karma](http://karma-runner.github.io/) with `npm install -g karma-cli`
3. At the command prompt, start karma with `karma start`
4. Add new tests to the `test` folder. Be sure to give them an extension of `.spec.js`.

### Code Style Guide

* Use 2 spaces as tab, see .editorconfig

## Features

* Simple json based config. Minimal config required, with reasonable convention-based fallbacks. All conventions are customizable. Multiple ways to cinfigure routes (object, arrays, strings, etc). Map multiple routes to the same controller as well.
* Router pattern maching is handled by [route-recognizer.js](https://github.com/tildeio/route-recognizer). This allows for static routes, named parameters, splats and query strings. Route generation is also supported.
* Handles push state and hash change.
* Automatic handling of "not found" routes. This can be customized easily. Simple convention-based routing can also be hooked in.
* Automatic construction of a "navigation model" which can be used to generate a navigation UI. Each item in the nav model has a link that can be bound. The link will properly generate hash/pushState urls and understands router hierarchies. Each item in the nav model has a property `isActive` which reflects whether or not it is the current active route (useful in styling a nav).
* The router can update the document title correctly (even with child routers). This is customizable.
* Has a fully customizable internal asynchronous pipeline. Want to add security? Just add a step to the pipeline and guard route access, cancel routing, redirect or allow navigation easily at any point. Want to automatically load model data based on route parameters and type annotations? Just add a step to the pipeline. Teach Angular about your app and let it do the work for you. The default steps in the pipeline are: SelectController, SelectView, ActivateInstruction, CompleteNavigation, DelegateToChildRouter.
* All async stuff uses promises, naturally.
* Handles "screen activator" patterns for controllers, allowing controller to allow/reject navigation into or out of a controller. Lifecycle hooks include: canActivate, activate, canDeactivate and deactivate. This is controlled by an activator which has its own async pipeline. Controllers can implement any or none of these hooks and can return promises or boolean values to control navigation. Controllers can also return other "primitives" understood by the router, such as a Redirect command object. You can also "teach" the activation mechanism about new primitives.
* The activator handles nested activator hierarchies for complex screen activation control among hierarchies of components.
* The router uses the activator mechanism to pass parameters to a controller. The canActivate and activate callbacks recieve the router parameters, parsed query string parameters and route config which they can use to control navigation or load model data. (This could be pushed in to the ctor by an injector as well, but that does't really work if you want to re-use a controller instance but need to give it new params.)
* The router automatically handles controller "re-use" but the developer can override this on a case by case basis, based on internal state or router parameter info.
* Supports n-levels of nested routers. This allows controllers to define sub-navigation and router hierarchies, completely encapsulating entire areas of an application if desired. This is important for large projects that are split across multiple teams.
* Supports intelligent controller re-use and activation/deactivation semantics in complex hierarchies of routers. (Completely customizable, of course, but with sensible defaults.)
* Public apis for route registration (in various forms), navigation to a url, navigating back and link generation. You can also completely reset the router and/or change routes dynamically at runtime in the root router or in any child router.
* The async pipeline pulls from an internal instruction queue which handles "overlapping" route requests common in async scenarios. Hooks provided to tap into the internal instruction data and control what the router is doing.
* Supports basic history manipulation for replacing with/without triggering activation.
* Integrated with DI. The DI is used to instantiate the controller when needed. It also sets symbols that relate to ChildRouters.
* Integrated with require.js for controller module loading.
* Integrated with templating for viewFactory loading, via require.js.
* Has a custom TemplateDirective `router-port` which serves as a composition site for the router's active view.

## To Do
* Tests!!! (Coming Soon)
