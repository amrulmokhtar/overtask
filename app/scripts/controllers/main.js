//TODO figure out if this is a memory issue
//$templateCache
//$templateCache.removeAll();     

'use strict';

angular
		.module('overtaskApp')
		.controller(
				'MainCtrl',
				['$scope', 'pouch', '$location', '$rootScope', '$locale', '$modal', '$q', 'tabmanager',
				function($scope, pouch, $location, $rootScope, $locale, $modal, $q, tabmanager) {
				  $rootScope.prioritylabels = {'0':'None','1':'Low','2':'Medium','3':'High'};
				  $locale.id = 'en-AU'//window.navigator.language;
				  $rootScope.openapps = function(){
				    chrome.tabs.create({url:'chrome://apps'});
				  };
				  
				  $rootScope.openextensions = function(){
				    chrome.tabs.update({ url: 'chrome://chrome/extensions' });
				  };
				  
				  chrome.runtime.getBackgroundPage(function (background) {
		        chrome.windows.getCurrent( function(window){
		        if (background.currenttask && background.currenttask[window.id] && background.currenttask[window.id].name) {
		            $scope.$apply($location.path("/task"));
		          }
		        });
	        });

          if(!localStorage.getItem('updated')){
            //fixme this is screwwy
            if(!localStorage.getItem('closing')){
                var modalInstance = $modal.open({
                  templateUrl: 'views/partials/modals/welcome.html',
                  controller: ['$scope', '$modalInstance',function ($scope, $modalInstance) {
                    $scope.cancel = function () {
                      localStorage.setItem('updated',new Date());
                      localStorage.setItem('firstOTlaunch','done');
                      $modalInstance.dismiss('cancel');
                    };
                  }]
                });
            }else{
              var modalInstance = $modal.open({
                templateUrl: 'views/partials/modals/whatsnew.html',
                controller:['$scope', '$modalInstance', function ($scope, $modalInstance) {
                  $scope.cancel = function () {
                    localStorage.setItem('updated',new Date());
                    $modalInstance.dismiss('cancel');
                  };
                }]
              });
            }
          }
					
					var today = new Date();
					
					
					//TODO only do if no current task/not passing through or check if no need when handled by service
					chrome.windows.getCurrent( function(window){
					  if(!localStorage.getItem('currenttask') || !JSON.parse(localStorage.getItem('currenttask'))[window.id]){
	            //console.log('restoring');
	            tabmanager.restoreUntrackedUrls();
	          }
					  });
					

					
					//For choosing which tabsync engine to use
					var extensionID = "dmnodiekgdampalbafckohlbbkahdaeg";
					
					function detectExtension(){
					  chrome.runtime.sendMessage(extensionID,{checkExtension:true},function(response){
					    if (response==true){
					     localStorage.setItem("extensioninstalled","true");
					    }
					  });
					}
				}]);
