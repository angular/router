# Component Router for Angular 1
[![Build Status](https://travis-ci.org/angular/router.svg?branch=master)](https://travis-ci.org/angular/router)

This project contains the Angular 1 bits and distribution for the Component Router.

The code exists in two parts:

* the core code, written in TypeScript, lives in the [Angular 2 repository](https://github.com/angular/angular)
* the shims, services and directives, specific to Angular 1, live in this repository

In addition this repository contains the tools for building the Component Router distribution files and docs for use in Angular 1 projects.

The core API is still changing, so don't use this in an important production app quite yet, unless you are happy to cope with breaking changes.

## Goals

This router aims to fulfill the requirements mentioned in the [Angular 2.0 router design document](https://docs.google.com/document/d/1I3UC0RrgCh9CKrLxeE4sxwmNSBl3oSXQGt9g3KZnTJI).

Below is a short summary of these goals:

* Have sensible conventions and defaults
* Be customizable at almost every point
* Support sibling "viewports" (like `ng-view`s in Angular 1.x's ngRoute)
* Support nested routers
  * Allow components to encapsulate entire parts of an application
* Expose a "navigation model" which can be used to generate a navigation UI (like menus)
  * Expose which route in the model is active (useful in styling/highlighting links in the menu)
* Generate `href`s based on router hierarchies
* Be able to reuse component instances
* Use either push state or hash change mode
* Handle updating the document title
* *Lazy-load components* (partial support)


## Prior Art

* [ngRoute from Angular 1.x](https://docs.angularjs.org/api/ngRoute)
* [UI Router from angular-ui](http://angular-ui.github.io/ui-router/site/)
* [Durandal Router](http://durandaljs.com/documentation/Using-The-Router.html)
* [Route Recognizer](https://github.com/tildeio/route-recognizer)


## License
MIT
