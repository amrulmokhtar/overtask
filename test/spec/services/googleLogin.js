'use strict';

describe('Service: googleLogin', function () {

  // load the service's module
  beforeEach(module('overtaskApp'));

  // instantiate service
  var googleLogin;
  beforeEach(inject(function (_googleLogin_) {
    googleLogin = _googleLogin_;
  }));

  it('should do something', function () {
    expect(!!googleLogin).toBe(true);
  });

});
