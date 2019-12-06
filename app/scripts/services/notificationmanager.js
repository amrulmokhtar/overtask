/**
 * Created by ryan on 1/9/14.
 */

angular.module('overtaskApp')
  .service('notificationmanager',['$timeout', function ($timeout) {
      function Notification(description,meta){

        //Text that appears in the bar
        this.description = description;
        //Either link, info or undo
        this.type = meta.type;
        this.upseconds = 10;
        if(this.type == 'link'){
          this.link = meta.link;
        }else if(this.type == 'undo'){
          this.undoaction = meta.undoaction;
        }
      }

    this.backlog = [];

    function countdown(pthis,notification){
      //console.log("countdown" + notification.upseconds)
      if(notification.upseconds==0){
        pthis.backlog=pthis.backlog.splice(1);
      }else{
        notification.upseconds = notification.upseconds - 1;
        $timeout(function(){countdown(pthis,notification)},1000);
      }
    }

    this.track = function(pthis,description,meta){

      pthis.backlog[0] = (new Notification(description,meta));
      if(pthis.backlog.length >=20){
        //pthis.backlog=pthis.backlog.splice(1)
      }

      //fixme broken countdown timer
      //countdown(pthis,pthis.backlog[pthis.backlog.length-1])
    };

    this.undo = function(pthis, notification){
      notification.undoaction();
      pthis.backlog.pop();
    }

    this.remove = function(pthis,notification){
      //pthis.backlog=pthis.backlog.splice(0);
    }
  }])