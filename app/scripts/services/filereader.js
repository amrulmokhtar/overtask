(function (module) {
     
    var fileReader = function ($q, $log) {
 
        var onLoad = function(reader, deferred, scope) {
            return function () {
                scope.$apply(function () {
                    deferred.resolve(reader.result);
                });
            };
        };
 
        var onError = function (reader, deferred, scope) {
            return function () {
                scope.$apply(function () {
                    deferred.reject(reader.result);
                });
            };
        };
 
        var onProgress = function(reader, scope) {
            return function (event) {
                scope.$broadcast("fileProgress",
                    {
                        total: event.total,
                        loaded: event.loaded
                    });
            };
        };
 
        var getReader = function(deferred, scope) {
            var reader = new FileReader();
            reader.onload = onLoad(reader, deferred, scope);
            reader.onerror = onError(reader, deferred, scope);
            reader.onprogress = onProgress(reader, scope);
            return reader;
        };
 
        var readAsDataURL = function (file, scope) {
            var deferred = $q.defer();
             
            var reader = getReader(deferred, scope);         
            reader.readAsDataURL(file);
             
            return deferred.promise;
        };
        
        var readBinaryString = function (file, scope) {
          var deferred = $q.defer();
           
          var reader = getReader(deferred, scope);         
          reader.readAsBinaryString(file);
           
          return deferred.promise;
      };
 
        return {
            readAsBinaryString : readBinaryString,
            readAsDataUrl: readAsDataURL  
        };
    };
 
    module.factory("fileReader",
                   ["$q", "$log", fileReader]);
 
}(angular.module("overtaskApp")));

var fileInput = function ($parse) {
  return {
      restrict: "EA",
      template: "<input type='file' />",
      replace: true,          
      link: function (scope, element, attrs) {

          var modelGet = $parse(attrs.fileInput);
          var modelSet = modelGet.assign;
          var onChange = $parse(attrs.onChange);

          var updateModel = function () {
              scope.$apply(function () {
                  modelSet(scope, element[0].files[0]);
                  onChange(scope);
              });                    
          };
           
          element.bind('change', updateModel);
      }
  };
};

//angular.module('overtaskApp').directive('fileInput', function ($parse) {
//  return {
//    restrict: "EA",
//    template: "<input type='file' />",
//    replace: true,          
//    link: function (scope, element, attrs) {
//
//        var modelGet = $parse(attrs.fileInput);
//        var modelSet = modelGet.assign;
//        var onChange = $parse(attrs.onChange);
//
//        var updateModel = function () {
//            scope.$apply(function () {
//                modelSet(scope, element[0].files[0]);
//                onChange(scope);
//            });                    
//        };
//         
//        element.bind('change', updateModel);
//    }
//};
//});