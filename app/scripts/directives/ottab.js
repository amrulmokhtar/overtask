angular.module('overtaskApp').directive('otTab', function() {
    return {
        restrict: 'A',
       // require: '^task',
        //scope: {
        //    task: '@'
       // },
        templateUrl: 'views/partials/tabs/ottab.html',
        controller: ['$scope','$analytics','$modal','tasktabmanager', function($scope,$analytics,$modal, tasktabmanager) {
          
          $scope.reopenTab = function(tab){
            $analytics.eventTrack('reopenTab', {  category: 'tabmanagepageevent', label: $scope.task.name+';'+$scope.task.category });
            tasktabmanager.reopen(tab);
          };
          $scope.removeTab = function(tab,array){
            $analytics.eventTrack('removeTab', {  category: 'tabmanagepageevent', label: $scope.task.name+';'+$scope.task.category });
            tasktabmanager.close(tasktabmanager,tab,array)};
          
          $scope.switchTo = function(tab){
              $analytics.eventTrack('switchToTab', {  category: 'tabmanagepageevent', label: $scope.task.name+';'+$scope.task.category });
            tasktabmanager.switchTo(tab);
          };
          

        }]
        
    };});