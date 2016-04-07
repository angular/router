function createOutlet($q, $animate) {
  function Outlet(router, scope, element, controller, $transclude) {
      this.router = router;
      this.scope = scope;
      this.element = element;
      this.controller = controller;
      this.$transclude = $transclude;
  }
  Outlet.prototype.cleanupLastView = function () {
    var _this = this;
    if (this.previousLeaveAnimation) {
      $animate.cancel(this.previousLeaveAnimation);
      this.previousLeaveAnimation = null;
    }
    if (this.currentScope) {
      this.currentScope.$destroy();
      this.currentScope = null;
    }
    if (this.currentElement) {
      this.previousLeaveAnimation = $animate.leave(this.currentElement);
      this.previousLeaveAnimation.then(function () { _this.previousLeaveAnimation = null; });
      this.currentElement = null;
    }
  };
  Outlet.prototype.reuse = function (instruction) {
    var next = $q.when(true);
    var previousInstruction = this.currentInstruction;
    this.currentInstruction = instruction;
    if (this.currentController && this.currentController.$routerOnReuse) {
      next = $q.when(
          this.currentController.$routerOnReuse(this.currentInstruction, previousInstruction));
    }
    return next;
  };
  Outlet.prototype.routerCanReuse = function (nextInstruction) {
    var result;
    if (!this.currentInstruction ||
        this.currentInstruction.componentType !== nextInstruction.componentType) {
      result = false;
    }
    else if (this.currentController && this.currentController.$routerCanReuse) {
      result = this.currentController.$routerCanReuse(nextInstruction, this.currentInstruction);
    }
    else {
      result = nextInstruction === this.currentInstruction ||
                angular.equals(nextInstruction.params, this.currentInstruction.params);
    }
    return $q.when(result);
  };
  Outlet.prototype.routerCanDeactivate = function (instruction) {
    if (this.currentController && this.currentController.$routerCanDeactivate) {
      return $q.when(
          this.currentController.$routerCanDeactivate(instruction, this.currentInstruction));
    }
    return $q.when(true);
  };
  Outlet.prototype.deactivate = function (instruction) {
    if (this.currentController && this.currentController.$routerOnDeactivate) {
      return $q.when(
          this.currentController.$routerOnDeactivate(instruction, this.currentInstruction));
    }
    return $q.when();
  };
  Outlet.prototype.activate = function (instruction) {
    var _this = this;
    this.previousInstruction = this.currentInstruction;
    this.currentInstruction = instruction;
    var componentName = this.controller.$$componentName = instruction.componentType;
    if (typeof componentName !== 'string') {
      throw new Error('Component is not a string for ' + instruction.urlPath);
    }
    this.controller.$$template = '<' + dashCase(componentName) + ' $router="::$$router"></' +
                                  dashCase(componentName) + '>';
    this.controller.$$router = this.router.childRouter(instruction.componentType);
    this.controller.$$outlet = this;
    var newScope = this.scope.$new();
    newScope.$$router = this.controller.$$router;
    this.deferredActivation = $q.defer();
    var clone = this.$transclude(newScope, function (clone) {
      $animate.enter(clone, null, _this.currentElement || _this.element);
      _this.cleanupLastView();
    });
    this.currentElement = clone;
    this.currentScope = newScope;
    return this.deferredActivation.promise;
  };
  return Outlet;
}

/**
 * @name ngOutlet
 *
 * @description
 * An ngOutlet is where resolved content goes.
 *
 * ## Use
 *
 * ```html
 * <div ng-outlet="name"></div>
 * ```
 *
 * The value for the `ngOutlet` attribute is optional.
 */
exports.ngOutletDirective = function($animate, $q, $rootRouter) {
  var Outlet = createOutlet($q, $animate);
  var rootRouter = $rootRouter;

  return {
    restrict: 'AE',
    transclude: 'element',
    terminal: true,
    priority: 400,
    require: ['?^^ngOutlet', 'ngOutlet'],
    link: function outletLink(scope, element, attrs, ctrls, $transclude) {
      var parentCtrl = ctrls[0], myCtrl = ctrls[1],
          router = (parentCtrl && parentCtrl.$$router) || rootRouter;
      myCtrl.$$currentComponent = null;
      router.registerPrimaryOutlet(new Outlet(router, scope, element, myCtrl, $transclude));
    },
    controller: function() {},
    controllerAs: '$$ngOutlet'
  };
};

/**
 * This directive is responsible for compiling the contents of ng-outlet
 */
exports.ngOutletFillContentDirective = function($compile) {
  return {
    restrict: 'EA',
    priority: -400,
    require: 'ngOutlet',
    link: function(scope, element, attrs, ctrl) {
      var template = ctrl.$$template;
      element.html(template);
      $compile(element.contents())(scope);
    }
  };
};



exports.routerTriggerDirective = function($q) {
  return {
    require: '^ngOutlet',
    priority: -1000,
    link: function(scope, element, attr, ngOutletCtrl) {
      var promise = $q.when();
      var outlet = ngOutletCtrl.$$outlet;
      var currentComponent = outlet.currentController =
          element.controller(ngOutletCtrl.$$componentName);
      if (currentComponent.$routerOnActivate) {
        promise = $q.when(currentComponent.$routerOnActivate(outlet.currentInstruction,
                                                             outlet.previousInstruction));
      }
      promise.then(outlet.deferredActivation.resolve, outlet.deferredActivation.reject);
    }
  };
};

function dashCase(str) {
  return str.replace(/[A-Z]/g, function(match) { return '-' + match.toLowerCase(); });
}