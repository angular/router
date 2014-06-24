export function isNavigationCommand(obj){
  return obj && typeof obj.navigate === 'function';
}

export class Redirect{
  constructor(url) {
    this.url = url;
    this.shouldContinueProcessing = false;
  }

  navigate(appRouter){
    (this.router || appRouter).navigate(this.url, { trigger: true, replace: true });
  }
}