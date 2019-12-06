'use strict';

describe('Service: google0auth', function () {

  // load the service's module
  beforeEach(module('overtaskApp'));

  // instantiate service
  var google0auth;
  beforeEach(inject(function (_google0auth_) {
    google0auth = _google0auth_;
  }));

  it('should do something', function () {
    expect(!!google0auth).toBe(true);
  });

});
