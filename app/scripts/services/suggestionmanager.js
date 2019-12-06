/* get remote suggestions
provide formatted suggestions for listing
categorize tabs based on URL
calculate user preferences
upload crowd sourced suggestions to remote
*/

angular.module('overtaskApp')
  .service('suggestionmanager',['loginmanager','pouch','$log','chromeBackgroundPage','$q','$rootScope', function (loginmanager,pouch,$log,chromeBackgroundPage,$q,$rootScope) {

    this.suggestions = [];
    
    /**
     * Creates a suggestion in the format used by overtask
     * @constructor
     * @param tab
     * @returns {Suggestion}
     */
    function Suggestion(tab,meta){
      
        this.title = tab.title;
        this.category = meta.category;
        //Consider cases of URLs. Should be correctly formatted if tab is "real"
        this.url = tab.url;
        this.keywords = [];
        this.relevance = {};
      
    }
    
    $rootScope.suggestions = [
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

//    if (!$rootScope.suggestions || $rootScope.suggestions[0] == undefined) {
//
//      $rootScope.suggestions = [];
//
//      pouch.suggestionsdb.allDocs({
//        include_docs : true
//      }, function(err, response) {
//          response.rows.forEach(function(row) {
//            // console.log(row)
//            if (row.doc.suggestions) {
//              row.doc.suggestions.forEach(function(suggestion){
//                $rootScope.suggestions.push(suggestion);
//              });
//
//            }
//          });
//        $rootScope.$apply();
//      });
//    }
    
    //FIXME Stub
    this.process = function(tab,task,meta){
      //Compare to local suggestions
      var defered = $q.defer()
    
      //TODO compare to remote suggestions
      defered.resolve(meta||{'category':'research'});
      
      return defered.promise;
    };
    
      //FIXME into actual serviced style
      /** Creates, weighs and updates suggestions based on tab category & task category */
      function addSuggestion(tab){
        var url = tab.url.toLowerCase();
        var category = tab.category;
        var pathArray = url.split('/');
        var host = pathArray[2];
        // url = protocol + '://' + host;
        // TODO: Make it update exisiting suggestions with a hitcount
        //     instead of just pushing new entries
        
        var existingSuggestion = false;
        
        for(var i=0;i<$scope.suggestions.length-1;i++){
          var suggestion = $scope.suggestions[i];
          if (url == suggestion.url) {
            existingSuggestion = true;
            $scope.suggestions[$scope.suggestions.length-1].relevance =
              $scope.suggestions[$scope.suggestions.length-1].relevance || {};
            $scope.suggestions[$scope.suggestions.length-1].relevance[$scope.task.category.toLowerCase()] = 
              $scope.suggestions[$scope.suggestions.length-1].relevance[$scope.task.category.toLowerCase()] + 1;
          }
        }
        
        if(!existingSuggestion){
          
          var title = tab.title || url;
          var querystringloc = url.indexOf('?');

          if(querystringloc > 0){
            title = url.substring(0, querystringloc);
          }
          $scope.suggestions.push({
            title : title,
            category : category,
            url : url.toLowerCase(),
            keywords : [],
            relevance : {}
          });
          
          $scope.suggestions[$scope.suggestions.length-1].keywords.push($scope.task.category.toLowerCase());
          
          $scope.suggestions[$scope.suggestions.length-1].relevance[$scope.task.category.toLowerCase()] = 1;
        }
        
        pouch.suggestions.put($scope.suggestionsdb, function(err,
            response) {
          //console.log(err)
          $scope.suggestionsdb._id = response.id;
          $scope.suggestionsdb._rev = response.rev;
          //TODO implement web2py serverside suggestion pushing
//          Pouch.replicate(pouch.suggestions, pouch.remotesuggestions);
        });
      }
      
      this.addSuggestion = function(){}//addSuggestion;
  }]);


function unused(){

//If no suggestions (suggestion replication/pull failed
// make mock blank suggestions
// Should be in an init function

if ($rootScope.suggestions[0] == undefined) {

  $scope.suggestionsdb = {};
  $rootScope.suggestions = [];

  pouch.suggestionsdb.allDocs({
    include_docs : true
  }, function(err, response) {
    $scope.$apply(function() {

      response.rows.forEach(function(row) {
        // console.log(row)
        if (row.doc.suggestions) {
          $rootScope.suggestions.push(row.doc);
        }
      });

      if($rootScope.suggestions.length==0){
        $scope.suggestionsdb.temp = true;
        $scope.suggestions = [ {
          url : "www.google.com",
          category : "research",
          title : "Google"
        } ];
      }else{
        $scope.suggestionsdb = $rootScope.suggestions[0];
        //console.log($rootScope.suggestions[0])
        $scope.suggestions = $scope.suggestionsdb.suggestions;
      }
    });
  });

} else {
  $scope.suggestionsdb = $rootScope.suggestions[0];
  //console.log($rootScope.suggestions[0])
  $scope.suggestions = $scope.suggestionsdb.suggestions;
}

    $rootScope.suggestions = [];
    var suggestionsdb = this.suggestionsdb;
    this.suggestionsdb.allDocs({
        include_docs : true
    }, function(err, response) {
        //$scope.$apply(function() {
        if(response.rows.length == 0){
            this.remotesuggestionsdb = PouchDB('https://juvionedeareforecidsolds:CKsWaFhF0Xclx8pAdAKUN1c2@overtask.cloudant.com/suggestions',
                {auth:{username:'juvionedeareforecidsolds',password:'CKsWaFhF0Xclx8pAdAKUN1c2'}});
            Pouch.replicate(this.remotesuggestions,this.suggestions);

            suggestionsdb.allDocs({
                include_docs : true
            }, function(err, response) {
                //$scope.$apply(function() {

                response.rows.forEach(function(row) {
                    // console.log(row)
                    if (row.doc.suggestions) {
                        $rootScope.suggestions.push(row.doc);
                    }
                });

                if($rootScope.suggestions.length == 0){

                    Pouch.replicate(pouch.remotesuggestionsdb,pouch.suggestionsdb);

                }
            });
        }
    });
}