(function() {

  angular
    .module('processFactory')
    .controller('homeCtrl', homeCtrl);

  	homeCtrl.$inject = ['$http', 'breadcrumbs', '$mdToast', 'authentication','$location', '$scope'];
    function homeCtrl ($http, breadcrumbs, $mdToast, authentication,$location, $scope) {

		 var vm = this;
		 var median = 0;
     vm.currentUser = authentication.currentUser();
		 vm.selected = [];
		 
		 init = function(){
			$http.post('/pFactory/userCheck', {'email' : authentication.currentUser().email}).success(function(data){
				vm.data = data;
				console.log(vm.data);
				vm.order = vm.data.userConfig ? '' : '-noOfHits' ;

				
				for(var i = 0; i<vm.data.txns.length; i++){
					median += parseInt(vm.data.txns[i].noOfHits)
				}
				median = median/ vm.data.txns.length;
			});
		}

     init();
        vm.data = {};
    	vm.saveFlag = false;
    	vm.showSearch = false;
    	vm.limit = 10;
    	vm.getCategoryColor = function(cat){
    		return {'background-color' : vm.categoryColor[cat]};
    	}


			vm.isMostUsed = function(item){
				
				return item.noOfHits >= median
			}


    	vm.click = function(app){
            var token = authentication.getToken();
            if(token.charAt(0) == '"')   token = token.replace('"', '');
            if(token.endsWith('"'))  token = token.replace('"', '');
            var link = app.txn.url + '?access_token=' + token + '&appid=' + app.txn._id;
            //console.log("link :: "+link);
    		window.open(link, '_blank');
				$http.post('/pFactory/noOfHits', {'userId' : vm.data._id, 'txnId' : app.txn._id}).then(function(success){
					init();
				});
				
    	};

      vm.breadcrumbs = breadcrumbs;
  	  vm.Math = window.Math;
  	  vm.parseInt = parseInt;
  	  //vm.split = split;
      //console.log('Home controller is running');
       //console.log(authentication.currentUser().email);

      
      
      

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

      vm.getImage = function(t){
        //console.log(t);
            return t.split('\\')[t.split('\\').length-1];
    }

    vm.openMenu = function($mdOpenMenu, ev) {
      originatorEv = ev;
      $mdOpenMenu(ev);
      $('#profileMenu').addClass('arr-down');
    };

    $scope.$on('$mdMenuClose', function(){
        $('#profileMenu').removeClass('arr-down');    
    })

}

})();
