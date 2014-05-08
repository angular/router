// Do not wait for Angular (there is no Angular v1.x).
browser.ignoreSynchronization = true;

var SLEEP_INTERVAL = process.env.TRAVIS ? 3000 : 200;

// This finds elements inside a Shadow DOM.
// TODO(vojta): Make this generic, allow searching in nested components.
var inShadow = function(componentSelector, elementInsideComponentSelector) {
  return {
    findElementsOverride: function(driver, using) {
      return driver.findElements(by.js('return document.querySelector("' + componentSelector + '").webkitShadowRoot.querySelector("' + elementInsideComponentSelector + '")'));
    },
    message: elementInsideComponentSelector + ' inside ' + componentSelector
  };
};

describe('helloworld', function() {
  it('should greet the named user', function() {
    browser.get('http://localhost:8000/temp/examples/helloworld.html?compile_templates');
    browser.sleep(SLEEP_INTERVAL);

    var usernameInput = element(inShadow('exp-hello.ng-binder', '.username'));
    var message = element(inShadow('exp-hello.ng-binder', '.message'));

    expect(usernameInput.isPresent()).toBe(true);
    expect(message.getText()).toEqual('Hello everybody (0)')

    usernameInput.sendKeys('Vojta');
    browser.sleep(SLEEP_INTERVAL);
    expect(message.getText()).toEqual('Hello Vojta (0)');
  });
});

describe('helloworld with precompiled templates', function() {
  it('should greet the named user', function() {
    browser.get('http://localhost:8000/temp/examples/helloworld.html');
    browser.sleep(SLEEP_INTERVAL);

    var usernameInput = element(inShadow('exp-hello.ng-binder', '.username'));
    var message = element(inShadow('exp-hello.ng-binder', '.message'));

    expect(usernameInput.isPresent()).toBe(true);
    expect(message.getText()).toEqual('Hello everybody (0)');

    usernameInput.sendKeys('Vojta');
    browser.sleep(SLEEP_INTERVAL);
    expect(message.getText()).toEqual('Hello Vojta (0)');
  });
});
