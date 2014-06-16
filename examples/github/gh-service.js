import {Inject} from 'di';
import {Http} from '../http';

export class GhService {
  @Inject(Http)
  constructor(http) {
    this.http = http;
  }

  allIssues() {
    return this.http('https://api.github.com/repos/angular/angular.js/issues');
  }
  
  issue(id) {
    return this.http(`https://api.github.com/repos/angular/angular.js/issues/${id}`);
  }

  comments(issueId){
    return this.http(`https://api.github.com/repos/angular/angular.js/issues/${issueId}/comments`);
  }

  events(issueId){
    return this.http(`https://api.github.com/repos/angular/angular.js/issues/${issueId}/events`);
  }
}