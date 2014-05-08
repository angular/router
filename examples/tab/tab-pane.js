import {ComponentDirective} from 'templating';

@ComponentDirective({
  selector: 'tab-pane',
  bind: {
    'selected': 'selected',
    'title': 'title'
  },
  shadowDOM: true,
  role: 'tabpane',
})
export class TabPane {
  constructor(node:Node) {
    this.selected = false;
    this.node = node;
  }
  attached() {
    console.log('attached', this.title, 'height:', this.node.getBoundingClientRect().height);
  }
  detached() {
    console.log('detached', this.title);
  }
  moved() {
    console.log('moved', this.title);
  }
}
