angular.module('overtaskApp').directive('otTaskList', function () {
    return {
        //restrict: 'A',
        templateUrl: 'views/partials/tasks/taskcardlist.html',
        controller: ['$rootScope','$scope', 'taskmanager','tasktabmanager', 'tabmanager','$q','$modal','$timeout','$analytics',
                     function ($rootScope, $scope, taskmanager,tasktabmanager, tabmanager, $q, $modal, $timeout,$analytics) {
            $scope.list = {};
            $scope.list.mode = {};
            $scope.list.mode.home = true;
            $scope.tasksearch = taskmanager.searchstring;

            $scope.selfilter = taskmanager.filterset;
            $scope.orderby = taskmanager.orderby;
            $scope.activetasktab = 0;
            var today = new Date();
            $scope.today = today;
            $scope.syncstatus = taskmanager.syncstatus;
            $scope.sync = taskmanager.sync;
            
            taskmanager.registerSyncListener(function(){
              $scope.syncstatus = taskmanager.syncstatus; 
              $scope.$apply();
              });
            
            $scope.notdeleting = function (item) {
                var deleting = false;
                if (item._deleted == true) {
                    deleting = true;
                }
                return !deleting;
            };

            
            $scope.isoverdue = function(task){
              var tempdate = new Date();
              tempdate.setHours(0, 0, 0, 0)
              if(new Date(task.duedate)<tempdate){
                //console.log('overdue')
                return true;
              }
              //console.log('not overdue')
              return false;
            };

            var msnry, container;
            
            $scope.loadbutton = function(){taskmanager.init(taskmanager)};
            //$scope.tasks = taskmanager.tasks;
            
            taskmanager.registerObserverCallback(function(){
              //alert('calledback')
              $scope.tasks = [];
              $scope.tasks = taskmanager.tasks;
              //$scope.$apply();
//              $timeout(function(){
//                container = document.querySelector('#taskcontainer');
//                msnry = new Masonry( container, {
//                  // options
//                  columnWidth: 10,
//                  itemSelector: '.taskblock'
//                });
//              },50);
              
            });
            
          //var $scope = $scope.$new();

            //FIXME not really used. Might work better than the current single string status but not sure
            $scope.calctype = function () {
              if (!$scope.task.trashed) {
                if ($scope.task.status == "done") {
                  $scope.task.type = {};
                  $scope.task.type.done = true;
                  $scope.task.type.inprogress = false;
                } else {
                  $scope.task.type = {};
                  $scope.task.type.done = false;
                  $scope.task.type.inprogress = true;
                }
              }
            };
            
            

            $scope.hasdate = taskmanager.hasdate;

            $scope.finishTask = function(task){
              $analytics.eventTrack('finishTask', {  category: 'taskmanagepageevent', label: $scope.task.name+';'+$scope.task.category});
              taskmanager.finish(task);
            };
            

            $scope.reDoTask = function(task){
              $analytics.eventTrack('redoTask', {  category: 'taskmanagepageevent', label: $scope.task.name+';'+$scope.task.category });
              taskmanager.redo(task);
            };

            $scope.unTrashTask = function(task){
              $analytics.eventTrack('unTrashTask', {  category: 'taskmanagepageevent', label: $scope.task.name+';'+$scope.task.category });
              taskmanager.untrash(task);
            };

            $scope.trashTask = function(task){
              $analytics.eventTrack('trashTask', {  category: 'taskmanagepageevent', label: $scope.task.name+';'+$scope.task.category });
              taskmanager.trash(task);
            };

            $scope.deleteTask = function(task){
              $analytics.eventTrack('deleteTask', {  category: 'taskmanagepageevent', label: $scope.task.name+';'+$scope.task.category });
              taskmanager.deletetask(task);
            };

            //var modalPromise = $modal({template: 'views/partials/modals/savetabs.html', persist: true, show: false, backdrop: 'static', scope:$scope});

            $scope.launchTask = function(task,dismiss){
//              msnry.destroy();
//              msnry.element.parentNode.removeChild(msnry.element);
//              msnry.items.forEach(function(item){
//                
//                item.element.parentNode.removeChild(item.element);
//                })
//              
//              msnry.items = '0'
//              //console.log(msnry)
//                 
//              msnry = null;
//              container = null;
              if(dismiss){

                dismiss();
              }
              //console.log('trying to launch')
              if(localStorage.getItem('firsttasklaunch')>0){
//                $q.when(modalPromise).then(function(modalEl) {
            //      modalEl.modal('hide');
//
                //});
                $timeout(function(){
                  $scope.$destroy();
                  taskmanager.launch(task);
                  taskmanager.cleanSyncListeners();
                  $analytics.eventTrack('launchTask', {  category: 'taskmanagepageevent', label: $scope.task.name+';'+$scope.task.category });
                }, 500);
                
              }else{
                var modalInstance = $modal.open({
                  templateUrl: 'views/partials/modals/savetabs.html',
                  controller:['$scope', '$modalInstance', function ($scope, $modalInstance) {
                    $scope.cancel = function () {
                      localStorage.setItem('firsttasklaunch',1);
                      taskmanager.launch(task);
                      taskmanager.cleanSyncListeners();
                      $modalInstance.dismiss('cancel');
                    };
                  }]
                });
              }
            };

            //if(tabmanager.opentabs.length > 0){
            //  $scope.opentabs = tabmanager.opentabs;
            //}else{
            $scope.getTabs = function(){
              //console.log('getting tabs')
              tabmanager.getAllOtherTabs(tabmanager).then(function(result){$scope.opentabs = result });
            };

            //}

            
            

            $rootScope.exportbookmarks = function(){
              $analytics.eventTrack('exportBookmarks', {  category: 'taskmanagepageevent', label: $scope.tasks.length});
              taskmanager.exportBookmarks();
              };

//          Not needed due to all filter
//          $scope.$watch('list.mode.home', function () {
//            console.log("list mode changed")
//            setTimeout(function(){
//              $('#taskcontainer').masonry();
//              $('#completedtaskcontainer').masonry();
//              $('#trashcontainer').masonry();}, 100);
//            
//          }, true);


        }]
      //,
      //  link: function (scope, iElement, iAttrs, ctrl) {
            // scope.calctype();
      //  }
    };
}); 
