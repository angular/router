import {DecoratorDirective} from 'templating';
import {Validator} from './validator';

@DecoratorDirective({
  selector: '[ng-model]',
  bind: {
    'value': 'value',
    'ngModelValid': 'ngModelValid'
  },
  observe: {
    'value': 'validate'
  },
  query: {
    'validator[]': 'validators'
  }
})
export class NgModel {
  constructor() {
    this.validators = [];
  }
  attached() {
    this.validate();
  }
  validate() {
    var valid = true;
    this.validators.forEach((validator) => {
      valid = valid && validator.validate(this.value);
    })
    this.ngModelValid = valid;
  }
}
