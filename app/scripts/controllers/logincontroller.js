angular
    .module('overtaskApp')
    .controller('LoginCtrl',
        ['$scope', '$http','$timeout','$rootScope','$modal','$analytics','$window', 'chromeBackgroundPage',
        function($scope, $http,$timeout,$rootScope,$modal,$analytics,$window, chromeBackgroundPage){
      var server = localStorage.getItem('server') || 'https://overtaskme.appspot.com';
      $rootScope.server = server;
      $rootScope.loginpanelopen = false;
      var user = localStorage.getItem('u');
      var api = localStorage.getItem('api');

      $rootScope.md5 = function(item){
        return CryptoJS.MD5(item.toLowerCase()).toString();
      }

      if(user && user.length>4 && api && api.length != "undefined" && api != ''){
        $scope.user = user;
        $rootScope.user = user;
        $rootScope.useremail = localStorage.getItem('email');
        $rootScope.userimage = 'http://www.gravatar.com/avatar/' + CryptoJS.MD5($scope.useremail.toLowerCase()).toString() + "?";
        document.getElementById('userphoto').src = $scope.userimage;
        if(document.getElementById('smalluserphoto')){
          document.getElementById('smalluserphoto').src = $scope.userimage;
        }else{
          $timeout(function(){
            document.getElementById('smalluserphoto').src = $scope.userimage;
          },100);
        }

      }

      chromeBackgroundPage.registerListener({'name': 'loginmanagecallbacks', 'unique': false},
          function callback(message, sender) {
        //console.log('got a message')
        //console.log(message)
        chrome.windows.getCurrent( function(window){
          chrome.tabs.getCurrent( function(tab){
          //console.log('got a window' + window.id)
          if (message.reload) {
            window.location = "/index.html";
          }
          if (message.signin && (window.id != message.windowId || tab.id != message.tabId)) {
            $scope.login(true);
          }
          if (message.signout && (window.id != message.windowId || tab.id != message.tabId)) {
            $scope.signout(true);
          }
          });
        });
      });
//FIXME Web2py issues authentication cookies that get picked up by OT automatically
      // We can use this to provide keys etc from the server, without ever being stored client side
      // for better security
      $scope.login = function(messaged){
        var username = this.username;
        var password = this.password;
        //Overtask server Login Attempt
        ////console.log("attempting to login with" + username + password);
        var auth = btoa(username+':'+password);
        function loginprocess(){
          ////console.log(data);
          //console.log('login process start');
          localStorage.setItem('changingdbs','true');
          chrome.windows.getCurrent( function(window){
          if($rootScope.task && $rootScope.task != null){
            chromeBackgroundPage.backgroundpage.blocks[window.id] = "blocked";
            var taskstore = localStorage.getItem('tasktorelaunch');
            if(!taskstore || taskstore.length == 0){
              taskstore = {};
            }else{
              taskstore = JSON.parse(taskstore);
            }

            taskstore[window.id] = $rootScope.task._id;

            localStorage.setItem('tasktorelaunch', JSON.stringify(taskstore));


            $rootScope.suspendTask($rootScope.task).then(function(){
              delete chromeBackgroundPage.backgroundpage.blocks[window.id];
              chrome.runtime.getBackgroundPage(function(bg){bg.rebuilddbs(function(){
              //  $timeout(function(){
              //    //console.log('got here');
                $window.location.href = "/index.html";
                //window.location = "/index.html";
                //window.location.href = "/index.html";
               // return false;},100)
              });
              });
            });
          };
            //console.log('got here')

            //console.log(messaged);
            //chrome.runtime.sendMessage({mess: messaged, windowId:window.id});
            if(!messaged || messaged == undefined || messaged ===false){

              //console.log('sending cross messages')

              chrome.tabs.getCurrent( function(tab){
              chrome.runtime.sendMessage({signin: true, windowId:window.id, tabId:tab.id});
              });
            }
            localStorage.setItem("repltasks", true);
            chrome.runtime.getBackgroundPage(function(bg){bg.rebuilddbs(function(){
               // $timeout(function(){//console.log('got here');
                $window.location.href = "/index.html";
                //window.location = "/index.html";
                //window.location.href = "/index.html";
               // return false;},100);
              });
              });

          });

      }

        if(messaged ===true){
          loginprocess();
        }else{
        ////console.log(auth)
        $http(
            {
              method : 'GET',
              headers : {
                "Authorization" : "Basic " + auth// +"=="
              },
              url : $scope.server+'/overtaskserver/default/getCouchCreds.json'
              //url : 'https://'+ encodeURIComponent(username) +":"+ password +'@overtaskme.appspot.com/OverTask/default/getCouchCreds.json'
            }).success(
            function(data, status, headers, config) {

              ////console.log("attempt")
              //console.log(data)
              localStorage.setItem("u",data.username);
              localStorage.setItem("email",data.email);
              localStorage.setItem("p",   password);
              localStorage.setItem("api", data.apikey);
              localStorage.setItem("key", data.apipassword);
              localStorage.setItem("dbu", data.taskdb);

              //TODO Add confirmation action
              $rootScope.loginstatus = "Successfully Logged In";
              //console.log('loginsuccess');
              loginprocess();


            }).error(function(data, status, headers, config){
             //console.log("loginfail")
             localStorage.setItem('lastsynced',null);
             ////console.log(data)
             ////console.log(status)
             ////console.log(headers())
             ////console.log(config)
              alert('Incorrect Email or Password');
              //TODO add error popup
              $rootScope.loginstatus = "Incorrect Email or Password";
            });
        }
        };

        $scope.signout = function(messaged){
          localStorage.setItem('changingdbs','true');
          chrome.windows.getCurrent( function(rwindow){
          if($rootScope.task){

            chromeBackgroundPage.backgroundpage.blocks[rwindow.id] = "blocked";
            $rootScope.suspendTask($rootScope.task).then(function(){
              //console.log('deleting block');
              delete chromeBackgroundPage.backgroundpage.blocks[rwindow.id];
            });
          }})
          $http({
                method : 'GET',
                //headers : {
                //  "Authorization" : "Basic " + auth +"=="
                //},
                url : $scope.server+'/overtaskserver/default/user/logout'
                //url : 'https://'+ encodeURIComponent(username) +email":"+ password +'@overtaskme.appspot.com/OverTask/default/getCouchCreds.json'
              }).success(
                  function(data, status, headers, config) {
                    //console.log("server logout")
//                    //console.log(data)
//                    //console.log(status)
              }).error(function(data, status, headers, config){
                //console.log("logout fail");
//                //console.log(data)
//                //console.log(status)

              });
          localStorage.setItem("api", '');
          localStorage.setItem("key", '');
          localStorage.setItem("dbu", '');
          localStorage.setItem("u",'');
          localStorage.setItem("p",'');
          $rootScope.user = undefined;

          if(!messaged || messaged == undefined || messaged ===false){
            chrome.windows.getCurrent( function(rwindow){
              PouchDB.destroy('tasks',function(err,resp){
                //console.log('destroyed tasks')
                chrome.tabs.getCurrent( function(tab){
                chrome.runtime.sendMessage({signout: true, windowId:rwindow.id, tabId:tab.id});
                setReload();
                });
              });
            });
            }else{
              setReload();
            };

          function setReload(){
            chrome.runtime.getBackgroundPage(function(bg){
              $timeout(function(){
              bg.rebuilddbs(function(){
              //console.log('got here');
              $window.location.href = "/index.html";
//             window.location = "/index.html";
//              window.location.href = "/index.html";
              return false;})
              },250);
            });
          };
        };

        $scope.editAccount = function(){
          var modalInstance = $modal.open({
            templateUrl: 'views/partials/modals/editaccount.html',
            scope:$scope,
            controller: function ($scope, $modalInstance) {
              $scope.ok = function (task) {
                $analytics.eventTrack('editedAccount', {  category: 'accountevent', label: user });

                $modalInstance.dismiss('cancel');
                //$scope.$parent.$parent.isCollapsed = false;
              };
  //FIXME make sure the scope shows the correct version
              $scope.cancel = function () {
                $analytics.eventTrack('cancelEditAccount', {  category: 'accountevent', label: user });
                //$log.debug(oldtaskscope)

                $modalInstance.dismiss('cancel');
                //$scope.$parent.$parent.isCollapsed = false;
              };
            }
          });
        };
        $scope.openImportExport = function(){
          var modalInstance = $modal.open({
            templateUrl: 'views/partials/modals/importexport.html',
            scope:$scope,
            controller:['$scope', '$modalInstance', function ($scope, $modalInstance) {
              $scope.ok = function (task) {
                $analytics.eventTrack('importexport', {  category: 'accountevent', label: user });

                $modalInstance.dismiss('cancel');

              };
              //FIXME make sure the scope shows the correct version
              $scope.cancel = function () {

                $modalInstance.dismiss('cancel');
                //$scope.$parent.$parent.isCollapsed = false;
              };
            }]
          });
        };
    }]).directive('autoFillableField', function() {
      return {
        restrict: "A",
        require: "?ngModel",
        link: function(scope, element, attrs, ngModel) {
            setInterval(function() {
                var prev_val = '';
                if (!angular.isUndefined(attrs.xAutoFillPrevVal)) {
                    prev_val = attrs.xAutoFillPrevVal;
                }
                if (element.val()!=prev_val) {
                    if (!angular.isUndefined(ngModel)) {
                        if (!(element.val()=='' && ngModel.$pristine)) {
                            attrs.xAutoFillPrevVal = element.val();
                            scope.$apply(function() {
                                ngModel.$setViewValue(element.val());
                            });
                        }
                    }
                    else {
                        element.trigger('input');
                        element.trigger('change');
                        element.trigger('keyup');
                        attrs.xAutoFillPrevVal = element.val();
                    }
                }
            }, 300);
        }
    };
});
