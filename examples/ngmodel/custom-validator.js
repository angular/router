import {DecoratorDirective} from 'templating';

@DecoratorDirective({
  selector: '[custom-validator]',
  role: 'validator'
})
export class CustomValidator {
  validate(value) {
    return value === 'secret';
  }
}
