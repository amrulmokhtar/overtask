angular.module('overtaskApp').directive('otTabList', function() {
    return {
        restrict: 'A',
       // require: '^task',
        //scope: {
        //    task: '@'
       // },
        templateUrl: 'views/partials/tabs/ottablist.html',
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
          
          //$scope.switchto = tasktabmanager.switchto;
          $scope.closedtablimit =10;
          $scope.openCommentModal = function(tab){
            $scope.tab = tab;
            $analytics.eventTrack('openCommentModal', {  category: 'tabmanagepageevent', label: $scope.task.name+';'+$scope.task.category });

            var modalInstance = $modal.open({
              templateUrl: 'views/partials/modals/comments.html',
              backdrop:'static',
              controller:['$scope', '$modalInstance', function ($scope, $modalInstance) {
                $scope.gravify = function(email){return email};//CryptoJS.MD5(email).toString() + "?";};
                $scope.addcomment = function (comment,tab,task) {
                  tasktabmanager.addcomment(comment,tab,task);
                  $analytics.eventTrack('addComment', {  category: 'tabmanagepageevent', label: task.name+';'+task.category+';'+tab.title });
                };
    //FIXME make sure the scope shows the correct version
                $scope.cancel = function () {
                  var commentedits = tab.comments.filter(function(el,index,array){
                    return(el.editing==true)
                  });
                  
                  if(commentedits.length == 0){
                    $modalInstance.dismiss('cancel');
                  }else{
                    alert('Unsaved comments');
                  }
                  
                };
              }],
              scope: $scope
            });
            
          };
        }]
        };
    }
);