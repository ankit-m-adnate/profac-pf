(function () {

  angular
  .module('processFactory')
  .controller('forgotCtrl', forgotCtrl);

  forgotCtrl.$inject = ['$location', 'authentication'];
  function forgotCtrl($location, authentication) {
    debugger;
    var vm = this;
    vm.showResponse="";
    vm.forgot = {
      email : ""
    };

    vm.onSubmit = function () {
      authentication
        .forgot(vm.forgot)
        .error(function(err){
        })
        .then(function(response){
          //$location.path('home');
          vm.showResponse = response.data;
        });
    };

  }

})();