/**
 *
 * @ngdoc overview
 * @name taskmanager
 * @description
 *
 * # taskmanager
 *
 * The taskmanager handles the task data, & controls its
 * persistence & syncing through secondary services.
 *
 *  create a task
 *  load tasks from remote storage
 *  load tasks from localstorage
 *  store all tasks in memory
 *  provide tasks to be rendered
 *  //TODO change task datastruct to 2 booleans, not an object, a boolean & a string
 *  manage task state (inprogress, completed)
 *  edit task details
 *  ??Filter tasks??
 *  remove tasks from storage
 *  launch tasks
 *  close tasks
 */

//TO FIX LAUNCHING
//STOP RE_LAUNCHING FROM BACKGROUND PAGE EVERY TIME TAB GETS OPENED

angular.module('overtaskApp')
  .service('taskmanager', 
     ['$window', '$filter', '$http', '$rootScope', '$log', '$q', '$location', '$modal', 'fileReader', 'loginmanager', 'tabmanager', 'pouch', 'chromeBackgroundPage', 'notificationmanager', 
      function ($window, $filter, $http, $rootScope, $log, $q, $location, $modal, fileReader, loginmanager, tabmanager, pouch, chromeBackgroundPage, notificationmanager) {

    //$rootScope.windowid
    $rootScope.renderdate = function(date){ return new Date(date)}
    var today = new Date();
    /**
     * Creates a task in the format used by overtask
     * @constructor
     * @param taskdetails
     * @returns {Task}
     */

    function Task(taskdetails, windowId) {
      //console.log(taskdetails)
      taskdetails = angular.copy(taskdetails);
      this.name = taskdetails.name;
      this.priority = parseInt(taskdetails.priority);
      this.category = taskdetails.category;
      this.owner = loginmanager.getUser();
      this.windowid = windowId;
      this.description = taskdetails.description || '';
      this.sharestatus = 'private';
      this.shared = [];
      //TODO figure out if datestring or date is better to store
      this.startdate = new Date().toString()  ;
      this.duedate = new Date(taskdetails.duedate).toString();
      this.scheduleddate = new Date(taskdetails.scheduleddate).toString();
      this.sessionnum = 0;
      this.opentimes = [];
      this.opentimes[this.sessionnum] = {};
      this.status = 'inprogress';
      this.tabs = [];
      this.trashed = false;
      this.type = {};
      this.type.inprogress = true;
    }
    
    var observerCallbacks = [];

    //register an observer
    this.registerObserverCallback = function(callback){
        observerCallbacks.push(callback);
    };

    //call this when you know 'foo' has been changed
    var notifyObservers = function(){
        angular.forEach(observerCallbacks, function(callback){
            callback();
        });
    };

    this.deleteObservers = function(){
      observerCallbacks = [];
    };

    this.tasks = [];

    //FIXME this is due to cause problems because of async nature
    this.currenttask = {}//chromeBackgroundPage.backgroundpage.currenttask;

    this.searchstring = '';

    //FIXME far too simplistic vs previous adding model
    this.add = function (taskdetails) {
      var defered = $q.defer();
      tabmanager.getCurrentTab(this).then(function (result) {
        result.pthis.save(new Task(taskdetails, result.currentTab.windowId)).then(function (task) {
          result.pthis.tasks.push(task);
          notificationmanager.track(notificationmanager,'Created '+task.name,{'type':'undo','undoaction':function(){result.pthis.trash(task)}});
          defered.resolve(task);
        });
      });
      return defered.promise;
    };

    this.get = function (taskid) {
      var defer = $q.defer();
      pouch.tasksdb.get(taskid, function (err, resp) {
        if (resp) {
          defer.resolve(resp);
        } else {
          defer.reject(err);
        }
      });
      return defer.promise;
    };

    var loading = false;
    this.loadFromLocalStorage = function (tmanager) {
     //console.log(loading)
      //if(loading == true){return};
      loading = true;
      //console.log("loading tasks from localstorage")
      var deffered = $q.defer();
      pouch.tasksdb.allDocs({
        include_docs: true
      }, function (err, response) {
        if (err) {
          deffered.reject(err);
          //$log.error(err);
        } else {
          deffered.resolve(response);
        }
        ;
      });
      
      deffered.promise.then(function (response) {
        tmanager.tasks = [];
        response.rows.forEach(function (row) {
          if (row.doc.name) {
            tmanager.tasks.push(row.doc);
          }
        });
        notifyObservers();
        loading = false;
      });

      return deffered.promise;
    };

    this.saveall = function () {
      gthis.tasks.forEach(function (task) {
        gthis.save(task);
      });
    };

    //Save task to localstorage
    //TODO figure out if needs to provide async promise
    function save(task) {
      var deffered = $q.defer();
     //console.log(task);
      if(task._id){
        pouch.tasksdb.get(task._id, function (err, response) {
          task._rev = response._rev;
          deffered.resolve(post(task));
        });
      }else{
        deffered.resolve(post(task));
      }
      return deffered.promise;
    };
    
    function post(task){
      var defer = $q.defer();
      pouch.tasksdb.post(task, function (err, response) {
        if (err) {
          //$log.error(err);
        } else {
          task._id = response.id;
          task._rev = response.rev;       
          defer.resolve(task);
          chrome.windows.getCurrent( function(window){
            chrome.runtime.sendMessage({updatetasks: {windowid:window.id}});
          });
        }
      });      
      return defer.promise;
    }
    
    //TODO move this to its own service
    

    if(localStorage.getItem('lastsynced') && localStorage.getItem('lastsynced')!='null'){
      this.syncstatus=["Last Synced at",new Date(localStorage.getItem('lastsynced'))];
    }

    
    this.sync = function(){
      //TODO Filter trashed tasks locally, get resulting doc ids, use that in up-replication for efficiency
     //console.log('syncing')
      var defer = $q.defer();
      
      
      PouchDB.replicate(pouch.remotetasksdb,pouch.tasksdb,{filter:'main/nottrash', complete:function(err,resp){
        if(resp){

          PouchDB.replicate(pouch.tasksdb,pouch.remotetasksdb,{complete:function(err,resp){
            if(resp){
              gthis.syncstatus=["Task synced at",new Date()];
              localStorage.setItem('lastsynced',new Date());
              //console.log(resp)
              }
            if(err){
              gthis.syncstatus=["Sync error at",new Date()];
              //console.log(resp)
            }
            defer.resolve();
            gthis.notifySyncListeners();
            }});
        }
      }});
      return defer.promise;
    };
    
    this.synclisteners = [];
    
    this.registerSyncListener = function(callback){
      gthis.synclisteners.push(callback);
    };
    
    this.cleanSyncListeners = function(){
      gthis.synclisteners = [];
    };
    
    this.notifySyncListeners = function(){
      gthis.synclisteners.forEach(function(listener){
          listener();
        });
    };

    this.save = save;

    this.launch = function (task,windowid) {
      chrome.windows.getCurrent( function(window){
      if(windowid > 0){
        if(windowid != window.id){
          return
        }
      }else{
        windowid = window.id;
      }
      var storageobj = JSON.parse(localStorage.getItem('currenttask'));
        
        for(var prop in storageobj) {
          if(storageobj.hasOwnProperty(prop)) {
              if(storageobj[prop] === task._id) {
                alert("Task already open in a different window"); 
                return;
              }
          }
      }

      gthis.currenttask = task;
      //console.log(task);
      //FIXME use the backgroundpage wrapper
      chrome.runtime.getBackgroundPage(function (background) {
        background.launchTask(task,windowid);
        
          chrome.runtime.sendMessage({updatetasks: {windowid:window.id}});
        });
      });
    };

    //Check if there is a current task
    //TODO automate switching to currenttask/tab page when detected?
    this.getCurrentTask = function () {
      var defer = $q.defer();
      chrome.windows.getCurrent( function(window){
	if(localStorage.getItem("currenttask")){
		var localstorageCurrentTaskid = JSON.parse(localStorage.getItem("currenttask"))[window.id];
	}
      if (localstorageCurrentTaskid && localstorageCurrentTaskid != "null" && localstorageCurrentTaskid != null) {
        $log.info("fetching current task");
        defer.resolve(gthis.get(localstorageCurrentTaskid));
        ;
      }
      else {
        //FIXME get a proper rejection handler

        defer.reject("No current task");

      }});
      return defer.promise;
    };

    this.init = function (pthis) {
      //FIXME figure out how to get $q working for no currenttask
      chrome.runtime.getBackgroundPage(function (background) {
        chrome.windows.getCurrent( function(window){
        if (background.currenttask && background.currenttask[window.id] && background.currenttask[window.id].name) {
          //console.log("Background currenttask is");
          //console.log(background.currenttask)
          pthis.currenttask = background.currenttask[window.id];
          $location.path("/task");
          $rootScope.$apply();
        } else {
          pthis.getCurrentTask().then(function (currentTask) {
            if (currentTask) {
              pthis.launch(currentTask);
            } else {
              //TODO figure out if this is the best way to load all docs at the begining
              //console.log($location.path())
              if($location.path()!='/'){
                $location.path("/");
              }
              
              //$rootScope.$apply()
              pthis.loadFromLocalStorage(pthis);
            }
          }, function (reason) {
            //TODO This is more efficient but breaks when tasks get suspended and the tasklist isn't initialized
            //console.log($location.path())
            if($location.path()!='/'){
              $location.path("/");
            }
            
//            if(localStorage.getItem('repltasks')=="true"){
              localStorage.setItem('repltasks',false);
              PouchDB.replicate('tasks',pouch.tasksdb,{complete:function(err,resp){
                
                if(localStorage.getItem('tasktorelaunch') && localStorage.getItem('tasktorelaunch').length > 9){
                  var tasksToRe = JSON.parse(localStorage.getItem('tasktorelaunch')) || {};
                  if(tasksToRe[window.id] && tasksToRe[window.id].length>8){
                    pouch.tasksdb.get(tasksToRe[window.id],function(err,resp){
                      if(resp){
                        pthis.launch(resp,window.id);  
                      }
                      delete tasksToRe[window.id];
                      localStorage.setItem('tasktorelaunch',JSON.stringify(tasksToRe));
                    });
                  }
                }
                syncIfTime();
                //PouchDB.destroy('tasks');
              }});
//            }else{
//              syncIfTime();
//            }
            
            
          });
        }
      });
      });
      //$location.path("/");
      //$rootScope.$apply()
      //pthis.loadFromLocalStorage(pthis);
    };
    
    function syncIfTime(){
      var syncdate = new Date(localStorage.getItem('lastsynced'));
      var testdate = new Date(new Date().getTime() - 30*60000);
      if(localStorage.getItem('api')&&localStorage.getItem('api')!="undefined"&& (!localStorage.getItem('lastsynced')||localStorage.getItem('lastsynced')=='null'|| syncdate < testdate)){
       //console.log("auto sync");
          gthis.sync().then(gthis.loadFromLocalStorage(gthis));     
      }else{
        gthis.loadFromLocalStorage(gthis);
      }
    }
    
    this.share = function(task,person){
      task.shared.push(person);
      var auth = ""+localStorage.getItem("u")+":"+localStorage.getItem("p")+""
      //console.log(auth)
      auth = btoa(auth);
      $http(
          {
            method : 'POST',
            headers : {
              "Authorization" : "Basic "
                  + auth +"=="
            },
            url : 'https://overtaskme.appspot.com/share_task/'+encodeURIComponent(person)+'/'+task._id+".json"
          }).success(
          function(data, status, headers, config) {
           //console.log("successovertaskpost");
           //console.log(data);
            task.shared.push(person);
          }).error(function(data, status, headers, config){
           //console.log("sharefail");
          });
    };
    
    this.unshare = function(task){
     //console.log('trying to unshare')
      
      $http({
        method : 'DELETE',
        //data: JSON.stringify({'previd':$scope.task.privateshareid||0,'task_id':$scope.task._id}),
        headers : {
          "Authorization" : "Basic " + btoa(localStorage.getItem('u')+':'+localStorage.getItem('p')) +"=="
        },
        url : $rootScope.server+'/overtaskserver/default/share_task/'+task._id+'/'+localStorage.getItem('u')+'?previd='+task.privateshareid||0
        }).success(function(data, status, headers, config){
          //console.log(data);
          //console.log(status);
          //if($scope.task.sharestatus!= 'link' || $scope.task.sharestatus!= 'email' ){
            alert('Successfully un-shared task');
          //}
          task.shared = false;
          task.tpublic = false;
          task.tprivate = false;
          delete task.privateshareid;
        }).error(function(data, status, headers, config){
          alert('Could not un-share task. Please check to see that it has not already been unshared');
        });
    }
    
    function shareWithEachCollaborator(task){
      task.shared.forEach(function(person){
        share(person);
        task.initialshare = true;
      });
    }

    this.init(this);

    //Minimizes the task, to be done again at a later date.
    //FIXME determine taskmanager currenttask & tasksstore state synchronisity with localdb state & remotedb state
    this.suspend = function (task) {
      var defer = $q.defer();
      //FIXME actually use the chromeBackgroundpage service
     //console.log('suspending')
     //console.log(task)
      chrome.runtime.getBackgroundPage(function (background) {
        background.closealltabs(task,function(){
          defer.resolve('Done');
        });
      });
      //this.taskmanager.loadFromLocalStorage(this.taskmanager);
//     //console.log(task)
//      task.currenttask = false;
//      task.opentimes[task.sessionnum].timeclosed = new Date();
//      if(task==this.currenttask){
//        this.currenttask = undefined;
//        tabmanager.closeAllOtherTabs();
//      }
      return defer.promise;
    };

    //Finishes the task, to be archived.
    //TODO implement archiving to reduce db size?
    var gthis = this;
    this.finish = function (task) {
      chrome.windows.getCurrent( function(window){
        chrome.runtime.sendMessage({updatetasks: {windowid:window.id}});
      });
      task.currenttask = false;
      task.status = "done";
      task.opentimes[task.sessionnum].timeclosed = new Date();

      if (task._id == localStorage.getItem('currenttask')) {
        chromeBackgroundPage.backgroundpage.currenttask[task.windowid] = undefined;
        //FIXME not sure if we should close tabs here or rely on the suspend function
        //tabmanager.closeAllOtherTabs(tabmanager);
      }

      notificationmanager.track(notificationmanager,'Finished '+task.name,{'type':'undo','undoaction':function(){gthis.redo(task)}});
      save(task);
    };

    //Set state of the task to be trashed, ready for permanent deletion
    //TODO implement automatic deletion after n days
    //TODO decide to sync or not
    this.trash = function (task, resolved) {
      
      if(!task.trashed && task.sharestatus != 'private' && !resolved){
        $rootScope.deletemodaltask = task;
        var modalInstance = $modal.open({
          templateUrl: 'views/partials/modals/taskdeleteconfirmation.html',
          backdrop:'static',
          controller:['$scope','$modalInstance', function ($scope, $modalInstance) {
            $scope.unshare = function () {
              delete $rootScope.deletemodaltask;
              gthis.unshare(task);
              gthis.trash(task,true);
              $modalInstance.dismiss('cancel');
            }
            $scope.trash = function () {
              delete $rootScope.deletemodaltask;
              gthis.trash(task,true);
              $modalInstance.dismiss('cancel');
            }
            $scope.cancel = function () {
              delete $rootScope.deletemodaltask;
              $modalInstance.dismiss('cancel');
            }
          }],
          scope: $rootScope
        });
        return;
      }
      //console.log("trashing")
      task.currenttask = false;

      task.opentimes[task.sessionnum].timeclosed = new Date();
      if (task == this.currenttask) {
        this.currenttask = undefined;
        //tabmanager.closeAllOtherTabs();
      }
      if (task.trashed) {
        deletetask(task);
        if(pouch.remotetasksdb){
          pouch.remotetasksdb.remove(task);
        }
      } else {
        task.trashed = true;
        if(pouch.remotetasksdb){
          pouch.remotetasksdb.remove(task);
        }
        notificationmanager.track(notificationmanager,'Trashed '+task.name,{'type':'undo','undoaction':function(){gthis.untrash(task)}});
      }
      save(task).then(function(){
      chrome.windows.getCurrent( function(window){
        chrome.runtime.sendMessage({updatetasks: {windowid:window.id}});
        });
      });
      
    };

    this.redo = function (task) {
      
      if (task.trashed) {
        gthis.untrash(task);
      } else {
        task.status = 'inprogress';
      }
      save(task);
      chrome.windows.getCurrent( function(window){
        chrome.runtime.sendMessage({updatetasks: {windowid:window.id}});
      });
    };

    this.untrash = function (task) {
      task.trashed = false;
      save(task);
    };

    function deletetask(task) {
      chrome.windows.getCurrent( function(window){
        chrome.runtime.sendMessage({updatetasks: {windowid:window.id}});
      });
      task.currenttask = false;
      task._deleted = true;
      notificationmanager.track(notificationmanager,'Deleted '+task.name,{'type':'undo','undoaction':function(){gthis.restore(task)}});
      //save(task)
    };
    
    this.cleanTrash = function(resolved){
      if(!resolved){
        //$rootScope.deletemodaltask = task;
        var modalInstance = $modal.open({
          templateUrl: 'views/partials/modals/emptytrash.html',
          backdrop:'static',
          controller:['$scope', '$modalInstance', function ($scope, $modalInstance) {
            $scope.trash = function () {
              gthis.cleanTrash(true);
              $modalInstance.dismiss('cancel');
            }
            $scope.cancel = function () {
              $modalInstance.dismiss('cancel');
            }
          }],
          scope: $rootScope
        });
        return;
      }
      $filter('filter')(gthis.tasks,gthis.filtertypes[11].filter).forEach(function(task){
        gthis.trash(task);
      });
    };
    
    this.restore = function(task){
      chrome.windows.getCurrent( function(window){
        chrome.runtime.sendMessage({updatetasks: {windowid:window.id}});
      });
     //console.log(task)
      delete task._deleted;
      pouch.tasksdb.post(task);
    };

    this.deletetask = deletetask;

    this.hasdate = function (date) {
      var hasdate = true;
      date = new Date(date);
      if (!date || date == 'undefined' || date == undefined || date == 'null' || date == null || date == "NULL" || date == 'Invalid Date' || date.length < 9) {
        hasdate = false;
      }
      //console.log(date)
      //console.log(hasdate)
      return hasdate;
    };

    this.registerListeners = function (pthis) {
      //console.log("registering listeners")
      //FIXME refactor to use taskmanager functions & abstract update to view
      chromeBackgroundPage.registerListener({'name': 'taskmanagecallbacks', 'unique': true},
        function callback(message, sender) {
          //console.log("got message in taskmanagecallbacks")
        if(localStorage.getItem('changingdbs')=='true'){
          return
        }
        
        chrome.windows.getCurrent( function(window){
          if (message.opening) {
            //FIXME background state reports the same as the task you launched previously, even if you close it
            //this.currenttask = message.task;
            //this.currenttask._rev = message.rev;
              if(message.task.windowid==window.id){
              pthis.currenttask = message.task;
              pthis.currenttask.currenttask._rev = message.rev;
              //$window.location.href = 'index.html#/task';
              $location.path("/task");
              $rootScope.$apply();
              pthis.deleteObservers();
              chromeBackgroundPage.deleteObservers();
              }else{
               //console.log('reloading tasks')
                gthis.loadFromLocalStorage(gthis);
              }
              

          }

          if (message.updatetasks) {
            //$scope.$apply(getTasks());
           //console.log(message.updatetasks.windowid)
            if(message.updatetasks !== undefined && message.updatetasks !== true ){//&& message.updatetasks.windowid != window.id
             //console.log('reloading tasks')
              gthis.loadFromLocalStorage(gthis);
            }
            
          }

          if (message.task) {
            //console.log("task from bgr")
            //console.log(message.task)
            //console.log("task in bgr page maanger")
            //console.log(chromeBackgroundPage.backgroundpage.currenttask
            if(message.task.windowid==window.id){
              pthis.currenttask = message.task;
              pthis.currenttask.currenttask._rev = message.rev;
              pthis.deleteObservers();
              $rootScope.$apply();
            }else{
             //console.log('reloading tasks')
              gthis.loadFromLocalStorage(gthis);
            }
            
          } else if (message.sync) {
            //$scope.syncmessage = message.sync;
          } else if (message.close ){
            if(message.close.windowid == window.id){
            //console.log("empty message body");
              // $rootScope.currenttask = undefined;
              localStorage.setItem("closing", "false");
              //window.location.href = "../index.html";
              chromeBackgroundPage.deleteObservers();
              $location.path("/");
              gthis.init(gthis);
              //$rootScope.$apply();
              // $scope.$destroy();
            }else{
             //console.log('reloading tasks')
              gthis.loadFromLocalStorage(gthis);
            }
          }
          });
        });
    };
    
    //FIXME refactor into appropriate place
    function makeNetscapeBookmarkHTML(tasks) {
      

        var htmlstring = '<!DOCTYPE NETSCAPE-Bookmark-file-1> \n\
<!--This is an automatically generated file.\n\
It will be read and overwritten.\n\
Do Not Edit! -->\n\
<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">\n\
<TITLE>Bookmarks</TITLE>\n\
<H1>Bookmarks</H1>\n' +
            "<DL><p>\n<HR>";


        tasks.forEach(function (task) {
            htmlstring += "<DT><H3 >" + task.name + "</H3> \n<DL><p>" //ADD_DATE='" + task.startdate + "'
            ;
            task.tabs.forEach(function (tab) { //"' ADD_DATE='" + tab.opentimes[0].timeopened + "' LAST_VISIT='" + tab.opentimes.slice(-1)[0] + "'
                htmlstring += "\n<DT><A HREF='" + tab.url + "'>"
          + tab.title + "</A>"; //LAST_MODIFIED='" + tab.opentimes.slice(-1)[0] + "'
            });
            htmlstring += "\n</DL><p>\n";
        });

        htmlstring += "</DL><p>";
//        <a href="data:application/octet-stream;charset=utf-8;base64,Zm9vIGJhcg==">text file</a>
        //window.open("data:application/octet-stream;charset=utf-8;base64,"+btoa(unescape(encodeURIComponent(htmlstring))),'_blank');
        function download(filename, text) {
          var pom = document.createElement('a');
          pom.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
          pom.setAttribute('download', filename);
          pom.click();
      }
        download('bookmarks.html',htmlstring)
        return htmlstring;
    }
    
    this.loadjson = function(json){
      //var data = atob(json);
      //FIXME strip ids and revs
      var data = JSON.parse(json);
      data.forEach(function(task){
        delete task._id;
        delete task._rev;
        task.name = task.name + " (imported)";
      });
      pouch.tasksdb.bulkDocs({'docs':data},function(err,resp){
       //console.log(err);
       //console.log(resp);
        if(resp){
          window.location = "/index.html";
        }
      })
    };
    
    this.exportjson = function(){
      function download(filename, text) {
        var pom = document.createElement('a');
        pom.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
        pom.setAttribute('download', filename);
        pom.click();
    }
      download('overtask.json',JSON.stringify(gthis.tasks));
    };
    
    $rootScope.exportjson = this.exportjson;
    
    $rootScope.readFile = function(file){

      fileReader.readAsBinaryString(file, $rootScope)
        .then(function(result){

          gthis.loadjson(result);
        })
    }
    
    this.exportBookmarks = function(){makeNetscapeBookmarkHTML(gthis.tasks)};

    this.filtertypes = [
      {
        "id": "0",
        "name": "All Tasks",
        'img':"createatask.png",
        "group": "Filter",
        "filter": {trashed: false, status: 'inprogress'}
      },
      {
        "id": "1",
        "name": "High Priority",
        'img':"notasks.png",
        "group": "Filter",
        "filter": {trashed: false, priority: 3, status: 'inprogress'}
      },
      {
        "id": "2",
        "name": "Medium Priority",
        'img':"notasks.png",
        "group": "Filter",
        "filter": {trashed: false, priority: 2, status: 'inprogress'}
      },
      {
        "id": "3",
        "name": "Low Priority",
        'img':"notasks.png",
        "group": "Filter",
        "filter": {trashed: false, priority: 1, status: 'inprogress'}
      },
      {
        "id": "4",
        "name": "Due Today",
        "group": "Filter",
        'img':"notoday.png",
        "filter": function (item) {
          var duetoday = false;
          var tempdate = new Date(item.duedate);
          //Fixme abstract the trash and complete filters somewhere else
          if (item.status == 'inprogress' && item.trashed == false && item.duedate && tempdate.setHours(0, 0, 0, 0) == today.setHours(0, 0, 0, 0)) {
            duetoday = true;
          }
          return duetoday;
        }
      },
      {
        "id": "5",
        "name": "Due Tomorrow",
        "group": "Filter",
        'img':"notommorow.png",
        "filter": function (item) {
          var duetommorow = false;
          var tommorow = new Date();
          var tempdate = new Date(item.duedate);
          tommorow.setDate(today.getDate() + 1);
          //Fixme abstract the trash and complete filters somewhere else
          if (item.status == 'inprogress' && item.trashed == false && item.duedate && tempdate.setHours(0, 0, 0, 0) == tommorow.setHours(0, 0, 0, 0)) {
            duetommorow = true;
          }
          return duetommorow;
        }
      },
      {
        "id": "6",
        "name": "Shared Tasks",
        "group": "Filter",
        "filter": {shared: true}
      },
      {
        "id": "7",
        "name": "Sort by Date Created",
        "group": "Sort",
        "filter": {},
        "orderby": "startdate"
      },
      {
        "id": "8",
        "name": "Sort by Date Scheduled",
        "group": "Sort",
        "filter": {},
        "orderby": "scheduledate"
      },
      {
        "id": "9",
        "name": "Sort by Due Date",
        "group": "Sort",
        "filter": {},
        "orderby": "duedate"
      },
      {
        "id": "10",
        "name": "Completed",
        "group": "Sort",
        'img':"nocompleted.png",
        "filter": {trashed: false, status: '!inprogress'}
      },
      {
        "id": "11",
        "name": "Trashed",
        "group": "Sort",
        'img':"notrashed.png",
        "filter": {trashed: true}
      },
      {
        "id": "12",
        "name": "Due Next Week",
        "group": "Filter",
        'img':"nothisweek.png",
        "filter": function (item) {
          var duenextweek = false;
          var today = new Date();
          var nextweek = new Date();
          nextweek.setDate(today.getDate() + 7);
          var tempdate = new Date(item.duedate);

          //Fixme abstract the trash and complete filters somewhere else
          if (item.status == 'inprogress' && item.trashed == false && item.duedate && tempdate.setHours(0, 0, 0, 0) <= nextweek.setHours(0, 0, 0, 0) && tempdate> today.setHours(0, 0, 0, 0) ) {
            duenextweek = true;
          }
          return duenextweek;
        }
      },
      {
        "id": "13",
        "name": "Sort by Priority",
        "group": "Sort",
        "filter": {},
        "orderby": "priority"
      },
      {
        "id": "14",
        "name": "Shared with me",
        "group": "Filter",
        "filter": function (item) {
          if(!item.owner || item.owner == "Guest" || item.owner == $rootScope.user){
            return false
          }
          
          return true;
        }
      }
    ];

    this.sorts = [
//      {
//        "id": "0",
//        "name": "Sort by Date Scheduled",
//        "group": "Sort",
//        "filter": {},
//        "orderby": "scheduledate"
//      },
      {
        "id": "0",
        "name": "Most recently launched",
        "group": "Sort",
        "filter": {},
        "orderby": [function(task){ return new Date(task.opentimes[task.sessionnum].timeopened);},true,0]
      },
      {
        "id": "1",
        "name": "Sort by Due Date",
        "group": "Sort",
        "filter": {},
        "orderby": [function(task){return new Date(task.duedate);},false,1]
      },
      {
        "id": "2",
        "name": "Sort Descending Priority",
        "group": "Sort",
        "filter": {},
        "orderby": ["-priority",false,2]
      },
      {
        "id": "3",
        "name": "Sort by Newest Tasks",
        "group": "Sort",
        "filter": {},
        "reversee":true,
        "orderby": [function(task){return new Date(task.startdate);},true,3]
      },
      {
        "id": "4",
        "name": "Sort by Oldest Tasks",
        "group": "Sort",
        "filter": {},
        "orderby": [function(task){return new Date(task.startdate);},false,4]
      }
    ];

    var sfilter = localStorage.getItem('filterid')||0;
    this.filterset = this.filtertypes[sfilter];

    var sorder = localStorage.getItem('orderbyid')||0;
    this.orderby = this.sorts[sorder].orderby;
    this.registerListeners(this);

  }]).directive('fileInput', function ($parse) {
    return {
      restrict: "EA",
      template: "<input type='file' />",
      replace: true,          
      link: function (scope, element, attrs) {

          var modelGet = $parse(attrs.fileInput);
          var modelSet = modelGet.assign;
          var onChange = $parse(attrs.onChange);

          var updateModel = function () {
              scope.$apply(function () {
                  modelSet(scope, element[0].files[0]);
                  onChange(scope);
              });                    
          };
           
          element.bind('change', updateModel);
      }
  };
  });
