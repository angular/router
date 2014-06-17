export class ApplyModelBindersStep{
	run(navigationContext, next) {
		//look at each channel and determine if there's a custom binder to be used
		//to transform any of the lifecycleArgs

    //this needs to be done at each level...
    //chache across levels to avoid multiple loads of data, etc.

		return next();
	}
}
