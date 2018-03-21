(function () {

  angular
  .module('processFactory')
  .controller('loginCtrl', loginCtrl);

  loginCtrl.$inject = ['$location', 'authentication'];
  function loginCtrl($location, authentication) {
    var vm = this;
    vm.notification = "";
    vm.credentials = {
      email : "",
      password : ""
    };

    vm.onSubmit = function () {
      vm.notification = "";
      authentication
        .login(vm.credentials)
        .error(function(err){
          vm.notification = err.message;
     return;   })
        .then(function(){
          $location.path('/home');
        });
    };

  }

})();
