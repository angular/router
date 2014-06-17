import {history} from './history';
import {extend} from './util';
import {Router} from './router';
import {Inject, Provide} from 'di';
import {PipelineProvider} from './pipelineProvider';
import {Redirect} from './redirect';

@Provide(Router)
@Provide(AppRouter)
export class AppRouter extends Router {
  @Inject(PipelineProvider)
  constructor(pipelineProvider) {
    super();
    this.pipelineProvider = pipelineProvider;
    document.addEventListener('click', handleLinkClick.bind(this), true);
  }

  loadUrl(url) {
    return this.createNavigationInstruction(url).then((instruction) => {
      if (instruction != null) {
        return this.queueInstruction(instruction);
      }
    });
  }

  queueInstruction(instruction) {
    return new Promise((resolve) => {
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
    var pipeline = this.pipelineProvider.build();

    pipeline.run(context).then((result) => {
      this.isNavigating = false;

      if (result.completed) {
        history.previousFragment = instruction.fragment;
      } else if (result.output instanceof Redirect) {
        this.navigate(result.output.url, { trigger: true, replace: true });
      } else if (context.prevInstruction) {
        this.navigate(history.previousFragment, false);
      }

      instruction.resolve(result);
      this.dequeueInstruction();
    });
  }

  activate(options) {
    if (this.isActive) {
      return;
    }

    this.isActive = true;
    this.options = extend({ routeHandler: this.loadUrl.bind(this) }, this.options, options);
    history.activate(this.options);
    this.dequeueInstruction();
  }

  deactivate() {
    this.isActive = false;
    history.deactivate();
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

  if (history._hasPushState) {
    if (!evt.altKey && !evt.ctrlKey && !evt.metaKey && !evt.shiftKey && targetIsThisWindow(target)) {
      var href = target.getAttribute('href');

      // Ensure the protocol is not part of URL, meaning its relative.
      // Stop the event bubbling to ensure the link will not cause a page refresh.
      if (href != null && !(href.charAt(0) === "#" || (/^[a-z]+:/i).test(href))) {
        evt.preventDefault();
        history.navigate(href);
      }
    }
  }
}

function targetIsThisWindow(target) {
  var targetWindow = target.getAttribute('target');

  if (!targetWindow ||
      targetWindow === window.name ||
      targetWindow === '_self' ||
      (targetWindow === 'top' && window === window.top)) {
      return true;
  }

  return false;
}

function reconstructUrl(instruction) {
  if (!instruction.queryString) {
    return instruction.fragment;
  }

  return instruction.fragment + '?' + instruction.queryString;
}
