angular.module('myApp.end', []).
  controller('EndController', ['answers', EndController]);

function EndController(answers) {
  this.answers = answers;
}

EndController.prototype.canActivate = function() {
  if(!this.answers.name) {
    return new Redirect('one');
  }

  if(!this.answers.quest) {
    return new Redirect('two');
  }

  if(!this.answers.favoriteColor) {
    return new Redirect('three');
  }

  return true;
};
