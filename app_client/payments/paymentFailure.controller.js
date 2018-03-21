(function() {

  angular
    .module('processFactory')
    .controller('paymentFailureController', paymentFailureController);
  paymentFailureController.$inject = ['$http','$scope','$rootScope','$window','authentication', '$mdToast','$mdDialog', '$location'];
  function paymentFailureController ($http,$scope,$rootScope,$window,authentication, $mdToast, $mdDialog, $location) {
  	
  	$scope.query = $location.search()

  	if($scope.query.hasOwnProperty('txnid')){
  		$http.get('/pay/g/' + $scope.query.txnid).then(function(success){
  		}, function(error){

  		})
  	}
  }


 })();
