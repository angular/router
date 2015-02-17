describe('componentLoader', function () {

  beforeEach(module('ngNewRouter'));

  it('should work', inject(function (componentLoader) {
    var component = componentLoader('foo');
    expect(component).toEqual({
      controllerName: 'FooController',
      template: './components/foo/foo.html'
    });
  }));

});
