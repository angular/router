export function extend(obj){
	var rest = slice.call(arguments, 1);

	for(var i = 0, length = rest.length; i < length; i++){
		var source = rest[i];

		if(source){
			for(var prop in source){
				obj[prop] = source[prop];
			}
		}
	}

	return obj;
}