import {extend} from './util';
import {History} from './history';
import {Router} from './router';
import {Inject, Provide} from 'di';
import {PipelineProvider} from './pipelineProvider';
import {isNavigationCommand} from './navigationCommand';

@Provide(Router)
@Provide(AppRouter)
export class AppRouter extends Router {
  @Inject(History, PipelineProvider)
  constructor(history, pipelineProvider) {
    super(history);

    this.pipelineProvider = pipelineProvider;
    document.addEventListener('click', handleLinkClick.bind(this), true);
  }

  loadUrl(url) {
    return this.createNavigationInstruction(url)
      .then(instruction => {
        return this.queueInstruction(instruction);
      }).catch(error =>{
        console.error(error);

        if (this.history.previousFragment) {
          this.navigate(this.history.previousFragment, false);
        }
      });
  }

  queueInstruction(instruction) {
    return new Promise(resolve => {
      instruction.resolve = resolve;
      this.queue.unshift(instruction);
      this.dequeueInstruction();
    });
  }

  dequeueInstruction() {
    if (this.isNavigating) {
      return;
    }

    var instruction = this.queue.shift();
    this.queue = [];

    if (!instruction) {
        return;
    }

    this.isNavigating = true;

    var context = this.createNavigationContext(instruction);
    var pipeline = this.pipelineProvider.createPipeline();

    pipeline.run(context).then(result => {
      this.isNavigating = false;

      if (result.completed) {
        this.history.previousFragment = instruction.fragment;
      }

      if (result.output instanceof Error) {
        console.error(result.output);
      }

      if (isNavigationCommand(result.output)) {
        result.output.navigate(this);
      } else if (!result.completed && this.history.previousFragment) {
        this.navigate(this.history.previousFragment, false);
      }

      instruction.resolve(result);
      this.dequeueInstruction();
    });
  }

  registerViewPort(viewPort, name) {
    super.registerViewPort(viewPort, name);

    if (!this.isActive) {
      this.activate();
    } else {
      this.dequeueInstruction();
    }
  }

  activate(options) {
    if (this.isActive) {
      return;
    }

    this.isActive = true;
    this.options = extend({ routeHandler: this.loadUrl.bind(this) }, this.options, options);
    this.history.activate(this.options);
    this.dequeueInstruction();
  }

  deactivate() {
    this.isActive = false;
    this.history.deactivate();
  }

  reset() {
    super.reset();
    this.queue = [];
    delete this.options;
  };
}

function handleLinkClick(evt) {
  if (!this.isActive) {
    return;
  }

  var target = evt.target;
  if (target.tagName != 'A') {
    return;
  }

  if (this.history._hasPushState) {
    if (!evt.altKey && !evt.ctrlKey && !evt.metaKey && !evt.shiftKey && targetIsThisWindow(target)) {
      var href = target.getAttribute('href');

      // Ensure the protocol is not part of URL, meaning its relative.
      // Stop the event bubbling to ensure the link will not cause a page refresh.
      if (href != null && !(href.charAt(0) === "#" || (/^[a-z]+:/i).test(href))) {
        evt.preventDefault();
        this.history.navigate(href);
      }
    }
  }
}

function targetIsThisWindow(target) {
  var targetWindow = target.getAttribute('target');

  return !targetWindow ||
      targetWindow === window.name ||
      targetWindow === '_self' ||
      (targetWindow === 'top' && window === window.top);
}