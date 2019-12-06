angular.module('overtaskApp').directive('otHeaderBar', function() {
    return {
        //restrict: 'A',
        templateUrl: 'views/partials/otheaderbar.html',
        controller: ['$scope', '$rootScope','$analytics', 'taskmanager','chromeBackgroundPage','notificationmanager',  function($scope,$rootScope,$analytics,taskmanager,chromeBackgroundPage,notificationmanager){
            //$scope.taskman = taskmanager;
            $rootScope.notifications = notificationmanager.backlog;
            if(chromeBackgroundPage.backgroundpage && chromeBackgroundPage.backgroundpage.currenttask){
              chrome.windows.getCurrent( function(window){
               // $rootScope.currenttask = chromeBackgroundPage.backgroundpage.currenttask[window.id];
              })
            }else{
                chromeBackgroundPage.registerObserverCallback(function(){
                    //console.log("logging observer callback")
                    //console.log(chromeBackgroundPage.backgroundpage.currenttask)
                    chrome.windows.getCurrent( function(window){
                      //$rootScope.currenttask = chromeBackgroundPage.backgroundpage.currenttask[window.id];
                    });
                    //$rootScope.$apply();
                });
            }

//          $rootScope.openlogin= function(){
//            $(document.body).toggleClass("cbp-spmenu-push-toleft");
//            $("#rightmenu").toggleClass("cbp-spmenu-open");
//          };
            localStorage.setItem('trackingcode','UA-38061324-4')
        $scope.debugstate = localStorage.getItem('trackingcode')
            $scope.toggledebug = function(debug){
          if(debug){
            localStorage.setItem('trackingcode','')
          }else{
            localStorage.setItem('trackingcode','UA-38061324-4')
          }
        }
            
        $scope.openlogin = function(){
          $analytics.eventTrack('openLogin', {  category: 'headerevent'});

          $rootScope.loginpanelopen = !$rootScope.loginpanelopen;
          };

         $rootScope.removenotification = function(){
           $analytics.eventTrack('removeNotification', {  category: 'headerevent'});
            notificationmanager.backlog.pop();
          };
          
          $rootScope.undo = function(){
            notificationmanager.backlog.pop().undoaction();
            $analytics.eventTrack('undoNotification', {  category: 'headerevent'});
            //notificationmanager.undo(notificationmanager,notificationmanager.backlog[notificationmanager.])
          };
//            $scope.$watch('currenttask', function () {
//              //$scope.$apply();
//            })
        }]};
    });