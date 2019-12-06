/**
 * get chrome background page
 * send messages
 * listen for callbacks
 */

angular.module('overtaskApp')
    .service('chromeBackgroundPage',['$q', function ($q) {

        //Observer pattern
        var observerCallbacks = [];

        var gthis = this;
        //register an observer
        this.registerObserverCallback = function(callback){
            observerCallbacks.push(callback);
            if(gthis.backgroundpage){
              //for (i in gthis.backgroundpage){ 
              //  if (gthis.backgroundpage.currenttask.hasOwnProperty(i)){
                 // console.log(i)
                callback(); 
              //return;
             //   }
             // };
            }
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


        //FIXME implement some kind of async $q provision for this
        this.backgroundpage = {};
        //this.backgroundpage.currenttask = {};



        var getbackgroundpage = function(pthis){
            var deffered = $q.defer();

            chrome.runtime.getBackgroundPage(
                function (background) {
                    deffered.resolve(background);
                    //console.log(pthis)
                    pthis.backgroundpage = background;
                    //console.log("notifying")
                    //console.log(background)
                    notifyObservers();
                });

            return deffered.promise;
        };

        getbackgroundpage(this).then(function(resp){
          //console.log(resp)
          });
        


        this.listenerslist = {};

        /**
         * @function
         * @param opts
         * Object{
     *    unique //whether or not there can be multiple instances of this listener active
     *    listenonce //whether or not listener should be unregistered after one successful call
     *    }
         * @param callback
         * function returns true if successfully called
         *
         */
        this.registerListener = function (opts, callback) {

            /**
             * Find a new namespace for the listener in the listenerstore if not
             * unique
             */
            if (!opts.unique) {
                var oname = opts.name;
                var iter = 0;
                while (this.listenerslist[opts.name]) {
                    iter++;
                    opts.name = oname + iter;
                };
            } else {
                chrome.runtime.onMessage.removeListener(this.listenerslist[opts.name]);
            }
            ;

            /**
             * Makes listeners delete themselves after they have been successfully triggered once
             */
            if (opts.listenonce) {
                var ocallback = callback;
                callback = function (pthis) {
                    if (ocallback(message, sender)) {
                        //console.log("killing listener " + opts.name)
                        chrome.runtime.onMessage.removeListener(pthis.listenerslist[opts.name]);
                    }
                };
            }

            this.listenerslist[opts.name] = callback;
            //console.log("adding listener " + opts.name)
            chrome.runtime.onMessage.addListener(this.listenerslist[opts.name]);
        };

        this.removeAllListeners = function () {
            for (var listener in this.listenerslist) {
                if (this.listenerslist.hasOwnProperty(listener)) {
                    chrome.runtime.onMessage.removeListener(listener);
                }
            }
        };

    }]);