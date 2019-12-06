/* authenticate user & handle returned credentials
 * store current user & password/credentials
 * sign user out
 */

angular.module('overtaskApp')
  .service('loginmanager', function loginmanager($log) {
    
    //TODO fix into proper initilaized login. Comes from main.js ln 30
    this.user = localStorage.getItem("u");
    
    this.getUser = function(){
      return this.user;
    };
    
  });