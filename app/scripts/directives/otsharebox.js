angular.module('overtaskApp').directive('otShareBox', function() {
    return {
        restrict: 'A',
       // require: '^task',
        //scope: {
        //    task: '@'
       // },
        templateUrl: 'views/partials/tabs/otsharebox.html',
        controller: ['$scope','taskmanager', '$modal', function($scope, taskmanager, $modal) {
          $scope.share = taskmanager.share;

          
        }]
        };
    }
);