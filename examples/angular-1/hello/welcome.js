angular.module('example.welcome', []).
    controller('WelcomeController', WelcomeController);

function WelcomeController() {
  this.heading = 'Welcome to the Angular 2.0 Router Demo!';
}
