# Lifecycle hooks

There are four main lifecycle hooks: `canActivate`, `activate`, and `canDeactivate`, and `deactivate`.

To understand how this works, let's step through a simple case where a component wants to navigate from one route to another.

## An example

```js
MyController(user, $http) {
  this.user = user;
  this.$http = $http;
  this.userDataPersisted = true;
}

MyController.prototype.updateUserName = function(newName) {
  var self = this;
  this.userDataPersisted = false;
  return this.user.setName(newName).then(function () {
    self.userDataPersisted = true;
  });
};

MyController.prototype.canActivate = function() {
  return this.user.isAdmin;
};

MyController.prototype.activate = function() {
  this.user.downloadBigFiles();
};

MyController.prototype.canDeactivate = function() {
  return this.userDataPersisted;
};
```

## Overview

This is the basic logic that the router uses when determining whether or not to activate

```dot
digraph G {
  node [shape=box, width=3, fontsize="12px"];
  splines=ortho;
  nodesep=0.50;

  {
    node[fontname="Helvetica", style=filled, fillcolor=grey90, peripheries=0];
    "complete navigation";
    "cancel navigation";
    "begin navigation";
  }

  {
    node [fontname="Courier"];
    "oldCtrl.canDeactivate()"
    "newCtrl = new Ctrl()"
    "newCtrl.canActivate()"
    "oldCtrl.deactivate()"
    "newCtrl.activate()"
  }

  "begin navigation"         -> "oldCtrl.canDeactivate()";
  "oldCtrl.canDeactivate()"  -> "newCtrl = new Ctrl()"     [label="true", weight=10, fontcolor=darkgreen];
  "oldCtrl.canDeactivate()"  -> "cancel navigation"        [fontcolor=red];

  "newCtrl = new Ctrl()"     -> "newCtrl.canActivate()"    [label="ok", weight=10, fontcolor=darkgreen];
  "newCtrl = new Ctrl()"     -> "cancel navigation"        [fontcolor=red];

  "newCtrl.canActivate()"    -> "oldCtrl.deactivate()"     [label="true", weight=10, fontcolor=darkgreen];
  "newCtrl.canActivate()"    -> "cancel navigation"        [fontcolor=red];

  "oldCtrl.deactivate()"     -> "newCtrl.activate()"       [weight=10];
  "oldCtrl.deactivate()"     -> "cancel navigation";

  "newCtrl.activate()"       -> "complete navigation"      [weight=10];
  "newCtrl.activate()"       -> "cancel navigation";

  { rank=same; "complete navigation"; "cancel navigation"; }
}
```


## Handling failure

What happens when a `canActivate` or `canDeactivate` returns `false`?

By default, this stops the navigation entirely.

<!--
TODO: show multiple levels
TODO:
-->


<!--
## Hooks in Multiple levels
TODO: show multi-level
-->
