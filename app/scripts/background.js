'use strict';

if (!Array.prototype.forEach) {
  Array.prototype.forEach = function (fun /*, thisp*/) {
    var len = this.length;
    if (typeof fun != "function")
      throw new TypeError();

    var thisp = arguments[1];
    for (var i = 0; i < len; i++) {
      if (i in this)
        fun.call(thisp, this[i], i, this);
    }
  };
}

var currenttask = {};
localStorage.setItem('currenttask',JSON.stringify(currenttask));
var buildingdbs = false;
var changecounter = 0
function backgroundpouch(callback) {
//  if(buildingdbs ===true){return;};
//  buildingdbs = true;
//  setTimeout(function(){buildingdbs = false;}, 1000)
  var a = {};
  ++changecounter
  //console.log(changecounter)
//  PouchDB = Pouch;
//New PouchDB

//this.taskimages = new PouchDB('taskimages',{'adapter':'idb'});
  a.suggestions = new PouchDB('suggestions',{'adapter':'idb'});
//this.contacts = new PouchDB("contacts",{'adapter':'idb'});
  a.untrackedurls = new PouchDB("untracked", {'adapter': 'idb'});

  //Couchappy
//  a.suggestionsdb = PouchDB('https://otsuggestions:apikeyASD@overtask.couchappy.com/suggestions');
//  
//  PouchDB.replicate(a.suggestionsdb,a.suggestions);
  
  if (localStorage.getItem("api") != undefined && localStorage.getItem("api") != "undefined" ) {
    //console.log('creating remote from background')
    a.tasks = new PouchDB('tasks'+localStorage.getItem("api"), {'adapter': 'idb'});
    //PouchDB.replicate('tasks',a.tasks,function(err,resp){if(resp){PouchDB.destroy('tasks');}});
    
    
    a.remotetasks = PouchDB('https://' + localStorage.getItem("api") + ':' + localStorage.getItem("key") + localStorage.getItem("dbu"),
      {auth: {username: localStorage.getItem("api"), password: localStorage.getItem("key")}});
    
  }else{
    a.tasks = new PouchDB('tasks', {'adapter': 'idb'});
  }
  
  //Iriscouch
  //this.remotesuggestions = Pouch('http://pana.iriscouch.com/suggestions');
  //this.remotetasks = Pouch('http://pana.iriscouch.com/tasks');

  //Cloudant
  //a.suggestions = PouchDB('https://juvionedeareforecidsolds:CKsWaFhF0Xclx8pAdAKUN1c2@overtask.cloudant.com/suggestions')
  //  {auth: {username: 'juvionedeareforecidsolds', password: 'CKsWaFhF0Xclx8pAdAKUN1c2'}});
  //if (localStorage.getItem("api") != undefined) {
  //  a.remotetasks = PouchDB('https://' + localStorage.getItem("api") + ':' + localStorage.getItem("key") + localStorage.getItem("dbu"),
  //    {auth: {username: localStorage.getItem("api"), password: localStorage.getItem("key")}});
  //}
  ;
//
  return a;
}



var extensionID = "dmnodiekgdampalbafckohlbbkahdaeg";
var pouch = backgroundpouch();
var blocks = {};

function rebuilddbs(callback){
  
  //Stop databases from getting closed untill all windows have registered completion
  //console.log(i);
  for(var i in blocks){
    if(blocks.hasOwnProperty(i)){
      //console.log(blocks)
      setTimeout(function(){rebuilddbs(callback);}, 100);
      return;
    };
  }
  if(localStorage.getItem('changingdbs')!='true'){
    if(callback){
      //setTimeout(function(){
        callback();
       // }, 500)
      
    }; 
    return
  }
    //localStorage.setItem('loggingin',localStorage.getItem('loggedin'));
    localStorage.setItem('changingdbs','');
    pouch = backgroundpouch();
    
    if(callback){
    //  setTimeout(function(){
        callback();
        }
    //  , 500)
    //};

}

chrome.runtime.onMessageExternal.addListener(function callback(message, sender, sendResponse) {
  if (message.getCurrentTask) {
    sendResponse({taskid: localStorage.getItem("currenttask")});
  }

  if (message.launchTask) {
    launchTask(message.launchTask);
  }
  
  if (message.closealltabs) {
    closealltabs(message.closealltabs);
  }

  if (message.checkExtension) {
    sendResponse({isextension: true});
  }
  if (message.postdoc) {
    pouch.tasks.post(message.postdoc, function (err, response) {
      sendResponse({err: err, response: response});
      if (response) {
        chrome.runtime.sendMessage({updatetasks: true});
      }
    });
  }
  if (message.putdoc) {
    pouch.tasks.put(message.postdoc, function (err, response) {
      sendResponse({err: err, response: response});
      if (response) {
        chrome.runtime.sendMessage({updatetasks: true});
      }
    });
  }
  if (message.query) {
    ////console.log(message)
    pouch.tasks.query(message.query, message.reduce, function (err, response) {
      sendResponse({err: err, response: response});
    });
  }
  if (message.getid) {
    pouch.tasks.get(message.getid, function (err, response) {
      sendResponse({err: err, response: response});
    });
  }
  if (message.getalldocs) {
    pouch.tasks.allDocs({
      include_docs: true
    }, function (err, response) {
      sendResponse({err: err, response: response});
    });
  }
  return true;
});

function minilaunchTask(task) {
	localStorage.setItem("savingstate", "false");
	  chrome.tabs.query({currentWindow: true}, function (browsertabs) {
		    chrome.tabs.query({currentWindow: true, active: true}, function (windowtabs) {
		    task.windowid = windowtabs[0].windowId;
		    task.currenttask = true;
		    task.sessionnum = task.sessionnum + 1 || 1;
		    task.opentimes[task.sessionnum] = {};
		    task.opentimes[task.sessionnum].timeopened = new Date().toString();
		
		    
		    pouch.tasks.put(task, function (err, response) {
		
		      //TODO figure out if we need to handle conflict errors
		      ////console.log(err)
		      if (err == undefined) {
		       // removetasklisteners();
		       // addtasklisteners();
		        task._rev = response.rev;
		
		        var oldcurrenttaskstate = JSON.parse(localStorage.getItem("currenttask")) || {};
		        oldcurrenttaskstate[windowtabs[0].windowId] = task._id;
		        
		        localStorage.setItem("currenttask", JSON.stringify(oldcurrenttaskstate));
		        currenttask[windowtabs[0].windowId] = task;
		        chrome.runtime.sendMessage({task: task, opening: true, rev: response.rev});
		        response = null;
		      }
    			});
		    });
	  });
}

function launchTask(task,windowid) {
  localStorage.setItem("savingstate", "true");
  localStorage.setItem('closing','false');
  //console.log("launching")
  //console.log(task)
  //Checking to look if we're launching a new task,
  //or launching a currently active page where the background
  //page closed
  pouch.tasks.get(task._id, function (err, doc) {
    var tabstoclose = [];
    var urlstoopen = [];
    //console.log(doc)
    task = doc;
    task.windowid = windowid;
    currenttask[task.windowid] = task;
    //console.log(task)
    //task = currenttask;
    //chrome.windows.update(windowid, {focused:true}, function(updatedwindow){
    if (localStorage.getItem('lasttaskclosed') == task._id) {
      //console.log('matching tabs')
      //matchTabs(task, closeAllTabsAndLaunch);
      closeAllTabsAndLaunch(task, false);
      task = null;
      doc = null;
    }
    else {
      //console.log('launching afresh because')
      //console.log(task.id, task._id)
      ////console.log(task)
      localStorage.setItem('lasttaskclosed', task._id);
      chrome.tabs.query({windowId: windowid, active: true}, function (tab) {
        chrome.tabs.query({windowId: windowid}, function (tabs) {
          for (var i = 0; i < tabs.length; i++) {
            if (tabs[i].id != tab[0].id && !tabs[i].pinned) {
              urlstoopen.push(tabs[i].url);
              var found = false;
              //FIXME check if this works
              task.tabs.forEach(function (tasktab) {
                if (tasktab.url == tabs[i].url && !tasktab.closed) {
                  found = true;
                }
                ;
              });
              if (!found) {
                tabstoclose.push(tabs[i].id);
              }
            }
          }
          pouch.untrackedurls.post({
            _id: 'untracked',
            'url': urlstoopen
          });
          var closedtabs = 0;
          if (tabstoclose.length > 0) {
            tabstoclose.forEach(function (tabid) {
              chrome.tabs.remove(tabid, function () {
                if (closedtabs + 1 >= tabstoclose.length) {
                  tabstoclose = null;
                  urlstoopen = null;
                  closeAllTabsAndLaunch(task,false,windowid);
                  tab = null;
                  tabs = null;
                }
                else {
                  ////console.log(closedtabs+1>=tabstoclose.length);
                  closedtabs++;
                }
              });
            });
          } else {
            tabstoclose = null;
            urlstoopen = null;
            closeAllTabsAndLaunch(task,false,windowid);
            tab = null;
            tabs = null;
          }
        });
      });
    }
  });
  //});
}

function closeAllTabsAndLaunch(task, dontopen,windowid) {
  ////console.log("closing and launching")
  ////console.log(task)
  localStorage.setItem("savingstate", "false");
  chrome.tabs.query({windowId: windowid}, function (browsertabs) {
    chrome.tabs.query({windowId: windowid, active: true}, function (windowtabs) {

      task.tabs.forEach(function (tab) {

        if (tab.closed == undefined) {
          tab.closed = false;
        }

        if (tab.closed == false) {

          //scan each open tab to find match
          var found = false;
          browsertabs.forEach(function (browsertab) {
            if (browsertab.url == tab.url) {
              found = true;
              tab.id = browsertab.id;
              tab.title = browsertab.title;
            }
          });

          if (!found && !dontopen) {
            //Open urls with chrome's tab method
            chrome.tabs.create(
              {
                url: tab.url,
                windowId: windowid,
                active: false
              }, function (restab) {
                //callback that updates tab id
                //console.log('opening tab')
                //console.log(dontopen)
                tab.id = restab.id;
                tab.title = restab.title;
              });
          }
          ;
        }
        ;
      });

      //localStorage.setItem("currenttask",task.id);
      //task.windowid = windowtabs[0].windowId;
      task.currenttask = true;
      task.sessionnum = task.sessionnum + 1 || 1;
      task.opentimes[task.sessionnum] = {};
      task.opentimes[task.sessionnum].timeopened = new Date();

      removetasklisteners();
      addtasklisteners();

      pouch.tasks.put(task, function (err, response) {

        //TODO figure out if we need to handle conflict errors
        ////console.log(err)
        if (err == undefined) {
          task._rev = response.rev;
          //console.log(task);
          var oldcurrenttaskstate = JSON.parse(localStorage.getItem("currenttask"))||{};
          if(!oldcurrenttaskstate||oldcurrenttaskstate =="null"){oldcurrenttaskstate = {}};
          oldcurrenttaskstate[windowtabs[0].windowId] = task._id;
          
          localStorage.setItem("currenttask", JSON.stringify(oldcurrenttaskstate));
          currenttask[windowtabs[0].windowId] = task;
          chrome.runtime.sendMessage({task: task, opening: true, rev: response.rev});
        }
      });
    });
  });
}

function getSuggestions(callback) {
  var suggestions = [];
  pouch.suggestions.allDocs({
    include_docs: true
  }, function (err, response) {
    response.rows.forEach(function (row) {
      // //console.log(row)
      if (row.doc.suggestions) {
        suggestions.push(row.doc);
      }
    });
    ////console.log(suggestions)
    //if(callback){
    if(!suggestions[0] || suggestions[0].length ==0){
      suggestions[0] = {};
      suggestions[0].suggestions=offlinesuggestions;
      pouch.suggestions.put(offlinesuggestions);
    }
    callback(suggestions[0].suggestions);
    //}
    //return suggestions;
  });
}

function closetabintask(task, tabId) {

  for (var i = 0; i < task.tabs.length; i++) {
    if (task.tabs[i].id == tabId) {
      if (task.tabs[i].url.search("source=web") > 0
        || task.tabs[i].url.search("#sclient=") > 0
        || task.tabs[i].url.search("#output=search&sclient=") > 0
        ) {
        task.tabs.splice(i, 1);
      } else {
        ////console.log("removing tab");
        task.tabs[i].id = null;
        task.tabs[i].closed = true;
        task.tabs[i].timeclosed = new Date().toString();
        //FIXME wtf
        if (task.tabs[i].category && task.tabs[i].category.toLowerCase() == "communicate") {
          task.tabs[i]._deleted = true;
        }
        task.tabs[i].opentimes[task.tabs[i].sessionnum] = {"timeclosed": new Date().toString()};
        //FIXME send message  
      }
    }
  }
  saveTaskState(task);
}

var currentlyprocessing = {};

//var suggestions = getSuggestions();
var listenerlist = {
  'onTabRemoved': function (tabId, removeInfo) {
    //Figure out if task is stored as variable or needs to be fetched from the local db
    if (currenttask[removeInfo.windowId]) {
      closetabintask(currenttask[removeInfo.windowId], tabId);
    }
    else if(localStorage.getItem("currenttask")){
      var taskid = JSON.parse(localStorage.getItem("currenttask"))[removeInfo.windowId];
      if (taskid) {
        pouch.tasks.get(taskid, function (err, task) {
          if (task) {
            closetabintask(task, tabId);
          }
        });
      }
    }

  },
  //Used to close tabs on backbutton press back to newtab page
  'tabupdatelistener': function(tabId, changeInfo, tab){
    //console.log('Tab changed');
    //console.log(tabId);
    //console.log(changeInfo);
    //console.log(tab)
    if(changeInfo.url == "chrome://newtab/#/task"){
      //console.log('urlmatched');
        if (currenttask[tab.windowId]) {
          //FIXME dedup duplicated code here
          //FIXME figureout
          //console.log('inside a current task')
          if (localStorage.getItem("closing") != "true") {
            //console.log('not closing')
              var match = currenttask[tab.windowId].tabs.filter(function(el,index,array) {
                if(el.id == tabId && !el.closed){
                  //console.log('got an el');
                  return el;
                }
              });
            //console.log(match)
              if(match[0]){
                //console.log('marking as closed and saving')
                currenttask[tab.windowId].tabs[currenttask[tab.windowId].tabs.indexOf(match[0])].closed = true;
                //console.log(currenttask[tab.windowId]);
                saveTaskState(currenttask[tab.windowId]);
              }
          }
        }
    }

//    if (currenttask[removeInfo.windowId]) {
//      //FIXME dedup duplicated code here
//      //FIXME figureout
//      if (localStorage.getItem("closing") != "true") {
//        chrome.tabs.get(tabId, function (tab) {
//          syncChromeTabsToTaskTabs(tab, tabId, currenttask[removeInfo.windowId], saveTaskState);
//        });
//      }
//    } else {
//      //Write for extension
//      var taskid = JSON.parse(localStorage.getItem("currenttask"))[removeInfo.windowId];
//      if (localStorage.getItem("closing") != "true" && taskid) {
//        chrome.tabs.get(tabId, function (tab) {
//          pouch.tasks.get(taskid, function (err, task) {
//            if (task && tab) {
//              syncChromeTabsToTaskTabs(tab, tabId, task, saveTaskState);
//            }
//          });
//        });
//      }
//    }
  },
  "navlistener": function (details) {
    
    ////console.log(changeInfo)
    ////console.log("webnav")
    //console.log(details)
//      $scope.badsites.forEach(function(url) {
//      if (tab.url.search(url) > 0) {
//      alert("Productivity killer detected!");
//      }
//      });
    if(!details.tabId){
      //console.log("no tab"); 
      return
      }

    
    
    var tabId = details.tabId;
    chrome.tabs.get(tabId, function (tab) {
      if(!tab){
        console.log('no tab');
        return
      }
    if(currentlyprocessing[details.tabId]){
      return;
    }
    
    
    if (currenttask[tab.windowId]) {
      //FIXME dedup duplicated code here
      //FIXME figureout
      if (localStorage.getItem("closing") != "true" && tab.status == 'complete') {
        currentlyprocessing[details.tabId] = true;
          syncChromeTabsToTaskTabs(tab, tabId, currenttask[tab.windowId], saveTaskState);
      }
    } else {
      //Write for extension
      var taskid = JSON.parse(localStorage.getItem("currenttask"))[tab.windowId];
      if (localStorage.getItem("closing") != "true" && taskid ) {
          pouch.tasks.get(taskid, function (err, task) {
            if (task && tab) {
              syncChromeTabsToTaskTabs(tab, tabId, task, saveTaskState);
            }
          });
      }
    }});

  }
};

chrome.windows.onRemoved.addListener(function(windowId){
  if(currenttask[windowId]){
    closealltabs(currenttask[windowId]);
  }
});
  

function addtasklisteners() {
  ////console.log("adding listeners");

  chrome.tabs.onUpdated.addListener(listenerlist.tabupdatelistener);
  chrome.tabs.onRemoved.addListener(listenerlist.onTabRemoved);
  chrome.webNavigation.onCompleted.addListener(listenerlist.navlistener,
    {url: [
      {urlContains: 'http://'},
      {urlContains: "https://"}
    ]});
}

function removetasklisteners() {
  ////console.log("removing listeners");

  chrome.tabs.onUpdated.removeListener(listenerlist.tabupdatelistener);
  chrome.tabs.onRemoved.removeListener(listenerlist.onTabRemoved);
  chrome.webNavigation.onCompleted.removeListener(listenerlist.navlistener);
}


//chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
//  //  $scope.badsites.forEach(function(url) {
//  //  if (tab.url.search(url) > 0) {
//  //  alert("Productivity killer detected!");
//  //  }
//  //dd a comment to this line
//  //  });
//  //console.log(tab)
//  //console.log(changeInfo)
//  //console.log(tabId)
//  if(localStorage.getItem("closing")=="false"){ 
//    var taskid = localStorage.getItem("currenttask");
//    if(taskid){
//      pouch.tasks.get(taskid, function(err, task){
//        if(task){
//          syncChromeTabsToTaskTabs(tab,tabId,task);
//        }
//      });
//    }
//    }
//   });
function findDuplicateTabs(tab, tabId, task) {
  var duplicate = false;
  
  
  for (var i = 0; i < task.tabs.length; i++) {
    if (task.tabs[i].id == tab.id) {
      console.log("removing changed tab");
      
      console.log('closing old version of tab'+tab.id+' that had url '+task.tabs[i].url);
      task.tabs[i].id = null;
      task.tabs[i].closed = true;
      task.tabs[i].timeclosed = new Date().toString();
      
     // if(duplicate){

      //}else{
        
     // }
      
      //FIXME break here is more optimal, but without gives redundancy
      //break
      
      //return duplicate;
    }
  }
  duplicate = findDuplicateClosedTabs(tab, tabId, task);
  
  return duplicate;
}

function findDuplicateClosedTabs(tab, tabId, task){
  for (var i = 0; i < task.tabs.length; i++) {
    if(task.tabs[i].url ==  tab.url && task.tabs[i].closed){
      task.tabs[i].title = tab.title || tab.url.substring(0, tab.url.indexOf('?'));
      if(!(tab.title == "") && task.tabs[i].title == tab.title){
        //Give extra info if task name is identical
        task.tabs[i].title = task.tabs[i].title + ' ' + tab.url.substring(0, tab.url.indexOf('?'))
      }
      task.tabs[i].id = tab.id;
      task.tabs[i].closed = false;
      saveTaskState(task);
      //return true;
      //duplicate = true;
      console.log('reopening old version of tab'+tab.id+' that had url '+task.tabs[i].url);
      return true;
    }
    //if ((task.tabs[i].url.replace(/^\/+|\/+$/g, '') == tab.url.replace(/^\/+|\/+$/g, ''))){
      //FIXME add tab open session here
    //  return true;
   // }
  }
  return false;
}

//Not using this because we are allowing for duplicates of the same site now
function oldfindDuplicateTabs(tab, tabId, task) {
  var duplicate = false;
  var numdup = 0;
  //FIXME it works, but we have to figure out how strict we want to be with duplicates
  //FIXME This doesn't actually work because it is on a per tab basis, not iterating over all tabs
  //array of indexes of tracked task-tabs that could be matched
  //to actual chrome-tabs
  //var foundtabs = [];
  ////console.log('looking for duplicates');
  //Look at each task-tracked tab
  for (var i = 0; i < task.tabs.length; i++) {
    //Compare urls ignoring trailing /es
    //console.log('comparing '+ task.tabs[i].url.replace(/^\/+|\/+$/g, '')+' to '+ tab.url.replace(/^\/+|\/+$/g, ''))
    if ((task.tabs[i].url.replace(/^\/+|\/+$/g, '') == tab.url.replace(/^\/+|\/+$/g, '')
      )) {
      //Identify duplicate tab, and update existing tab with title and id details
      // for first instance, delete following tabs
      if (!duplicate) {
        duplicate = true;
        numdup++;
        task.tabs[i].id = tab.id;
        ////console.log("tab id at duplicate check:" + tab.id)
        task.tabs[i].title = tab.title || tab.url.substring(0, tab.url.indexOf('?'));
        ;
        if(!(tab.title == "") && task.tabs[i].title == tab.title){
          task.tabs[i].title = task.tabs[i].title + ' ' + tab.url.substring(0, tab.url.indexOf('?'))
        }
        task.tabs[i].closed = false;
        //foundtabs.push(i)
        ////console.log("duplicate");
      } else if (numdup > 1) {
        ////console.log($scope.task.tabs[i].url.replace(/^\/+|\/+$/g,''), '==', tab.url.replace(/^\/+|\/+$/g,''))
        ////console.log($scope.task.tabs[i].title, '==', tab.title)
        ////console.log("removing because double duplicate")
        //Fixme desirable but dangerous
        //chrome.tabs.remove(tab.id);
      } else {
        numdup++;
      }
    } else if (task.tabs[i].id == tab.id) {
      ////console.log("removing changed tab");
      task.tabs[i].id = null;
      task.tabs[i].closed = true;
      task.tabs[i].timeclosed = new Date();
      //FIXME WTF
//      if(task.tabs[i].category.toLowerCase() == "communicate")
//      {
//        task.tabs[i]._deleted = true;
//      }
    }
    else {
      ////console.log("tab id comparison check new tab id:" + tab.id)
      ////console.log("tab id comparison check stored tab id:" + task.tabs[i].id)
    }
  }
  if (duplicate) {
    saveTaskState(task);
  }
  return duplicate;
}

/** Synchronize Opened Chrome tabs to the Task tabs */
function syncChromeTabsToTaskTabs(tab, tabId, task, callback) {
  console.log('syncing tab');
  ////console.log(tab);
  if (tab.url && tab.status == 'complete' && tab.url.search("chrome://") < 0) {
    ////console.log(tab)
    var duplicate = findDuplicateTabs(tab, tabId, task);
    //console.log('valid complete tab');
    
    //Derive tracked-task-tabs from opened urls that haven't been tracked
    if (!duplicate && !tab.pinned) {
      //console.log('non duplicate tab')
      var category = "research";
      //Auto categorize tab according to suggestions
      getSuggestions(function (suggestions) {
        suggestions.forEach(function (suggestion) {
          ////console.log(suggestion)
          if (tab.url.search(suggestion.url) > -1 && suggestion.category) {
            category = suggestion.category;
            ////console.log("found this site suggested in:",
            //    suggestion.category);
          }
        });
        //add tab to tracked task tabs
        console.log('adding new tab'+tab.id+' that has url '+tab.url);
        task.tabs.push({
          url: tab.url,
          category: category,
          id: tab.id,
          title: tab.title || tab.url.substring(0, tab.url.indexOf('?')),
          opentimes: [
            {'timeopened': new Date().toString()}
          ],
          sessionnum: 0,
          closed: false,
          comments: []
        });

        //update task in localdb
        //saveTaskState(task);
        delete currentlyprocessing[tabId];
        if(callback){
          callback(task);
        }
        
      });
    }
    else{
      delete currentlyprocessing[tabId];
      callback(task);
    }
  }else{
    delete currentlyprocessing[tabId];
    callback(task);
  }
}

var addComment = function (task) {

}

// Ensure that there aren't multiple tabs tracked as "open" with the same tab ID.
// Cannot check during creation process because of async adding.
var deduplicateTaskTabs = function (task) {
  ////console.log('before dedup')
  ////console.log(task);
  task.tabs.forEach(function (tab) {
    if (tab.closed == false) {
      var duplicates = task.tabs.filter(function (element, index, array) {
        var result = false
        if (element.id == tab.id && element.closed == false) {
          result = true;
        }
        ;
        return result;
      });
      ////console.log('num duplicates:'+duplicates.length)

      if (duplicates.length > 1) {
        for (var i = 1; i < duplicates.length; i++) {
          duplicates[i].duplicate = true;
        }
      }
    }
  });

  task.tabs.forEach(function (tab) {
    if (tab.duplicate) {
      var index = task.tabs.indexOf(tab);
      task.tabs.splice(index, 1);
    }
  });
  ////console.log('post dedup')
  ////console.log(task);
}

var saveTaskState = function (task) {

  //console.log("attempting to save");
  ////console.log(localStorage.getItem("savingstate") =="false")
  //task.tabs.forEach(function(tab){
  //findDuplicateTabs(tab,tab.id,task);
  //});
  //deduplicateTaskTabs(task);

  if (localStorage.getItem("savingstate") != "true" && localStorage.getItem("closing") != "true") {
    localStorage.setItem("savingstate", "true");
	//console.log('saving')
	  //pouch.tasks._info(function(er,info){
	    //console.log(er);//console.log('saving in');//console.log(info)})
	  //}
    pouch.tasks.put(task, function (err, response) {

      //console.log(err)
      //console.log(response)
      if (err == undefined) {
        ////console.log("updating rev id to"  + response.rev)
        task._id = response.id;
        task._rev = response.rev;
        //FIXME WTF
        task.tabs[task.tabs.length - 1];

        if (localStorage.getItem("closing") != "true") {
          currenttask[task.windowid] = task;
          chrome.runtime.sendMessage({task: task});
        }
//	if(!pouch.remotetasks && localStorage.getItem('api')){
//	pouch.remotetasks = PouchDB('https://' + localStorage.getItem("api") + ':' + localStorage.getItem("key") + localStorage.getItem("dbu"),
//   	   {auth: {username: localStorage.getItem("api"), password: localStorage.getItem("key")}});
//	}
        //Sync to server
        //TODO: Sync conditionally
//        if (pouch.remotetasks) {
//          //console.log("replicateattempt")
//          PouchDB.replicate(pouch.remotetasks, pouch.tasks,  function (err, response){
//          PouchDB.replicate(pouch.tasks, pouch.remotetasks, function (err, response) { //limit with, {'doc_ids': task._id}
//
//    	    //console.log(response)
//            //console.log(err)
//            if (err) {
//              syncStateMessage("Sync Error");
//            } else {
//              syncStateMessage("Sync At" + new Date);
//            }
//          });
//          });
//        }
      } else if (err.error = 'conflict') {
        pouch.tasks.remove(task, function (err, response) {
          console.log('tryng to save again')
          //saveTaskState(task);
        });
      }

      localStorage.setItem("savingstate", "false");
    });
  }
};


function closealltabs(task,callback) {
  removetasklisteners();
  //TODO check if tabs to close are in untracked tabs to open
  //console.log("closing task");
  localStorage.setItem("closing", "true");
  localStorage.setItem('lasttaskclosed', task.id);
  
  var oldcurrenttaskstate = JSON.parse(localStorage.getItem("currenttask")) || {};
  delete oldcurrenttaskstate[task.windowid];
  if(oldcurrenttaskstate){
    for(var i in oldcurrenttaskstate){
      if(oldcurrenttaskstate.hasOwnProperty(i)){
        if(oldcurrenttaskstate[i] == task._id){
          delete oldcurrenttaskstate[task.windowid];
        }
      }
    }
  }
  //console.log(task);
  //console.log(oldcurrenttaskstate);
  localStorage.setItem("currenttask", JSON.stringify(oldcurrenttaskstate));
  delete currenttask[task.windowid];
  for(i in currenttask){
    if(currenttask.hasOwnProperty(i)){
      if(currenttask[i] == task._id){
        delete currenttask[task.windowid]
      }
    }
  }
  
  var winid = task.windowid;
  task.windowid = null;
  task.currenttask = false;
  
  //FIXME works, but I dont know why...
  function recursiveDupDelete(index,task){
    if(index == task.tabs.length){
      return task;
    }
    if(task.tabs[index]._deleted){
      delete task.tabs[index];
    }
    index = index + 1;
    return recursiveDupDelete(index, task);
  }
  
  //pouch.tasks._info(function(er,info){//console.log(er);//console.log('saving in');//console.log(info)})
  pouch.tasks.put(task, function (err, response) {
    //FIXME Check if using newtabpage
    chrome.tabs.query({windowId: winid, active: true}, function (tab) {
      chrome.tabs.query({windowId: winid}, function (tabs) {
        for (var i = 0; i < tabs.length; i++) {
          if (tabs[i].id != tab[0].id && !tabs[i].pinned) {
            chrome.tabs.remove(tabs[i].id);
          }
        }
        //Sync to server

        //currenttask[task.windowid] = null;

        //send message to taskpage
        localStorage.setItem('closing','false')
        chrome.runtime.sendMessage({close: {windowid:winid}});
        if(callback){
          callback();
        }
      });
    });
  });
}

function sync(){
    PouchDB.replicate(pouch.tasks, pouch.remotetasks,function(err,resp){
      PouchDB.replicate(pouch.tasks, pouch.remotetasks);
    });
}

function syncStateMessage(message) {

  chrome.runtime.sendMessage({sync: message});
}

function syncNTabs(tabs,task,callback,nBack){
  //console.log('syncntabs')
  var nBack = nBack || 0;
  syncChromeTabsToTaskTabs(tabs[nBack], tabs[nBack].id, task, function(ctask){
    if(nBack == tabs.length-1){
      //console.log('synced '+nBack+' tabs')
      callback(ctask);
    }else{
      //console.log('syncing tab '+nBack)
      syncNTabs(tabs,ctask,callback,++nBack)
    }
  });
}

function matchTabs(task, callback) {
//Match opened tabs with urls
//FIXME: Fix this
  //console.log(chrome)
  chrome.tabs.query({currentWindow: true}, function (tabs) {
    // chrome.tabs.remove(tabs);
    // var tempTabs = angular.copy($scope.task.tabs)
    //console.log(tabs)
    var tempTabs = task.tabs;

    //Theoretically adds each tab from the window into the current task
    //FIXME saves too many times & is async

    syncNTabs(tabs, task, function(task){


    //checks all tabs in window, for if they are actually in the task tabs
    //adds index of found tabs to an array to see all of the tabs that have been found
    var j = 0;
    var runout = false;
    var foundtabs = [];
    for (var i = 0; i < tabs.length; i++) {
      ////console.log("matching tab");
      j = 0;
      runout = false;
      var tab = tabs[i];
      var found = false;
      while (tempTabs.length > 0 && !runout) {
        if (tempTabs[j].url.replace(/^\/+|\/+$/g, '') == tab.url.replace(/^\/+|\/+$/g, '')) {

          tempTabs[j].id = tab.id;
          tempTabs[j].title = tab.title;
          foundtabs.push(j);
          found = true;
        }
        j++;
        if (j > tempTabs.length - 1) {
          runout = true;
        }
        ;
      }
      if (!found && tab.url.search("chrome") < 0 && !tabs[i].pinned) {
        chrome.tabs.remove(tab.id);
      }
    }

    //marks all tabs that have not been found to be in the window as closed
    for (var k = 0; k < tempTabs.length; k++) {
      if (foundtabs.indexOf(k) < 0) {
        //console.log("marking tab closed");
        tempTabs[k].closed = true;
        tempTabs[k].timeclosed = new Date();
        tempTabs[k].id = null;
        //FIXME more wtf
      }
    }
    var doneopening = true;
    if (callback) {
      callback(task, true);
    }else{
      saveTaskState(task);
    }
  });
  });
}

var offlinesuggestions =  [
                           {
                             "url": "https://www.google.com",
                             "title": "Google",
                             "category": "research",
                             "keywords": [
                              "general"
                             ],
                             "relevance": {
                              "general": 100
                             },
                             "$$hashKey": "006"
                            },
                            {
                             "url": "http://lifehacker.com/",
                             "title": "LifeHacker",
                             "category": "research",
                             "keywords": [
                              "general"
                             ],
                             "relevance": {
                              "general": 50
                             },
                             "$$hashKey": "006"
                            },
                            {
                             "url": "http://www.wikihow.com/Main-Page",
                             "title": "WikiHow",
                             "category": "research",
                             "keywords": [
                              "general"
                             ],
                             "relevance": {
                              "general": 50
                             }
                            },
                            {
                             "url": "http://www.quora.com/",
                             "title": "Quora",
                             "category": "research",
                             "keywords": [
                              "general"
                             ],
                             "relevance": {
                              "general": 50
                             }
                            },
                            {
                             "url": "http://www.howstuffworks.com/",
                             "title": "HowStuffWorks",
                             "category": "research",
                             "keywords": [
                              "general"
                             ],
                             "relevance": {
                              "general": 50
                             }
                            },
                            {
                             "url": "https://www.google.com/maps/",
                             "title": "Google Maps",
                             "category": "research",
                             "keywords": [
                              "general"
                             ],
                             "relevance": {
                              "general": 50
                             }
                            },
                            {
                             "url": "https://scholar.google.com",
                             "title": "Google Scholar",
                             "category": "research",
                             "keywords": [
                              "general"
                             ],
                             "relevance": {
                              "general": 50
                             }
                            },
                            {
                             "url": "http://www.reference.com/",
                             "title": "Reference.com",
                             "category": "research",
                             "keywords": [
                              "general",
                              "writing"
                             ],
                             "relevance": {
                              "general": 50,
                              "writing": 50
                             }
                            },
                            {
                             "url": "http://mashable.com/",
                             "title": "Mashable",
                             "category": "research",
                             "keywords": [
                              "general"
                             ],
                             "relevance": {
                              "general": 50
                             },
                             "$$hashKey": "006"
                            },
                            {
                             "title": "Facebook",
                             "category": "communicate",
                             "url": "https://www.facebook.com",
                             "keywords": [
                              "general"
                             ],
                             "relevance": {
                              "general": 1
                             }
                            },
                            {
                             "title": "Yahoo! Mail",
                             "category": "communicate",
                             "url": "https://mail.yahoo.com",
                             "keywords": [
                              "general"
                             ],
                             "relevance": {
                              "general": 1
                             }
                            },
                            {
                             "title": "Koding",
                             "category": "do",
                             "url": "https://koding.com",
                             "keywords": [
                              "programming"
                             ],
                             "relevance": {
                              "programming": 3
                             },
                             "$$hashKey": "009"
                            },
                            {
                             "title": "Cloud9",
                             "category": "do",
                             "url": "https://c9.io",
                             "keywords": [
                              "programming"
                             ],
                             "relevance": {
                              "programming": 3
                             },
                             "$$hashKey": "009"
                            },
                            {
                             "title": "Pastebin",
                             "category": "do",
                             "url": "https://pastebin.com",
                             "keywords": [
                              "programming"
                             ],
                             "relevance": {
                              "programming": 3
                             }
                            },
                            {
                             "title": "CodeAcademy",
                             "category": "do",
                             "url": "http://www.codecademy.com/",
                             "keywords": [
                              "programming"
                             ],
                             "relevance": {
                              "programming": 3
                             }
                            },
                            {
                             "title": "Wikipedia",
                             "category": "research",
                             "url": "https://www.wikipedia.org",
                             "keywords": [
                              "general"
                             ],
                             "relevance": {
                              "general": 3
                             }
                            },
                            {
                             "title": "SeventhSanctum Text Generator",
                             "category": "research",
                             "url": "http://www.seventhsanctum.com/",
                             "keywords": [
                              "writing"
                             ],
                             "relevance": {
                              "writing": 3
                             }
                            },
                            {
                             "title": "Daily Writing Tips",
                             "category": "research",
                             "url": "http://www.dailywritingtips.com/",
                             "keywords": [
                              "writing"
                             ],
                             "relevance": {
                              "writing": 3
                             }
                            },
                            {
                             "title": "Writer's Digest",
                             "category": "research",
                             "url": "http://www.writersdigest.com/",
                             "keywords": [
                              "writing"
                             ],
                             "relevance": {
                              "writing": 3
                             }
                            },
                            {
                             "title": "Drive",
                             "category": "do",
                             "url": "https://drive.google.com",
                             "keywords": [
                              "general",
                              "work"
                             ],
                             "relevance": {
                              "general": 3,
                              "work": 3
                             }
                            },
                            {
                             "title": "GMail",
                             "category": "communicate",
                             "url": "https://mail.google.com",
                             "keywords": [
                              "general",
                              "work"
                             ],
                             "relevance": {
                              "general": 3,
                              "work": 3
                             }
                            },
                            {
                             "title": "KeepRecipies",
                             "category": "do",
                             "url": "http://keeprecipes.com/",
                             "keywords": [
                              "cooking"
                             ],
                             "relevance": {
                              "cooking": 3
                             }
                            },
                            {
                             "title": "Prezi",
                             "category": "do",
                             "url": "http://prezi.com/",
                             "keywords": [
                              "general",
                              "work"
                             ],
                             "relevance": {
                              "general": 3,
                              "work": 3
                             }
                            },
                            {
                             "title": "Dropbox",
                             "category": "do",
                             "url": "https://www.dropbox.com",
                             "keywords": [
                              "general",
                              "work"
                             ],
                             "relevance": {
                              "general": 3,
                              "work": 3
                             }
                            },
                            {
                             "title": "Evernote",
                             "category": "do",
                             "url": "https://evernote.com/",
                             "keywords": [
                              "general",
                              "work",
                              "personal"
                             ],
                             "relevance": {
                              "personal": 3,
                              "general": 3,
                              "work": 3
                             }
                            },
                            {
                             "title": "Lucidchart",
                             "category": "do",
                             "url": "https://www.lucidchart.com/",
                             "keywords": [
                              "general",
                              "work",
                              "programming"
                             ],
                             "relevance": {
                              "programming": 3,
                              "general": 3,
                              "work": 3
                             }
                            },
                            {
                             "title": "Stack Overflow",
                             "category": "research",
                             "url": "http://stackoverflow.com/",
                             "keywords": [
                              "programming"
                             ],
                             "relevance": {
                              "programming": 3
                             }
                            },
                            {
                             "title": "Google Developer Courses",
                             "category": "research",
                             "url": "https://developers.google.com/university/courses/",
                             "keywords": [
                              "programming"
                             ],
                             "relevance": {
                              "programming": 3
                             }
                            },
                            {
                             "title": "Khan Academy Computer Science",
                             "category": "research",
                             "url": "https://www.khanacademy.org/cs/tutorials/programming-basics",
                             "keywords": [
                              "programming"
                             ],
                             "relevance": {
                              "programming": 3
                             }
                            },
                            {
                             "title": "Hacker News",
                             "category": "research",
                             "url": "https://news.ycombinator.com/",
                             "keywords": [
                              "programming"
                             ],
                             "relevance": {
                              "programming": 3
                             }
                            },
                            {
                             "title": "Mozilla Developer Network",
                             "category": "research",
                             "url": "https://developer.mozilla.org/en-US/learn",
                             "keywords": [
                              "programming"
                             ],
                             "relevance": {
                              "programming": 3
                             }
                            },
                            {
                             "title": "Youtube",
                             "category": "research",
                             "url": "https://www.youtube.com",
                             "keywords": [
                              "general"
                             ],
                             "relevance": {
                              "general": 3
                             }
                            },
                            {
                             "title": "Google+",
                             "category": "communicate",
                             "url": "https://plus.google.com",
                             "keywords": [
                              "general"
                             ],
                             "relevance": {
                              "general": 3
                             }
                            },
                            {
                             "title": "GitHub",
                             "category": "do",
                             "url": "https://www.kongregate.com",
                             "keywords": [
                              "fun"
                             ],
                             "relevance": {
                              "fun": 3
                             }
                            },
                            {
                             "title": "Food Network",
                             "category": "research",
                             "url": "http://www.foodnetwork.com/",
                             "keywords": [
                              "cooking"
                             ],
                             "relevance": {
                              "cooking": 3
                             }
                            },
                            {
                             "title": "BitBucket",
                             "category": "do",
                             "url": "https://bitbucket.org",
                             "keywords": [
                              "programming"
                             ],
                             "relevance": {
                              "programming": 3
                             }
                            }
                           ]
