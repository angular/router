# Architecture

This is a rough WIP notes doc.


## Child Routers

* useful for "settings"
* enterprise apps



## Pipeline

- kinda like middleware

1. select controller
  - ask current controller if it can
1. select view
1. activate instruction
  - can do scaffolding (maybe)

redirects:
- how do we handle circular requests?



## "Screen Activator"

- prevent to/from a "screen" (view/viewport)
- "separate query from command" (can I versus how do I navigate)
- helpful abstraction for heirarchies
  - think "master->detail"
  - 3 levels of routers



## Error handling


[screen conductor]: http://caliburnmicro.codeplex.com/wikipage?title=Screens%2c%20Conductors%20and%20Composition&referringTitle=Documentation
[screen activator]: http://codebetter.com/jeremymiller/2009/09/07/screen-activator-pattern/
