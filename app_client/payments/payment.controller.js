(function() {

  angular
    .module('processFactory')
    .controller('paymentController', paymentController);
  paymentController.$inject = ['$http','$scope','$rootScope','$window','authentication', '$mdToast','$mdDialog', '$location'];
  function paymentController ($http,$scope,$rootScope,$window,authentication, $mdToast,$mdDialog, $location) {
  	
    //change this to respsective app name
    var appIdentifier = 'PEOPLE'

    $scope.email = authentication.currentUser().email

    function init(){
      $http.get('/users/getProfile/' + $scope.email).then(function(success){
        $scope.phone = success.data[0].personal_info.mobile
      }, function(error){
        // 
      })
    }
    init()

  	var query = $location.search()
    $scope.plan = query.plan
    $scope.plan.cost = parseFloat($scope.plan.cost).toFixed(2)
  	$scope.imagePath = "/img/gear.png";
  	$scope.productinfo = appIdentifier + " - " + $scope.plan.identifier
  	$scope.firstname = authentication.currentUser().fn
  	$scope.lastname = authentication.currentUser().ln
    $scope.user = authentication.currentUser()._id
    $scope.org = authentication.currentUser().org
  	$scope.surl = window.location.origin+'/pay/checkout/success'
  	$scope.furl = window.location.origin+'/pay/checkout/failure'
    $scope.pfSuccessRedirectUri = window.location.origin+ $scope.org + '/checkout/success'
    $scope.pfFailureRedirectUri = window.location.origin+ $scope.org + '/checkout/failure'
  	//$scope.cost = parseFloat('1000');
  	$scope.submitForm = function(){
  		payuform.submit()
  	}

  	$scope.getPaymentKeys = function(){
      var body = {
        "a" : $scope.plan.cost,
        "pi" : $scope.productinfo,
        "fn" : $scope.firstname,
        "e" : $scope.email,
        "ap" : $scope.plan._id,
        "o" : $scope.org,
        "u" : $scope.user,
        "rs" : $scope.pfSuccessRedirectUri,
        "rf" : $scope.pfFailureRedirectUri
      }
      console.log(body)
  		$http.post('/pay/getPaymentKeys', body).then(function(success){
  			payuform.elements["key"].value = success.data.key
  			payuform.elements["hash_string"].value = success.data.hashString
  			payuform.elements["hash"].value = success.data.hash
  			payuform.elements["txnid"].value = success.data.txnid
  			payuform.submit();
  		}, function(failure){

  		})
  	}

  }


 })();
