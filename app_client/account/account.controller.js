(function() {

	angular
	.module('processFactory')
	.controller('accountCtrl', accountCtrl);

	accountCtrl.$inject = ['$http', 'breadcrumbs', '$mdToast', 'authentication','$location', '$scope'];
	function accountCtrl ($http, breadcrumbs, $mdToast, authentication,$location, $scope) {
		var vm = this;
		vm.currentUser = authentication.currentUser();
		vm.getOrganizationDeatilsLoading = true;
		vm.getUserProfileLoading = true;
		vm.countDown_text = 0;
		vm.profile = {
			first_name : vm.currentUser.fn,
			last_name : vm.currentUser.ln,
			email : vm.currentUser.email,
			mobile : vm.currentUser._m
		}

		function getUserProfile() {
			vm.notification = '';
			vm.getUserProfileLoading = true;
			$http.get('/users/getPFProfile/' + vm.currentUser.email).then(function(success){
				vm.userDetails = success.data;
				vm.getUserProfileLoading = false;
				vm.otptry = (vm.userDetails.otp) ? vm.userDetails.otp.retries : 0;
			}, function(err){
				vm.getUserProfileLoading = false;
			})
		}

		function getOrganizationDeatils() {
			vm.getOrganizationDeatilsLoading = true;
			$http.get('/pFactory/getOrgPlans/' + vm.currentUser.org).then(function(success){
				vm.orgDetails = success.data;
				vm.getOrganizationDeatilsLoading = false;
			}, function(err){
				vm.getOrganizationDeatilsLoading = false;
			})
		}

		vm.verifyMobile = function(tryNumber){
			$http.post('/users/verifyMobile', {_i : vm.currentUser._id, _m : vm.currentUser._m, _t : (tryNumber + 1)}).then(function(success){
				getUserProfile();
			}, function(err){
				vm.notification = "This service is currently unavailable."
			})
		}

		vm.otpAlive = function(){
			if(!vm.getUserProfileLoading && vm.userDetails.otp){
				var d = new Date();
				vm.ex = new Date(vm.userDetails.otp.expires);
				var diff = (vm.ex.getTime() - d.getTime()) / 1000;
					if((vm.userDetails.mobileVerified) == 'N' && (diff > 0)){

						return true;
					}
					else
						return false;
			}
			else
				return false;
		}

		vm.submitOTP = function(){
			$http.post('/users/submitOTP' ,{
				_i : vm.currentUser._id,
				_c : vm.otp
			}).then(function(success){
				getUserProfile();
			}, function(err){
				vm.notification = err.data.message;
			})
		}

		getOrganizationDeatils();
		getUserProfile();


		//for mobile field validation
		vm.forMobile = function(e){
	      if((e.keyCode >= 48 && e.keyCode <= 57) || e.keyCode == 9 || e.keyCode == 8 || e.keyCode == 46 || e.keyCode == 37 || e.keyCode == 39){

	      }
	      else
	        e.preventDefault();
	    }

    	//for menu open/close and menu triangle
    	vm.openMenu = function($mdOpenMenu, ev) {
    		originatorEv = ev;
    		$mdOpenMenu(ev);
    		$('#profileMenu').addClass('arr-down');
    	};

    	$scope.$on('$mdMenuClose', function(){
    		$('#profileMenu').removeClass('arr-down');    
    	})

    	//for logout
    	      vm.logout = function(){
        $http.get('/pFactory/logout/')
          .then(function(response) {
            //$scope.gists = response.data;
            //console.log(response);
            if(response.status === 200){
              authentication.logout();
              $location.path('/');
            }
          })
          .catch(function(response) {
            //console.error('Gists error', response.status, response.data);
          })
          .finally(function() {
            //console.log("finally finished gists");
          });
      }
    }

})();
