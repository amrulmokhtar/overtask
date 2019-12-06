/**
 * track current task tabs
format browser tab to overtask tab
manage tabs inside task?
add tab to task
change state of tab (closed/open)
track sharing of tab
track tags on tab
track comments on tab
remove tab from task
 */

angular.module('overtaskApp')
  .service('tasktabmanager', ['$rootScope','tabmanager','taskmanager','suggestionmanager','$log', 
                              function ($rootScope,tabmanager,taskmanager,suggestionmanager,$log) {
    /**
     * Creates a tab in the format used by overtask
     * @constructor
     * @param tabdetails
     * @param meta
     * @returns {TaskTab}
     */
    
    function TaskTab(tab,meta){
      
      this.url = tab.url;$rootScope,tabmanager,taskmanager,suggestionmanager,$log
      //FIXME implement tags instead of categories
      this.category = meta.category;
      this.id = tab.id;
      this.title = tab.title || meta.title || tab.url.substring(0, tab.url.indexOf('?')) || tab.url;
      this.opentimes = [{'timeopened':new Date()}];
      this.closed = false;
      this.comments = [];
        
    };
    
    function TaskTabFactory(tab,meta){
      var tasktab = {};
      tasktab.url = tab.url;
      //FIXME implement tags instead of categories
      tasktab.category = meta.category;
      tasktab.id = tab.id;
      tasktab.title = tab.title || meta.title || tab.url.substring(0, tab.url.indexOf('?')) || tab.url;
      tasktab.opentimes = [{'timeopened':new Date()}];
      tasktab.closed = false;
      tasktab.comments = [];
      return tasktab;
    }
    $rootScope,tabmanager,taskmanager,suggestionmanager,$log
    //FIXME figure out if this is strong enough state linkage between task state, currenttask state, local and remote storage etc.
    //TODO load //taskmanager.currenttask.tabs; on currenttask assignment 
    this.tasktabs = [];
    
    //Creates a new browser tab and tracks it under the tasks' tabs
    this.add = function(url,task,category){
      tabmanager.add(url).then(function(tab){this.track(tab,task,category);});
    };
    
    //converts a browser tab into an overtask tab, processes it for crowdsourcedmetadata and stores it under the taskstabs
    this.track = function(tab,task,meta){
      suggestionmanager.process(tab,task||taskmanager.currenttask,meta).then(
          function(suggestionmeta){
            task.tabs.push(TaskTabFactory(tab,suggestionmeta));
          });
    };
    
    //Tracks all currently open tabs in a window to a given task
    this.addAllTabsTo = function(task){
      tabmanager.getAllOtherTabsInWindow().forEach(
        function(tab){
          this.track(tab,task);
        });
    };
    
    //Stores tab in closed history
    this.close = function(pthis,tab,array){
      //console.log("closing")
      //TODO figure out if this is the best pattern to use
      if(!tab.closed){
        tab.closed = true;
        tab.timeclosed = new Date();
        tabmanager.closeTabs(tab.id);
      }else{
        //console.log("removing")
        pthis.remove(tab,array);
      }
    };
   
    //Removes + Untracks tab completely, 
    this.remove = function(tab,array){
      var index = array.indexOf(tab);
      if(tab.id != null)
        {
          tabmanager.closeTabs(tab.id);
        }
      array.splice(index,1);
    };
    
    this.reopen= function(tab){
      //console.log('reopening')
      tab.closed = false;
      //Open urls with chrome's tab method
      chrome.tabs.create({
        url : tab.url
      }, function(newtab) {
        //callback that updates tab id
        tab.id = newtab.id;
        tab.sessionnum = tab.sessionnum + 1;
        tab.opentimes[tab.sessionnum]={"timeopened":new Date()};
      });
    };
    
    //TODO move into abstracted tab service
    //Helper to switch to tabs from the newtab interface
    this.switchTo = function(tab) {
      //console.log("switching", tab)
      chrome.tabs.update(tab.id, {
        selected : true
      });
    };
    
    //TODO move into seperate service?
    this.addcomment = function(comment,tab,task) {
      //console.log('adding comment')
      //tab.comments[tab.comments.length - 1] = comment;
      if(comment.length < 1){
        return;
      }
      //console.log(tab)
      //$scope.task.tabs[tab].comments.push(comment);
      tab.comments.push({'text':comment,'user':{'name':$rootScope.user||'Guest','email':$rootScope.md5($rootScope.useremail)}})
      //console.log($scope.task)
      //$scope.commententer = "";
      //saveTaskState();
      //console.log(task)
      taskmanager.save(task);
    };
    
    //Remove Duplicate tabs
    //FIXME figure out if function is nec. and works
    this.deduplicateTabs = function(task) {
      //console.log("dedupping")
      task.tabs.forEach(function(tab) {
        if (tab.id == undefined) {
          var nindex = $scope.task.tabs.indexOf(tab);
          task.tabs.splice(nindex, 1);
        } else {

          chrome.tabs.get(tab.id, function(tab) {
            if (tab == undefined) {
              var nindex = $scope.task.tabs.indexOf(tab);
              task.tabs.splice(nindex, 1);
            }
          });
        }
        task.tabs.forEach(function(tab2) {
          if (tab.url == tab2.url) {
            var index = task.tabs.indexOf(tab2);
            task.tabs.splice(index, 1);
            //console.log("dedup", tab.url)
          }
        });
      });
    };    
  }]);