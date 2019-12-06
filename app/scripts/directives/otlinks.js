angular.module('overtaskApp').directive('otLinks', function() {

	

    return {
        //restrict: 'A',
        templateUrl: 'views/partials/linkblock.html',
        controller: ['$scope','$modal', function($scope, $modal) {
          $scope.openFeedbackModal = function(){
            
            //$analytics.eventTrack('openFeedbackModal');

            var modalInstance = $modal.open({
              templateUrl: 'views/partials/modals/feedback.html',
              controller:['$scope', '$modalInstance', function ($scope, $modalInstance) {

                //var oldtaskscope = angular.copy($scope.task);
                //$scope.share = function (comment,tab,task) {
                //  tasktabmanager.addcomment(comment,tab,task);
                //  $analytics.eventTrack('addComment', {  category: 'tabmanagepageevent', label: task.name+';'+task.category+';'+tab.title });
                //};
    //FIXME make sure the scope shows the correct version
                $scope.cancel = function () {
                  $modalInstance.dismiss('cancel');
                };
              }],
              scope: $scope,
            });
            
          };

          
        }]
    };

    
});
