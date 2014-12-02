angular.module('myApp.two', []).
  controller('TwoController', ['answers', TwoController]);

function TwoController(answers) {
  this.answers = answers;
  this.question = 'What...is your quest?';
}

TwoController.prototype.canActivate = function () {
  if (!this.answers.name) {
    return new Redirect('one');
  }
  return true;
};
