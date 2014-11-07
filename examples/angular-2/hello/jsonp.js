export function Jsonp() {
  return function(url) {
    return new Promise(function(resolve, reject) {
      var callbackName = 'jsonp_callback_' + Math.round(100000 * Math.random());
      window[callbackName] = function(data) {
          delete window[callbackName];
          document.body.removeChild(script);
          resolve(data);
      };

      var script = document.createElement('script');
      script.src = url + (url.indexOf('?') >= 0 ? '&' : '?') + 'jsoncallback=' + callbackName;
      document.body.appendChild(script);
    });
  }
}