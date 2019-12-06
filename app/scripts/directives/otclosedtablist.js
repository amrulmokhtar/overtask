angular.module('overtaskApp').directive('otClosedTabList', function() {
    return {
        restrict: 'A',
       // require: '^task',
        //scope: {
        //    task: '@'
       // },
        
        controller: ['$scope','tasktabmanager', function($scope,tasktabmanager) {
          $scope.closedtablimit =10;
        }],  
        templateUrl: 'views/partials/tabs/closedtablist.html'
               };
    }
);