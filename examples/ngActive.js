import {DecoratorDirective} from 'templating';
import {Inject} from 'di';

@DecoratorDirective({
  selector: '[ng-active]',
  bind: {
    'ngActive': 'ngActive'
  },
  observe: {'ngActive': 'ngActiveChanged'}
})
export class NgActive {
  @Inject(Node)
  constructor(element) {
    this.element = element;
  }

  ngActiveChanged(value) {
    if (value) {
      this.element.classList.add('active');
    }else{
      this.element.classList.remove('active');
    }
  }
}