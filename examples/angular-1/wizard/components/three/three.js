
angular.module('myApp.three', []).
  controller('ThreeController', ['answers', ThreeController]);

function ThreeController(answers) {
  this.answers = answers;
  this.question = 'What...is your favorite color?';
}

ThreeController.prototype.canActivate = function () {
  if (!this.answers.name) {
    return new Redirect('one');
  }
  if (!this.answers.quest) {
    return new Redirect('two');
  }
  return true;
};
