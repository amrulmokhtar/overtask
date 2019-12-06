angular
    .module('overtaskApp')
    .controller(
        'WalkthroughCtrl',
        function($scope, $rootScope) {});
var tstub=        function($scope, $rootScope) {
// Walkthrough
          $rootScope.step = 0;
          $rootScope.stepClass = ["createnewtask","currentask","tabpage","tabcategories","dotab","researchtab","communicatetab","viewtab","completetask","synctask"];
          
          $rootScope.skipTutorial = function(){
            //console.log("hiding"+ $rootScope.stepClass[$rootScope.step]);
            $("."+$rootScope.stepClass[$rootScope.step-1]).hide();
          };
          
          $rootScope.startWalkthrough = function(){
//            console.log("starting walkthrough....");
            $rootScope.step = 0;
            $rootScope.nextStep();
          };
          
          // TODO: link steps when switching pages
          $rootScope.steptabpage = function(){
//            console.log("moving on to step 2");
            $rootScope.step = 2;
            $rootScope.nextStep();
          };
          
          $rootScope.nextStep = function(){
//            console.log("step: " + $rootScope.step);
//            console.log("class: " + $rootScope.stepClass[$rootScope.step]);
            if ($rootScope.step!=0) {
              $("."+$rootScope.stepClass[$rootScope.step-1]).hide();
            }
            $("."+$rootScope.stepClass[$rootScope.step]).show();
            $rootScope.step++;
          };
          
          if(localStorage.getItem("taskwalk")==undefined)
          {
            $rootScope.startWalkthrough();
            localStorage.setItem("taskwalk","done");
          }
        }
  //    );