var localConfig = {
  seleniumAddress: 'http://localhost:4444/wd/hub',
  capabilities: {
    'browserName': 'chrome'
  },
  specs: ['test.js'],
  jasmineNodeOpts: {
    showColors: true,
    defaultTimeoutInterval: 30000
  }
};

var travisWithSauceConfig = {
  capabilities: {
    'browserName': 'chrome',
    'version': '33',
    'platform': 'OS X 10.9',
    'name': 'Angular Templating',
    'tunnel-identifier': process.env.TRAVIS_JOB_NUMBER,
    'build': process.env.TRAVIS_BUILD_NUMBER,
    'chromedriver-version': 'https://raw.githubusercontent.com/angular/templating/custom-chromedriver-on-sauce/chromedriver/chromedriver_mac.zip'
  },
  sauceUser: process.env.SAUCE_USERNAME,
  sauceKey: process.env.SAUCE_ACCESS_KEY.split('').reverse().join(''),
  specs: ['test.js'],
  jasmineNodeOpts: {
    showColors: true,
    defaultTimeoutInterval: 30000
  }
};

exports.config = process.env.TRAVIS ? travisWithSauceConfig : localConfig;
