export function Http() {
  return function(url) {
    return new Promise(function(resolve, reject) {
      var xhr = new XMLHttpRequest();

      xhr.open('GET', url, false);

      xhr.onreadystatechange = function() {
        if (xhr.readyState === 4) {  
          if (xhr.status === 200) {  
            resolve(JSON.parse(xhr.responseText));
          } else {  
            reject(new Error(xhr.statusText));  
          }  
        } 
      };

      xhr.send();
    });
  }
}