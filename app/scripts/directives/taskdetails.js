angular.module('overtaskApp').directive('otTaskDetails', function() {
    return {
        restrict: 'A',
       // require: '^task',
        //scope: {
        //    task: '@'
       // },
        templateUrl: 'views/partials/ottaskdetails.html',
        
        controller: ['$rootScope','$scope','$modal','$analytics','$http','$filter','taskmanager','chromeBackgroundPage', 
             function($rootScope,$scope,$modal,$analytics,$http,$filter,taskmanager,chromeBackgroundPage) {
          $scope.today = new Date();
          $scope.sharing = false;
          $scope.prioritylabels = {'0':'None','1':'Low','2':'Medium','3':'High'};
          $scope.taskmanager = taskmanager;
          $scope.hasdate = taskmanager.hasdate;
          $scope.sharetoggle = function(){
            $analytics.eventTrack('openShareTaskBox', {  category: 'tabmanagepageevent', label: $scope.task.name+';'+$scope.task.category });
            $scope.sharing = !$scope.sharing;
            };
          $scope.finishTask = function(task){
            $analytics.eventTrack('finishTask', {  category: 'tabmanagepageevent', label: $scope.task.name+';'+$scope.task.category });
            
            $rootScope.currenttask = null;
            $rootScope.task = null;
            chromeBackgroundPage.deleteObservers(); 
            
            taskmanager.finish(task);
            taskmanager.suspend(task);
            };
          $scope.deleteTask = function(task){
            $analytics.eventTrack('deleteTask', {  category: 'tabmanagepageevent', label: $scope.task.name+';'+$scope.task.category });
            
            $rootScope.currenttask = null;
            $rootScope.task = null;
            chromeBackgroundPage.deleteObservers(); 
            
            taskmanager.trash(task);
            taskmanager.suspend(task);
            };
          
            $scope.openEdit = function (task) {
              $analytics.eventTrack('editTaskfromTabPage', {  category: 'tabmanagepageevent', label: task.name });
              var modalInstance = $modal.open({
                templateUrl: 'views/partials/modals/edittask.html',
                backdrop:'static',
                controller:['$scope', '$modalInstance', function ($scope, $modalInstance) {

                if(task.duedate && task.duedate != 'Invalid Date'){
                  task.duedate = new Date(task.duedate);
                  
                }else{
                 //console.log(task.duedate);
                 //console.log('is invalid')
                }
                task.duedate = $filter('date')(task.duedate,'yyyy-MM-dd');
                //console.log($scope.rendereddate)
                //$scope.scheduleddatedate = new Date(task.scheduleddate).toString();
                  var oldtaskscope = angular.copy(task);
                  $scope.ok = function (task) {
                    //console.log($scope)
                    $analytics.eventTrack('commitEditTaskfromTaskCard', {  category: 'taskmanagepageevent', label: task.name });
                    if(task.duedate && task.duedate != 'Invalid Date'){
                      task.duedate = new Date(task.duedate).toString();
                    }
                    //console.log(task)
                    //task.scheduleddate = new Date(task.scheduleddatedate).toString();
                    if(task.name && task.name!=''){
                      taskmanager.save(task);
                      $modalInstance.dismiss('cancel');
                    }else{
                      alert('Task name cannot be empty')
                    }
                    //$scope.$parent.$parent.isCollapsed = false;
                  };
      //FIXME make sure the scope shows the correct version
                  $scope.cancel = function () {
                    $analytics.eventTrack('cancelEditTaskfromTaskCard', {  category: 'taskmanagepageevent', label: task.name });
                    //$log.debug(oldtaskscope)
                    //console.log(oldtaskscope)
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

            $scope.openShareModal = function(tab){
            
            $analytics.eventTrack('openShareModal', {  category: 'tabmanagepageevent', label: $scope.task.name+';'+$scope.task.category });

            var modalInstance = $modal.open({
              templateUrl: 'views/partials/modals/taskshare.html',
              backdrop:'static',
              controller:['$scope', '$modalInstance', function ($scope, $modalInstance) {                
                $scope.emails = ''
                $scope.currenttabs = true;
                $scope.sharestarted = false;
                
                  if($scope.task.shares){
                    if(typeof($scope.task.shares) == 'string'){
                      $scope.emails = $scope.task.shares;
                    }else{
                      $scope.task.shares.forEach(function(email){
                        if(!$scope.emails){
                          $scope.emails = email;
                        }else{
                          $scope.emails = $scope.emails + ',' + email;
                        }
                      });
                    }
                  }
                //$scope.task.shares = $scope.emails;
                //var oldtaskscope = angular.copy($scope.task);
                //$scope.share = function (comment,tab,task) {
                //  tasktabmanager.addcomment(comment,tab,task);
                //  $analytics.eventTrack('addComment', {  category: 'tabmanagepageevent', label: task.name+';'+task.category+';'+tab.title });
                //};
    //FIXME make sure the scope shows the correct version
                $scope.share = function(emails,contents){
                  $scope.sharestarted = true;
                 //console.log(contents)
                  if(!contents.currenttabs && !contents.recentsites){// == {'currenttabs':false,'recentsites':false,'comments':false}){
                    alert('Select something to share');
                    $scope.sharestarted = false;
                    return;
                  }
                  if($scope.task.shared  == true){
                    //if($scope.task.tpublic){
                     //console.log('trying to unshare')
                      
                      $http({
                        method : 'DELETE',
                        //data: JSON.stringify({'previd':$scope.task.privateshareid||0,'task_id':$scope.task._id}),
                        headers : {
                          "Authorization" : "Basic " + btoa(localStorage.getItem('u')+':'+localStorage.getItem('p')) +"=="
                        },
                        url : $rootScope.server+'/overtaskserver/default/share_task/'+$scope.task._id+'/'+localStorage.getItem('u')+'?previd='+$scope.task.privateshareid||0
                        }).success(function(data, status, headers, config){
                         //console.log(data);
                         //console.log(status);
                          if($scope.task.sharestatus!= 'link' && $scope.task.sharestatus!= 'email' ){
                            alert('Successfully un-shared task');
                          }
                          $scope.sharestarted = false;
                          $scope.task.shared = false;
                          $scope.task.tpublic = false;
                          $scope.task.tprivate = false;
                          finishSharing(emails,contents);
                          delete $scope.task.privateshareid;
                        }).error(function(data, status, headers, config){
                          $scope.task.shared = false;
                          $scope.task.tpublic = false;
                          $scope.task.tprivate = false;
                          alert('Could not un-share task. Please check to see that it has not already been unshared');
                          $scope.sharestarted = false;
                        });
                      //  }
                  }else{
                    //console.log('trying to finish')
                    //console.log
                    if($scope.task.sharestatus == "private"){
                     //console.log('cannot unshare')
                      $scope.sharestarted = false;
                      alert('Could not un-share task. Please check to see that it has not already been unshared');
                    }
                    finishSharing(emails,contents);
                  } 
                  
                  
                  function finishSharing(){
                    
                  
                  if($scope.task.sharestatus== 'link'){
                    var waspublic = $scope.task.tpublic;
                    $scope.task.shares = [];
                    $scope.task.shared = true;
                    $scope.task.tpublic = true;
                    $scope.task.tprivate = false;
                    var tasktoshare = angular.copy($scope.task) ;
                    //var tasktoshare = 
                    var indexesToSplice = []
                    if(!contents.currenttabs){
                      tasktoshare.tabs.forEach(function(tab){
                        if(tab.closed == false){
                          indexesToSplice.push(tasktoshare.tabs.indexOf(tab));
                        }
                      });
                    }
                    
                    if(!contents.recentsites){
                      tasktoshare.tabs.forEach(function(tab){
                        if(tab.closed == true){
                          indexesToSplice.push(tasktoshare.tabs.indexOf(tab));
                        }
                      });
                    }
                    
                   //console.log(indexesToSplice)
                    var numspliced = 0
                    indexesToSplice.forEach(function(index){
                      tasktoshare.tabs.splice(index - numspliced, 1);
                      numspliced = numspliced + 1;
                    });
                    
                    if(!contents.comments){
                      tasktoshare.tabs.forEach(function(tab){
                        tab.comments = [];
                      });
                    }
                    tasktoshare.duedate = new Date(tasktoshare.duedate).toString();
                    tasktoshare.sharestatus = 'private';
                    delete tasktoshare._rev;
                   //console.log(tasktoshare)
                    $http({
                        method : 'POST',
                        data: JSON.stringify(tasktoshare),
                        headers : {
                          "Authorization" : "Basic " + btoa(localStorage.getItem('u')+':'+localStorage.getItem('p')) +"=="
                        },
                        url : $rootScope.server+'/overtaskserver/default/share_task/all/false/'
                    }).success(function(data, status, headers, config){
                     //console.log(data);
                     //console.log(status);
                      if(data.fail){
                        alert('Sorry, sharing has been disabled on this account for terms of use violation. \n Please contact us if you feel this is an error');
                      }else{
                        alert('Successfully shared task');
                        $modalInstance.dismiss('cancel');
                      }
                      $scope.sharestarted = false;
                    }).error(function(data, status, headers, config){
                      if(waspublic == true){
                        alert("Already Publically shared")
                      }else{
                        alert('Share unsuccessful');
                        $scope.task.shared = false;
                        $scope.task.tpublic = false;
                        $scope.task.tprivate = false;
                        $scope.task.sharestatus= 'private'
                          $scope.sharestarted = false;
                      }

                    });
                    }
                    else if($scope.task.sharestatus== 'email'){
                    
                    var tasktoshare = angular.copy($scope.task) ;
                    //var tasktoshare = 
                    var indexesToSplice = []
                    if(!contents.currenttabs){
                      tasktoshare.tabs.forEach(function(tab){
                        if(tab.closed == false){
                          indexesToSplice.push(tasktoshare.tabs.indexOf(tab));
                        }
                      });
                    }
                    
                    if(!contents.recentsites){
                      tasktoshare.tabs.forEach(function(tab){
                        if(tab.closed == true){
                          indexesToSplice.push(tasktoshare.tabs.indexOf(tab));
                        }
                      });
                    }
                    
                   //console.log(indexesToSplice)
                    var numspliced = 0
                    indexesToSplice.forEach(function(index){
                      tasktoshare.tabs.splice(index - numspliced, 1);
                      numspliced = numspliced + 1;
                    });
                    
                    if(!contents.comments){
                      tasktoshare.tabs.forEach(function(tab){
                        tab.comments = [];
                      });
                    }
                    
                    delete tasktoshare._rev;
                    
                    var sharees = emails.split(',');
                    
                    var invalidemail = false
                    sharees.forEach(function(email){
                     //console.log(email)
                     //console.log(validateEmail(email))
                      if(validateEmail(email.replace(/^\s+|\s+$/g, '')) == false){
                        invalidemail = true;
                        $scope.sharestarted = false;
                        alert('Invalid email address entered, please check and retry');
                        return;
                      }
                    });
                    
                    if(invalidemail){return;};
                    
                    function validateEmail(email) { 
                        var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
                        return re.test(email);
                    } 
                    //console.log(JSON.stringify({'shares':sharees}));
                    tasktoshare.duedate = new Date(tasktoshare.duedate).toString();
                    
                    $http({
                        method : 'POST',
                        data: JSON.stringify({'previd':$scope.task.privateshareid||0,'shares':sharees,doc:tasktoshare}),
                        headers : {
                          "Content-type": "application/json",
                          "Authorization" : "Basic " + btoa(localStorage.getItem('u')+':'+localStorage.getItem('p')) +"=="
                        },
                        url : $rootScope.server+'/overtaskserver/default/share_task/'+$scope.task._id+'/true/'
                    }).success(function(data, status, headers, config){
                      $scope.task.shares = sharees;
                      //console.log(data);
                      //console.log(status);
                      //console.log(config);
                      $scope.task.shared = true;
                      $scope.task.tpublic = false;
                      $scope.task.tprivate = true;
                      $scope.sharestarted = false;
                      if(data.fail){
                        alert('Sorry, sharing has been disabled on this account for terms of use violation. \n Please contact us if you feel this is an error');
                      }else{
                        alert('Successfully shared private task');
                        $scope.task.privateshareid = data.key;
                        $modalInstance.dismiss('cancel');
                      }
                    }).error(function(data,status,headers){
                      alert("Share task failed. Please try again later");
                      $scope.sharestarted = false;
                    });;
                  }
                  }
                };
                $scope.cancel = function () {
                  //var sharees = $scope.task.shares.split(',');
                  //$scope.task.shares = sharees;
                  $modalInstance.dismiss('cancel');
                };
              }],
              scope: $scope,
            });
            
          };

          $scope.openSocialShareModal = function(tab){
            
            $analytics.eventTrack('openSocialShareModal', {  category: 'tabmanagepageevent', label: $scope.task.name+';'+$scope.task.category });

            var modalInstance = $modal.open({
              templateUrl: 'views/partials/modals/socialshare.html',
              controller:['$scope', '$modalInstance', function ($scope, $modalInstance) {

                //var oldtaskscope = angular.copy($scope.task);
                //$scope.share = function (comment,tab,task) {
                //  tasktabmanager.addcomment(comment,tab,task);
                //  $analytics.eventTrack('addComment', {  category: 'tabmanagepageevent', label: task.name+';'+task.category+';'+tab.title });
                //};
                $scope.cancel = function () {
                  $modalInstance.dismiss('cancel');
                };
              }],
              scope: $scope,
            });
            
          };

        }]
        };
    }
);