angular
    .module('overtaskApp')
    .controller(
        'ChromeAppsController',function(){});
 var castub =  function($scope, $rootScope) {
          
        //chrome appslist
          function compare(a, b) {
              return (a > b) ? 1 : (a == b ? 0 : -1);
            }

          function compareByName(app1, app2) {
            return compare(app1.name.toLowerCase(), app2.name.toLowerCase());
          }
          // Returns the largest size icon, or a default icon, for the given |app|.
          $rootScope.getAppIconURL=function (app) {
            if (!app.icons || app.icons.length == 0) {
              return chrome.extension.getURL('icon.png');
            }
            var largest = {size:0};
            for (var i = 0; i < app.icons.length; i++) {
              var icon = app.icons[i];
              if (icon.size > largest.size) {
                largest = icon;
              }
            }
            return largest.url;
          };
          
          $rootScope.launchApp = function(id){
              chrome.management.launchApp(id);
              window.close(); // Only needed on OSX because of crbug.com/63594
            };
          
          chrome.management.getAll(function(info) {
            var actualapps = [];
              var appCount = 0;
              for (var i = 0; i < info.length; i++) {
                if (info[i].appLaunchUrl) {
                  appCount++;
                  actualapps.push(info[i]);
                }
              }
              if (appCount == 0) {
               // $('search').style.display = 'none';
               // $('appstore_link').style.display = '';
                return;
              }
              $rootScope.appslist = actualapps.sort(compareByName);
          });
          
        }
    //   );