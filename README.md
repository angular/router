# Component Router
[![Build Status](https://travis-ci.org/angular/router.svg?branch=master)](https://travis-ci.org/angular/router)

A new router for Angular 1.5 and 2.0, written with [TypeScript](http://www.typescriptlang.org/).

## State of this project

For now, the code has been moved to [angular/angular](https://github.com/angular/angular).
APIs are still rapidly changing, so I don't recommend using this in an important production app quite yet.

See the [Angular Weekly Meeting Notes](https://docs.google.com/document/d/150lerb1LmNLuau_a_EznPV1I1UHMTbEl61t4hZ7ZpS0/edit#heading=h.5kbngfq9twyj) for updates.

---

**NOTE:** Everything below is out-of-date, but left for posterity.

### Trying the router

You can install the router via `npm`:

```shell
npm install angular-new-router
```

The documentation is pretty sparse. See the `examples/` directory in this repo for now.

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
* Lazy-load components
* Be able to reuse component instances
* Use either push state or hash change mode
* Handle updating the document title


## Prior Art

* [Durandal Router](http://durandaljs.com/documentation/Using-The-Router.html)
* [ngRoute from Angular 1.x](https://docs.angularjs.org/api/ngRoute)
* [Route Recognizer](https://github.com/tildeio/route-recognizer)



## License
Apache 2
