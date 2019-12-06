'use strict';
//Pouch stub, expand for testing
//var Pouch = function(){
//  if(this){
//    this.remove = function(opts,callback){};
//    this.get = function(opts,callback){callback({},{'url':[]})};
//    this.post = function(opts,callback){callback({},[])}
//    this.allDocs = function(opts,callback){callback({},{'rows':[{'doc':{'name':"test",'trashed':false,'status':'inprogress'}},{'doc':{'name':"test",'trashed':false,'status':'inprogress'}},{'doc':{'name':"test",'trashed':false,'status':'inprogress'}},{'doc':{'name':"test",'trashed':false,'status':'inprogress'}},{'doc':{'name':"test",'trashed':false,'status':'inprogress'}}]})}
//  }else
//    {
//    return({"post":function(opts,callback){callback({},[{},{},{},{},{}])},'allDocs' : function(opts,callback){callback({},{'rows':[]})}})
//    }
//
//}
//var PouchDB = Pouch;

angular.module('overtaskApp')
  .service('pouch',['$rootScope', '$http', function ($rootScope, $http) {
	  //console.log("pouchserviceinit")
//	  this.tasks = Pouch('idb://tasks');
//	  this.suggestions = Pouch('idb://suggestions');
//	  this.contacts = Pouch("idb://contacts");
//	  this.untrackedurls = Pouch("idb://untracked");

//	  New PouchDB

	  //var ltasks = this.tasks;
	  this.tasks = [];
	  //var tasks = this.tasks;

//	  $rootScope.tasks = [];
//	  this.tasksdb.allDocs({
//      include_docs : true
//    }, function(err, response) {
//      //$scope.$apply(function() {
//        response.rows.forEach(function(row) {
//          if (row.doc.name) {
//            $rootScope.tasks.push(row.doc);
//          }
//          $rootScope.$apply();
//        });
//      //});
//    });


//	  this.taskimages = new PouchDB('taskimages',{'adapter':'idb'});
	  this.suggestionsdb = new PouchDB('suggestions',{'adapter':'idb'});
//    if(!localStorage.getItem('suggestionsupdated') || new Date(localStorage.getItem('suggestionsupdated')) < new Date().setDate(new Date().getDate() - 1)){
//      this.remotesuggestionsdb = PouchDB('https://juvionedeareforecidsolds:CKsWaFhF0Xclx8pAdAKUN1c2@overtask.cloudant.com/suggestions',
//        {auth:{username:'juvionedeareforecidsolds',password:'CKsWaFhF0Xclx8pAdAKUN1c2'}});
//      //Pouch.replicate(this.remotesuggestionsdb,this.suggestionsdb);
//      localStorage.setItem('suggestionsupdated',new Date())
//    };

//	  this.contacts = new PouchDB("contacts",{'adapter':'idb'});
	  this.untrackedurlsdb = new PouchDB("untracked",{'adapter':'idb'});
//
//	  this.remotesuggestions = this.suggestions;
//	  this.remotetasks = this.tasks;
	  //Iriscouch
	  //this.remotesuggestions = Pouch('http://pana.iriscouch.com/suggestions');
	  //this.remotetasks = Pouch('http://pana.iriscouch.com/tasks');

	  //Cloudant

	  if(localStorage.getItem("api")!=undefined && localStorage.getItem("api")!="undefined"){
	    console.log('creating remote db' + localStorage.getItem("api"));
	    if(localStorage.getItem("dbu").indexOf('couchappy')>0){
              portDatabase($http);
            }
	    this.tasksdb = new PouchDB('tasks'+localStorage.getItem("api"), {'adapter': 'idb','auto_compaction':true});


		  this.remotetasksdb = PouchDB('https://'+localStorage.getItem("api")+':'+localStorage.getItem("key")+localStorage.getItem("dbu"),
				  {auth:{username:localStorage.getItem("api"),password:localStorage.getItem("key")}});
      //Automatic replication from remote database. Going to do it only once.
		  //PouchDB.replicate(this.remotetasksdb,this.tasksdb,{
      //  onChange: function(err,res){console.log('taskdb changed')},
      //  complete: function(err,res){console.log('finish task replication');$rootScope.$apply()}
      //});
		  this.remotesharedtasks = new PouchDB('https://'+localStorage.getItem("api")+':'+localStorage.getItem("key")+'couchdb-d310a2.smileupps.com/sharedtasks');

	  }else{
	    this.tasksdb = new PouchDB('tasks',{'adapter':'idb'});
	  };
  }]);


  function portDatabase($http){
      var username = localStorage.getItem('u');
      var password = localStorage.getItem('p');
      var auth = btoa(username + ':' + password);
    $http(
            {
              method : 'GET',
              headers : {
                "Authorization" : "Basic " + auth// +"=="
              },
                url : 'https://overtaskme.appspot.com/overtaskserver/default/portDatabase.json'
              //url : 'https://'+ encodeURIComponent(username) +":"+ password +'@overtaskme.appspot.com/OverTask/default/getCouchCreds.json'
            }).success(
            function(data, status, headers, config) {

              ////console.log("attempt")
              console.log(data)
              localStorage.setItem("u",data.username);
              localStorage.setItem("email",data.email);
              localStorage.setItem("p",   password);
              localStorage.setItem("api", data.apikey);
              localStorage.setItem("key", data.apipassword);
              localStorage.setItem("dbu", data.taskdb);

              //TODO Add confirmation action
              //$rootScope.loginstatus = "Successfully Logged In";
              //console.log('loginsuccess');
              //loginprocess();


            }).error(function(data, status, headers, config){
             //console.log("loginfail")
             localStorage.setItem('lastsynced',null);
             ////console.log(data)
             ////console.log(status)
             ////console.log(headers())
             ////console.log(config)
              alert('Your task database has been ported to a new system. Please sign out and sign in again to re-authenticate');
              //TODO add error popup
              //$rootScope.loginstatus = "Incorrect Email or Password";
            });
  }
