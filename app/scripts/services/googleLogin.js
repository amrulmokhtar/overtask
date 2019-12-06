'use strict';

angular.module('overtaskApp')
	.service('googleLogin', ['$http', '$rootScope', '$q', function ($http, $rootScope, $q) {
    
	var clientId = '474430860380.apps.googleusercontent.com',
        apiKey = 'AIzaSyDBFmNasec0TuJoSxvR4vR2EYSvJfrw0Ss',
        scopes = 'https://www.googleapis.com/auth/userinfo.email https://www.google.com/m8/feeds',
        userEmail,
        deferred = $q.defer();

    this.login = function () {
        gapi.auth.authorize({ client_id: clientId, scope: scopes, immediate: false }, this.handleAuthResult);

        return deferred.promise;
    };

    this.handleClientLoad = function () {
        gapi.client.setApiKey("AIzaSyDBFmNasec0TuJoSxvR4vR2EYSvJfrw0Ss");
        gapi.auth.init(function () { });
        window.setTimeout(checkAuth, 1);
    };

    this.checkAuth = function() {
        gapi.auth.authorize({ client_id: clientId, scope: scopes, immediate: true}, this.handleAuthResult );
    };

    this.handleAuthResult = function(authResult) {
        if (authResult && !authResult.error) {
            var data = {};
            gapi.client.load('oauth2', 'v2', function () {
                var request = gapi.client.oauth2.userinfo.get();
                request.execute(function (resp) {
                    $rootScope.$apply(function () {
                        data.email = resp.email;
                    });
                });
            });
            deferred.resolve(data);
        } else {
            deferred.reject('error');
        }
    };

    this.handleAuthClick = function (event) {
        gapi.auth.authorize({ client_id: clientId, scope: scopes, immediate: false, hd: domain }, this.handleAuthResult );
        return false;
    };

}]);