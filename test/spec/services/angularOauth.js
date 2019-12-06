'use strict';

describe('Service: angularOauth', function () {

  // load the service's module
  beforeEach(module('overtaskApp'));

  // instantiate service
  var angularOauth;
  beforeEach(inject(function (_angularOauth_) {
    angularOauth = _angularOauth_;
  }));

  it('should do something', function () {
    expect(!!angularOauth).toBe(true);
  });

});
