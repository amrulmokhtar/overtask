'use strict';

describe('Service: pouch', function () {

  // load the service's module
  beforeEach(module('overtaskApp'));

  // instantiate service
  var pouch;
  beforeEach(inject(function (_pouch_) {
    pouch = _pouch_;
  }));

  it('should do something', function () {
    expect(!!pouch).toBe(true);
  });

});
