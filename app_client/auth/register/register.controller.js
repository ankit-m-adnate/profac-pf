(function () {

  angular
    .module('processFactory')
    .controller('registerCtrl', registerCtrl);

  registerCtrl.$inject = ['$location', 'authentication', '$window'];
  function registerCtrl($location, authentication, $window) {
    var vm = this;
    vm.notification = "";
    vm.register = {
      first_name : "",
      last_name : "",
      email : "",
      password : "",
      organization : ""
    };


    vm.fireConversion = function() {
      window.google_trackConversion({
        google_conversion_id : 945159590,
        google_conversion_language : "en",
        google_conversion_format : "3",
        google_conversion_color : "ffffff",
        google_conversion_label : "f1CbCNSgnXUQpvvXwgM",
        google_remarketing_only : false
      });
      }

    vm.onSubmit = function () {
      vm.notification = "";
      //console.log('Submitting registration');
      authentication
        .register(vm.register)
        .error(function(err){
          //console.error(err.errmsg);
            vm.notification = err.message;
        })
        .then(function(response){
          //$location.path('home');
          if(response.status == 200){
            vm.showConfirmation = true;
            vm.customer_id = response.data.custId;
            /** UNCOMMENT ONLY ON PRODUCTION ENVIRONMENT FOR ADWORDS CONVERSION ONLY ON PROD */
            //vm.fireConversion();
          }
          else{
            vm.notification = response.message;
          }
        });
    };

    vm.forMobile = function(e){
      if((e.keyCode >= 48 && e.keyCode <= 57) || e.keyCode == 9 || e.keyCode == 8 || e.keyCode == 46 || e.keyCode == 37 || e.keyCode == 39){

      }
      else
        e.preventDefault();
    }

  }

})();
