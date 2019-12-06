angular.module('overtaskApp').directive('otSuggestionList', function() {
    return {
        restrict: 'A',
       // require: '^task',
        //scope: {
        //    task: '@'
       // },
        templateUrl: 'views/partials/tabs/otsuggestionlist.html',
        //controller: ['$scope','$rootScope', function($scope,$rootScope) {
          //$scope.suggestions = $rootScope.suggestions;
        //}]
        };
    }
);