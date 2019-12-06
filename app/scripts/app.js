'use strict';


var _gaq = _gaq || [];
_gaq.push(['_setAccount', localStorage.getItem('trackingcode')]);
//_gaq.push(['_trackPageview']);

(function() {
  var ga = document.createElement('script'); ga.type = 'text/javascript'; ga.async = true;
  ga.src = 'https://ssl.google-analytics.com/ga.js';
  var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(ga, s);
})();
  
angular.module('overtaskApp', ['ngRoute','ui.bootstrap','wu.masonry','angulartics', 'angulartics.google.analytics'])//,'$strap.directives','wu.masonry','masonry','wu.masonry'
  .config(function ($routeProvider) {
    $routeProvider
      .when('/', {
        templateUrl: 'views/overtask.html',
        controller: 'MainCtrl'
      })
      .when('/task', {
        templateUrl: 'views/workingtask.html',
        controller: 'TaskCtrl'
      })
      .when('/tab', {
        templateUrl: 'views/launchTab.html',
        controller: 'LaunchTabCtrl'
      })
      .otherwise({
        redirectTo: '/'
      });
  });

angular.module('overtaskApp').value('$strapConfig', {
  datepicker: {
    language: 'en',
    format: 'd M, yyyy'
  }
});

angular
.module('overtaskApp').run(function($rootScope, $templateCache) {
  $rootScope.$on('$viewContentLoaded', function() {
     $templateCache.removeAll();
  });
});