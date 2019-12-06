angular.module('overtaskApp').directive('otTaskCard', function () {
  return {
    restrict: 'A',
    templateUrl: 'views/partials/tasks/taskcard.html',
    controller:['$scope','$analytics','$modal','$log','$filter','taskmanager', 'tasktabmanager',
        function($scope,$analytics,$modal,$log,$filter,taskmanager, tasktabmanager){
      $scope.openEdit = function () {
        $analytics.eventTrack('editTaskfromTaskCard', {  category: 'taskmanagepageevent', label: $scope.task.name });
        var modalInstance = $modal.open({
          templateUrl: 'views/partials/modals/edittask.html',
          backdrop:'static',
          controller:['$scope', '$modalInstance', function ($scope, $modalInstance) {

          if($scope.task.duedate && $scope.task.duedate != 'Invalid Date'){
            $scope.task.duedate = new Date($scope.task.duedate).toString();
            //$scope.task.duedate = $filter('date')(task.duedate,'yyyy-MM-dd');
          }
          $scope.task.duedate = new Date($scope.task.duedate);
          $scope.task.duedate = $filter('date')($scope.task.duedate,'yyyy-MM-dd');
          $scope.scheduleddatedate = new Date($scope.task.scheduleddate).toString();
            var oldtaskscope = angular.copy($scope.task);
            $scope.ok = function (task) {
              //console.log($scope)
              $analytics.eventTrack('commitEditTaskfromTaskCard', {  category: 'taskmanagepageevent', label: $scope.task.name });
              

              //task.scheduleddate = new Date(task.scheduleddatedate).toString();
              if(task.name && task.name!=''){
                taskmanager.save(task);
                $modalInstance.dismiss('cancel');
              }else{
                alert('Task name cannot be empty');
              }
              //$scope.$parent.$parent.isCollapsed = false;
            };
//FIXME make sure the scope shows the correct version
            $scope.cancel = function (task) {
              $analytics.eventTrack('cancelEditTaskfromTaskCard', {  category: 'taskmanagepageevent', label: $scope.task.name });
              //$log.debug(oldtaskscope)
              task.description = '';
              for(prop in oldtaskscope){
                if (oldtaskscope.hasOwnProperty(prop)) {
                  task[prop] = oldtaskscope[prop];
                }
              }
              taskmanager.save(task);
              $modalInstance.dismiss('cancel');
              //$scope.$parent.$parent.isCollapsed = false;
            };
          }],
          scope: $scope
        });
      };
      
      $scope.tabstoadd = [];
      $scope.addTabtoAdd= function(tab,mark){
        mark = mark || false;
       //console.log("adding to addtabs",mark)
        if(!tab.addselected || mark == true){
          $analytics.eventTrack('addingSingleTabFromTabAdder', {  category: 'taskmanagepageevent', label: $scope.task.name });

          $scope.tabstoadd.push(tab);
          tab.addselected = true;
        }else{
          $analytics.eventTrack('removingSingleTabFromTabAdder', {  category: 'taskmanagepageevent', label: $scope.task.name });

          $scope.tabstoadd.splice($scope.tabstoadd.indexOf(tab),1);
          tab.addselected = false;
        }
      };
      
      $scope.filterNotAlreadyAdded = function(item) {
        var existingtabs = $scope.task.tabs.filter(function(element,index,array){
         ////console.log(element.url, item.url)
          return(element.url == item.url);
        });
        //console.log('notadded')
        //console.log( )
        if(existingtabs.length == 0){
         ////console.log('item is not added because exists='+existingtabs.length)
          return true;
        }else{
         ////console.log('item is added because exists='+existingtabs.length)
          return false;
        }
        
      };
      
      $scope.currentlyopen = function(item){
        //console.log(item)
        var storageobj = JSON.parse(localStorage.getItem('currenttask'));
        for(var prop in storageobj) {
          if(storageobj.hasOwnProperty(prop)) {
              if(storageobj[prop] === item._id) {
                return true;
              }
          }
      }
      }
      
      $scope.filterAlreadyAdded = function(item) {
        //console.log($scope.task.tabs)
        var existingtabs = $scope.task.tabs.filter(function(element,index,array){
          //console.log(element.url, item.url)
          return(element.url == item.url);
        });
       ////console.log('alreadyadded')
        //console.log(existingtabs)
        if(existingtabs.length > 0){
          //console.log('item is added because exists='+existingtabs.length)
          return true;
        }else{
          //console.log('item is not added because exists='+existingtabs.length)
          return false;
        }
        
      };
      
      $scope.addingalltabs = false;

      $scope.addalltabs = function(tabs){
        $analytics.eventTrack('addingAllTabFromTabAdder', {  category: 'taskmanagepageevent', label: $scope.task.name });
        $scope.addingalltabs = !$scope.addingalltabs;
        tabs.forEach(function (tab){
          if($scope.filterNotAlreadyAdded(tab)){
            $scope.addTabtoAdd(tab,$scope.addingalltabs);
          }
        });
      };

      $scope.commitadds = function(task){
       //console.log('commiting adds')
        $analytics.eventTrack('commitingTabsFromTabAdder', {  category: 'taskmanagepageevent', label: $scope.task.name });
        $scope.tabstoadd.forEach(function(tab){
          
          tasktabmanager.track(tab,task);
          
        });
        taskmanager.save(task).then(function(savedtask){
        $scope.task=savedtask;

        });
      };

        
        $scope.openTabAdder = function () {
          $analytics.eventTrack('openingTabAdderModal', {  category: 'taskmanagepageevent', label: $scope.task.name });
          var modalInstance = $modal.open({
            templateUrl: 'views/partials/modals/addTabs.html',
            controller:['$scope', '$modalInstance', function ($scope, $modalInstance) {

              var oldtaskscope = angular.copy($scope.task);
              $scope.ok = function (task) {
                //taskmanager.save(task);
                $analytics.eventTrack('okTabAdderModal', {  category: 'taskmanagepageevent', label: $scope.task.name });
                $modalInstance.dismiss('cancel');
               // $scope.$parent.$parent.isCollapsed = false;
              };
  //FIXME make sure the scope shows the correct version
              $scope.cancel = function () {
                $analytics.eventTrack('cancelingTabAdderModal', {  category: 'taskmanagepageevent', label: $scope.task.name });
                $log.debug(oldtaskscope)
                $scope.task = oldtaskscope;
                $modalInstance.dismiss('cancel');
                //$scope.$parent.$parent.isCollapsed = false;
              };
            }],
            scope: $scope
          });
        };
    }]
  };
});