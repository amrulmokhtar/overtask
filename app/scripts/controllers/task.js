'use strict';
/*
 * Solution for shared tasks:
 * Tabset items for each user
 * task: owner write only, have shared items download into a different database, and get pulled in via views
 */
/*todo code
 * 			//FIXME: Make proper blacklist solution
*			$scope.badsites = [];
*
 * 
 */
angular.module('overtaskApp').controller(
		'TaskCtrl',
		['$scope', '$rootScope','$analytics', 'taskmanager','chromeBackgroundPage', 'suggestionmanager',
		function($scope, $rootScope,$analytics, taskmanager,chromeBackgroundPage, suggestionmanager) {
			var doneopening = false;
			
			
			function onWindowChanged(tabId, attachInfo){
			  window.location.href = '/index.html';
			}
			
			chrome.tabs.onAttached.addListener(onWindowChanged);
			//$scope.taskmanager = taskmanager;
			////console.log($scope.taskmanager);

			$scope.syncstatus = taskmanager.syncstatus;
      $scope.sync = taskmanager.sync;
      
      taskmanager.registerSyncListener(function(){
        $scope.syncstatus = taskmanager.syncstatus; 
        $scope.$apply();
        });
      
      chrome.windows.getCurrent( function(rwindow){
      if(chromeBackgroundPage.backgroundpage && chromeBackgroundPage.backgroundpage.currenttask[rwindow.id] && taskmanager.currenttask.name){
				$rootScope.currenttask = taskmanager.currenttask;
				//console.log('currenttask at task.js init')
				//console.log($rootScope.currenttask)
				$rootScope.task = chromeBackgroundPage.backgroundpage.currenttask[rwindow.id];
            }else{
                chromeBackgroundPage.registerObserverCallback(function(){
                   ////console.log("logging observer callback")
                  ////console.log(chromeBackgroundPage.backgroundpage.currenttask)
                  
                	$rootScope.currenttask = taskmanager.currenttask;
                	//console.log(rwindow)
                  $rootScope.task = chromeBackgroundPage.backgroundpage.currenttask[rwindow.id];
                  //console.log('currenttask at task.js callback')
                  //console.log($rootScope.currenttask)
                  $rootScope.$apply();
                });
            }
      });

      //chromeBackgroundPage.registerListener({'name': 'taskpagecallbacks', 'unique': true},function callback(message, sender){
      //if(message.task){
      //  $scope = $scope.$new();
      //  $scope.$apply();
      //}
      //});

			////console.log($scope.task)
			
		//	$scope.taskmanager = taskmanager;

			$rootScope.suspendTask = function(task){
        $analytics.eventTrack('suspendTask', {  category: 'tabmanagepageevent', label: $scope.task.name+';'+$scope.task.category });
        //console.log(task);
			  $rootScope.currenttask = null; 
			  $rootScope.task = null;
			  chromeBackgroundPage.deleteObservers(); 
			  chrome.tabs.onAttached.removeListener(onWindowChanged);
			  //console.log(task);
			  return taskmanager.suspend(task); 
			  }
			$scope.saveEdit = function(tempdate,modal){
			  if(tempdate){
			    $scope.renderdate = tempdate;
	        $scope.task.duedate = tempdate.toString();
			  }
			 // modal.hide();
			};
			
			////console.log($scope.task);
			if($scope.task && $scope.task.duedate){
			  //$scope.renderdate = new Date($scope.task.duedate);
			}

						
			/*
			 * Closes all tabs, saves task state, and syncs to database
			 */
			var closing = false;
			function closealltabs(){
				closing = true;
				//FIXME Talk to background proccess
				chrome.runtime.getBackgroundPage(function(background){
          background.closealltabs($scope.task);
        });
			}
			
			function saveTaskState(task){
			  chrome.runtime.getBackgroundPage(function(background){
          background.saveTaskState($scope.task);
        });
			}

			//Adds a tab to a given category, updates suggestions to 
			//suggest tabs for other users
			var addTab = function(task, url, category, options) {
        $analytics.eventTrack('addTab', {  category: 'tabmanagepageevent', label: task.name+';'+task.category+';'+url });

        chrome.runtime.getBackgroundPage(function (background) {
          chrome.windows.getCurrent( function(window){
          if (background.currenttask && background.currenttask[window.id] && background.currenttask[window.id].name) {
              
            }else{
              $scope.$apply($location.path("/"));
            }
          });
        });
        
			  //FIXME urls are case sensitive!
				//url = url.toLowerCase();
				//var existingTabs = $scope.task.tabs.filter(function(element, index, array){
				//	return(element.url == url);
				//});
				//
				//if(existingTabs.length<1)
			//	{
					
		
					//Open urls with chrome's tab method
					chrome.tabs.create({
						url : url
					}, function(tab) {
						//callback that updates tab id
					//add url to tabs 
	          //FIXME: Ensure that this doesn't end up in duplicate entry
	          task.tabs.push({
	            id : tab.id,
	            url : url,
	            category : category,
	            title : tab.title || options.title || url.substring(0, url.indexOf('?')) || url,
	            opentimes: [{'timeopened':new Date()}],
	            sessionnum: 0,
	            comments: [],
	            closed : false
	          });
	          
	          ////console.log("tab title is")
	          ////console.log($scope.task.tabs[$scope.task.tabs.length-1].title)
	          
	          suggestionmanager.addSuggestion(task.tabs[task.tabs.length-1]);
						//$scope.task.tabs[$scope.task.tabs.length-1].id = tab.id;
						//$scope.task.tabs[$scope.task.tabs.length-1].title = tab.title || tab.url.substring(0, tab.url.indexOf('?'));
						//Update localstorage task entry
						saveTaskState(task);
					});
				//}
				//else if(existingTabs[0].closed == true)
				//{
				//	$scope.reopen(existingTabs[0]);
				//}
				//else
				//{
					
				//	$scope.switchTo(existingTabs[0]);
				//}
			};
			
			$scope.addTab = addTab;
			
			
	        function isDo(element, index, array) {
	        	return (element.category && element.category.toLowerCase() == "do");
	        	}    
	        
	        function isResearch(element, index, array) {
	        	  return (element.category && element.category.toLowerCase() == "research" && element.closed == false);
	        	}
	        
	        function isCommunicate(element, index, array) {
	        	return (element.category && element.category.toLowerCase() == "communicate");
	        	}	

	}]);