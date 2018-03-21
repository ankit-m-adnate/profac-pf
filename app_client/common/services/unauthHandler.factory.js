(function () {

  angular
    .module('processFactory')
    .factory('errorInterceptor', errorInterceptor);

    errorInterceptor.$inject = ['$q', '$window'];

    function errorInterceptor($q,$window) {

   var preventFurtherRequests = false;

   return {
       request: function (config) {

           if (preventFurtherRequests) {
               return;
           }

           return config || $q.when(config);
       },
       requestError: function(request){
                       //console.log("error");
           return $q.reject(request);
       },
       response: function (response) {
           return response || $q.when(response);
       },
       responseError: function (response) {
                       //console.log(response);

           if (response && response.status === 401) {
               //console.log("401 error");
                               $window.localStorage.removeItem('_pft');
                               $window.location.href = window.location.origin;
           }


           return $q.reject(response);
       }
   };
}


})();
