angular.module('overtaskApp').directive('otTaskAdder', function() {
    return {
        //restrict: 'A',
        templateUrl: 'views/partials/tasks/taskadder.html',
        controller: ['$scope', '$rootScope','$analytics','$timeout', 'taskmanager', 'tasktabmanager', 'tabmanager','focus', 
                     function($scope,$rootScope,$analytics,$timeout,taskmanager,tasktabmanager,tabmanager,focus) {
         //console.log(taskmanager)
          $scope.priorities = [0,1,2,3];
//           {'label':'None',
//              'value':"0"},
//           {'label':'Low',
//            'value':"1"},
//           {'label':'Medium',
//              'value':"2"},
//           {'label':'High',
//              'value':"3"}
          //$timeout(function(){
              //console.log('focusing');
              focus('focusMe');
          //  },2000)

          $scope.today = new Date();
          var defaulttask = {priority:0,category:"General"};
          $scope.task = {priority:0,category:"General"};

          $scope.opentabs = [];

          $scope.addingtask = false;
          $scope.getTabs = function(){
            //console.log('getting tabs')

              tabmanager.getAllOtherTabs(tabmanager).then(function(result){$scope.opentabs = result;});

          };
          
          

          //$scope.addTab =
          $scope.tabstoadd = [];
          $scope.addTabtoAdd= function(tab,mark){
           
            mark = mark || false;
            console.log("adding to addtabs",mark)
            if(!tab.addselected || mark == true){
              $analytics.eventTrack('addingSingleTabFromTaskAdder', {  category: 'taskmanagepageevent', label: $scope.task.name });
              $scope.tabstoadd.push(tab);
              tab.addselected = true;
            }else{
              $analytics.eventTrack('removingSingleTabFromTaskAdder', {  category: 'taskmanagepageevent', label: $scope.task.name });
              $scope.tabstoadd.splice($scope.tabstoadd.indexOf(tab),1);
              tab.addselected = false;
            }
          };
          
          $scope.addingalltabs = false;

          $scope.addalltabs = function(tabs){
            $analytics.eventTrack('addingAllTabsFromTaskAdder', {  category: 'taskmanagepageevent', label: $scope.task.name });
            $scope.addingalltabs = !$scope.addingalltabs;
            tabs.forEach(function (tab){
              
                $scope.addTabtoAdd(tab,$scope.addingalltabs);

            });
          };

        //Create a new task
          $scope.addTask = function(task) {
              $scope.advancedSettings = false;
            if(task.name == undefined || task.name == "" || task.name == null)
              {
                return
              }
            
            task = angular.copy(task);

            $scope.task = angular.copy(defaulttask);
            taskmanager.add(task).then(function(addedtask){
              $scope.tabstoadd.forEach(function(tab){
                tasktabmanager.track(tab,addedtask);
              })

              taskmanager.save(addedtask);
              $scope.tabstoadd = [];
              $scope.addingTabs = false;
              //$scope.isCollapsed = true;
            });
          };
        }]
    };
}).directive('focusOn', function() {
  return function(scope, elem, attr) {
    scope.$on('focusOn', function(e, name) {
      if(name === attr.focusOn) {
        elem[0].focus();
      }
    });
  };
}).factory('focus',['$rootScope', '$timeout', function ($rootScope, $timeout) {
  return function(name) {
    $timeout(function (){
      $rootScope.$broadcast('focusOn', name);
    });
  };
}]);
