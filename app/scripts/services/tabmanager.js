/* track current browser tabs
 save all untracked tabs to be closed on task launch and re-opened on task suspend or completion
 */

angular.module('overtaskApp')
  .service('tabmanager', ['loginmanager', 'pouch', '$log', '$q', function (loginmanager, pouch, $log, $q) {

    var opentabs = []
    this.opentabs = opentabs;

    //Deferred wrapping for chrome's tabs.create
    this.add = function (url, opts) {
      var defered = $q.defer();

      chrome.tabs.create({
        url: url
      }, function (tab) {
        defered.resolve(tab);
      });
      return defered.promise;
    };

    /**Essentially a deferred wrap for chrome's "getCurrentTab" */
    this.getCurrentTab = function (pthis) {
      var defered = $q.defer();
      chrome.tabs.getCurrent(function (tab) {
        //console.log("tab is")
        var tab = {'pthis': pthis, 'currentTab': tab}
        //console.log('tab' + tab)
        defered.resolve(tab);
      });
      return defered.promise;
    };

    /**A deferred wrap for chrome's "getAllInWindow" - pinned tabs & the current tab
     * Used when closing & launching tasks
     * TODO implement comparison between desired tab state & current tab state to
     * minimize unneccesary reloading
     * */
    this.getAllOtherTabsInWindow = function (pthis, currentTab) {
      var defered = $q.defer();
      //console.log("working on all other tabs")

      chrome.tabs.getAllInWindow(function (tabs) {
        //console.log("rawallothertabsare")
        //console.log(tabs)
        var otherTabs = [];
        for (var i = 0; i < tabs.length; i++) {
          //console.log("looking at tab" + i);
          if (tabs[i].id != currentTab.id && !tabs[i].pinned) {
            //console.log("pushing tab" + i);
            otherTabs.push(tabs[i]);
          }
        }
        //console.log("allothertabsare")
        //console.log({'pthis': pthis, 'tabs': otherTabs})
        //pthis.
        defered.resolve({'pthis': pthis, 'tabs': otherTabs});
      });

      return defered.promise;
    };

    this.closeTabs = function (tabs) {
      //console.log("closing")
      //console.log(tabs)
      chrome.tabs.remove(tabs);
    };

    this.getAllOtherTabs = function(pthis){
      var defered = $q.defer();
      var tabPromise = pthis.getCurrentTab(pthis).then(
        function (result) {
          result.pthis.getAllOtherTabsInWindow(result.pthis, result.currentTab).then(
            function (result) {
              result.pthis.opentabs = result.tabs;
              defered.resolve(result.tabs);
            }
          );
        }
      );
      return defered.promise;
    }

    this.closeAllOtherTabs = function (pthis) {
      var tabPromise = pthis.getCurrentTab(pthis).then(
        function (result) {
          result.pthis.getAllOtherTabsInWindow(result.pthis, result.currentTab).then(
            function (result) {
              result.pthis.closeTabs(result.tabs);
            }
          );
        }
        );

    };


    this.saveTabs = function (tabs) {

    };

    //FIXME opens multiple instances
    //TODO refactor with propper wrapped pouch calls
    this.restoreUntrackedUrls = function () {
      //Restore urls closed when a task is launched
      //console.log('restoring untracked')
      pouch.untrackedurlsdb.get('untracked',
        function (err, response) {
          if (response) {
            response.url.forEach(function (url) {
              // console.log(row)
              //var win = window.open(url, '_blank');
              chrome.tabs.create({
                url: url,
                active: false
              });
            });
            pouch.untrackedurlsdb.remove(response);
          }
        });

    };

  }]);


function notused() {
  chrome.tabs.query({currentWindow: true, active: true}, function (tab) {

    var tabstoclose = [];
    chrome.tabs.getCurrent(function (tab) {
      chrome.tabs.getAllInWindow(function (tabs) {
        for (var i = 0; i < tabs.length; i++) {
          if (tabs[i].id != tab.id && !tabs[i].pinned) {
            tabstoclose.push(tabs[i].id);
//                console.log($rootScope.suggestions[0].suggestions.filter(function(element, index, array){
//                  return tabs[i].url.search(element.url) > -1 
//                })[0])
//                console.log($rootScope.suggestions.filter(function(element, index, array){
//                        return tabs[i].url.search(element.url) > -1 
//                      }))
            var autocategory = 'research';
            var suggestionmatches = $rootScope.suggestions[0].suggestions.filter(function (element, index, array) {
              return tabs[i].url.search(element.url) > -1
            });
            if (suggestionmatches.length > 0) {
              autocategory = suggestionmatches[0].category;
            }
            task.tabs.push(
              {
                url: tabs[i].url,
                id: tabs[i].id,
                title: tabs[i].title,
                comments: [],
                opentimes: [
                  {'timeopened': new Date()}
                ],
                category: autocategory
              });
          }
        }
        chrome.tabs.remove(tabstoclose);


      });
    });
  });
}
    