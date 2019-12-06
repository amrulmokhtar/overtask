angular.module('overtaskApp').directive('otTaskfilter', function () {
  return {
    templateUrl: 'views/partials/tasks/taskfilter.html',
    controller: ['$scope','$analytics','$filter', 'taskmanager', function ($scope,$analytics,$filter, taskmanager) {


      $scope.filtertypes = taskmanager.filtertypes;
      $scope.sorts = taskmanager.sorts;
      //$scope.selfilter = $scope.filtertypes[0];
      $scope.filterset = taskmanager.filterset;
      $scope.orderby = taskmanager.orderby;
      $scope.searchstring = taskmanager.searchstring;
      
      $scope.setFilter = function(id){
        $scope.filterset = taskmanager.filtertypes[id];
        taskmanager.filterset = taskmanager.filtertypes[id];
        localStorage.setItem('filterid', id);
      };
      
      $scope.cleanTrash = taskmanager.cleanTrash;
      
      $scope.trackFilter = function(filtername){
        $analytics.eventTrack('filter', {  category: 'taskmanagepageevent', label: filtername });

      };
      
      $scope.trackSort = function(id){
        taskmanager.orderby = $scope.orderby;
        localStorage.setItem('orderbyid',$scope.orderby[2]);
        $analytics.eventTrack('sort', {  category: 'taskmanagepageevent', label: $scope.orderby });
      };
    }]
  };
});