//Track tabs
//In-memory Data storage + source
//persistence
//synchronization

//Auth for sync


//Fix library screwup
PouchDB = Pouch;

//In memory global vars

var currenttask = {};
var suggestions = {};

//For connection to OverTaskMINI
//TODO ensure this is correct
var extensionid = "dmnodiekgdampalbafckohlbbkahdaeg";

function backgroundpouch(){

  //New PouchDB
  this.tasks = new PouchDB('tasks',{'adapter':'idb'});
  this.suggestions = new PouchDB('suggestions',{'adapter':'idb'});
  this.untrackedurls = new PouchDB("untracked",{'adapter':'idb'});
  
  //Cloudant
  //TODO figure out if initialization fits better in background or in foreground
  //  a.remotesuggestions = PouchDB('https://juvionedeareforecidsolds:CKsWaFhF0Xclx8pAdAKUN1c2@overtask.cloudant.com/suggestions',
  //      {auth:{username:'juvionedeareforecidsolds',password:'CKsWaFhF0Xclx8pAdAKUN1c2'}});
  
  //FIXME stronger login checking
  if(localStorage.getItem("api")!=undefined){
    a.remotetasks = PouchDB('https://'+localStorage.getItem("api")+':'+localStorage.getItem("key")+localStorage.getItem("dbu"),
        {auth:{username:localStorage.getItem("api"),password:localStorage.getItem("key")}});
  };
}


var listeners = {
    'externalListeners':function callback(message ,sender, sendResponse){
      if(message.getCurrentTaskID){
        sendResponse({taskid:localStorage.getItem("currenttask")});
      }
      
      if(message.getCurrentTask){
        sendResponse({task:currenttask});
      }
      
      if(message.launchTask){
        launchTask(message.launchTask);
      }
      
      if(message.closealltabs){
        closealltabs(message.closealltabs);
      }
      
      if(message.checkExtension){
        sendResponse({isextension:true});
      }
      if(message.postdoc){
        pouch.tasks.post(message.postdoc,function(err, response) {
          sendResponse({err:err,response:response});
          if (response){
            chrome.runtime.sendMessage({updatetasks:true});
          }
        });
      }
      if(message.putdoc){
        pouch.tasks.put(message.postdoc,function(err, response) {
          sendResponse({err:err,response:response});
          if (response){
            chrome.runtime.sendMessage({updatetasks:true});
          }
        });
      }
      if(message.query){
        console.log(message)
        pouch.tasks.query(message.query,message.reduce,function(err, response) {
          sendResponse({err:err,response:response});
        });
      }
      if(message.getid){
        pouch.tasks.get(message.getid,function(err, response) {
          sendResponse({err:err,response:response});
        });
      }
      if(message.getalldocs){
        pouch.tasks.allDocs({
          include_docs : true
        }, function(err, response) {
          sendResponse({err:err,response:response});
        });
      }
      return true;
    }
};

function registerBackgroundAPIListeners(){
  chrome.runtime.onMessageExternal.addListener(listeners.externallisteners);
};

//FIXME figure out if this should go in an initializor or be unregistered at some point
registerBackgroundAPIListeners();


//Saves untracked tabs
//Compares currently open tabs to tabs to be opened
//Closes tabs that don't need to be re-opened
//calls further launch function
function saveAndCloseUntrackedTabs(task){
  console.log("launching")
  console.log(task)
  var tabstoclose = [];
  var urlstoopen = [];
  currenttask = task;
  task = currenttask;
  chrome.tabs.query({currentWindow:true,active:true},function(tab) {
    chrome.tabs.query({currentWindow:true},function(tabs) {
        for ( var i = 0; i < tabs.length; i++) {
          if (tabs[i].id != tab[0].id && !tabs[i].pinned) {
            urlstoopen.push(tabs[i].url);
            var found = false;
            //FIXME check if this works
            task.tabs.forEach(function(tasktab){
              if(tasktab.url==tabs[i].url && !tasktab.closed){
                found = true;
              };
            });
            if(!found){
              tabstoclose.push(tabs[i].id);
            }
      }
    }
    pouch.untrackedurls.post({
      _id : 'untracked',
      'url' : urlstoopen
    });
    var closedtabs = 0;
    if(tabstoclose.length > 0){
      tabstoclose.forEach(function(tabid){
        chrome.tabs.remove(tabid,function(){
          if(closedtabs+1>=tabstoclose.length){
            closeAllTabsAndLaunch(task);
          }
          else
          {
            console.log(closedtabs+1>=tabstoclose.length);
            closedtabs++;
          }
        });
      });
    }else{
      closeAllTabsAndLaunch(task);
    }
  });
  });
}


//Doesn't close any tabs :|
//Compares currently open tabs with tabs in browser
//Opens tabs that haven't  been found
//Updates task metadata
//Persists task
//Sends launch message
function syncOpenTabsToTaskTabsAndLaunch(task)
{
  console.log("closing and launching")
  console.log(task)
  
  chrome.tabs.query({currentWindow:true},function(browsertabs) {
    chrome.tabs.query({currentWindow:true,active:true},function(windowtabs) {
      
      task.tabs.forEach(function(tab)
          {
  
        if (tab.closed == undefined)
        {
          tab.closed = false;
        }
  
        if (tab.closed == false)
        {                   
          
          //scan each open tab to find match
          var found = false;
          browsertabs.forEach(function(browsertab){
            if(browsertab.url == tab.url){
              found = true;
              tab.id = browsertab.id;
              tab.title = browsertab.title;
            }
          });
          
          if(!found){
          //Open urls with chrome's tab method
            chrome.tabs.create(
                {
                  url : tab.url,
                  active : false
                }, function(restab) 
                {
                  //callback that updates tab id
                  tab.id = restab.id;
                  tab.title = restab.title;
                });
          };         
        };
      });
    
    //localStorage.setItem("currenttask",task.id);
    task.windowid = windowtabs[0].windowId;
    task.currenttask = true;
    task.sessionnum = task.sessionnum + 1 || 1;
    task.opentimes[task.sessionnum] = {};
    task.opentimes[task.sessionnum].timeopened = new Date();
    
    removetasklisteners();
    addtasklisteners();
    
    pouch.tasks.put(task, function(err, response) {
       console.log(err)
      task._rev = response.rev;
     
      localStorage.setItem("currenttask",task._id);
      currenttask = task;
      chrome.runtime.sendMessage({task:task,opening:true,rev:response.rev});
      });
    });
  });
}


var listenerlist = {
    'onTabRemoved':function(tabId, removeInfo) {
      //Figure out if task is stored as variable or needs to be fetched from the local db
      if(currenttask){
        closetabintask(currenttask,tabId);
      }
      else{
        var taskid = localStorage.getItem("currenttask");
        if(taskid){
          pouch.tasks.get(taskid, function(err, task){
            if(task){
              closetabintask(task,tabId)
            }
          });
        }
      }
     
    },
    "navlistener":function(details) {
      //console.log(changeInfo)
      console.log("webnav")
      console.log(details)
//      $scope.badsites.forEach(function(url) {
//      if (tab.url.search(url) > 0) {
//      alert("Productivity killer detected!");
//      }
//      });
      var tabId = details.tabId;
      if(currenttask){
        //FIXME dedup duplicated code here
        //FIXME figureout 
        if(localStorage.getItem("closing")!="true"){ 
          chrome.tabs.get(tabId,function(tab){        
               syncChromeTabsToTaskTabs(tab,tabId,currenttask);
          });
        }
      }else{
        var taskid = localStorage.getItem("currenttask");
        if(localStorage.getItem("closing")!="true" && taskid){ 
          chrome.tabs.get(tabId,function(tab){        
              pouch.tasks.get(taskid, function(err, task){
                if(task && tab){
                  syncChromeTabsToTaskTabs(tab,tabId,task);
                }
              });
          });
        }
      }
      
    }
};

function addtasklisteners(){
  console.log("adding listeners");
  chrome.tabs.onRemoved.addListener(listenerlist.onTabRemoved);
  chrome.webNavigation.onCompleted.addListener(listenerlist.navlistener,
      {url:[{urlContains: 'http://'},{urlContains:"https://"}]});
}

function removetasklisteners(){
  console.log("removing listeners");
  chrome.tabs.onRemoved.removeListener(listenerlist.onTabRemoved);
  chrome.webNavigation.onCompleted.removeListener(listenerlist.navlistener);
}
