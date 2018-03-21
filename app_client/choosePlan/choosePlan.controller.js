(function() {

  angular
    .module('processFactory')
    .controller('choosePlanController', choosePlanController);
  choosePlanController.$inject = ['$http','$scope','$rootScope','$window','authentication',  '$mdToast', '$location'];
  function choosePlanController ($http,$scope,$rootScope,$window,authentication,  $mdToast, $location) {

    $scope.query = Object.assign({}, $location.search());
    /*if(!$scope.query.access_token){
      authentication.logout()
      $location.path('/')
    }*/
    var token = JSON.parse(window.atob($scope.query.access_token.split('.')[1]));
    $scope.showPromo = false;
    $scope.imagePath = "/img/gear.png";
    $scope.firstname = token.fn
    $scope.lastname = token.ln
    $scope.user = token._id
    $scope.org = token._orgId
    $scope.surl = window.location.origin+'/pay/checkout/success'
    $scope.furl = window.location.origin+'/pay/checkout/failure'
    $scope.email = token.email

    $scope.pfSuccessRedirectUri = atob($scope.query._rd)
    //$location.url($location.path());
    function init(){
      $http.get('/pFactory/plans/' + $scope.query._a).then(function(success){
        $scope.plans = success.data.all;
        $scope.currentPlan = success.data.this[0]
        console.log($scope.currentPlan)
        $http.post('/pFactory/nextSub', { 'txn': $scope.query._a }).then(function (success) {
          $scope.nextSub = success.data;
          $scope.nextSub.subOn = moment($scope.nextSub.subOn).format('LLL')
          $scope.nextSub.expireOn = moment($scope.nextSub.expireOn).format('LLL')
          if ($scope.nextSub.expired == true) {
            $scope.message = "Your "+ $scope.currentPlan.identifier +" plan has expired on " + $scope.nextSub.expireOn;
          }
          if ($scope.nextSub.expired == false) {
            $scope.message = "Your "+ $scope.currentPlan.identifier +" plan will expire in " + parseInt($scope.nextSub.days) + " days";
          }
        }, function (failure) {
          if (failure.status == 400 && failure.data.message) {
            $scope.message = failure.data.message
           }
        })
        authentication.saveToken(success.data.token);
      }, function(error){
        $scope.plans = [];
      })

      

      $http.get('/users/getProfile/' + $scope.email).then(function(success){
         $scope.phone = success.data[0].personal_info.mobile
       }, function(error){
          
       })


    }

    init()


    //change this to respsective app name
    var appIdentifier = 'PEOPLE'

    

    $scope.openMenu = function($mdOpenMenu, ev) {
      originatorEv = ev;
      $mdOpenMenu(ev);
      $('#planDetailsMenu').addClass('arr-down');
    };

    $scope.$on('$mdMenuClose', function(){
        $('#planDetailsMenu').removeClass('arr-down');    
    })


    /*----------  called when user subscribes to any plan | calls different functions depending on free/payment  ----------*/
    $scope.checkout = function(plan){
      if(parseFloat(plan.cost) > 0){
        $scope.getPaymentKeys(plan)
      }
      else{
        $scope.regMod(plan)
      }
    }


    $scope.applyPromo = function(plan, code){
      $http.post('/pFactory/applypromo', {
        "_p" : plan._id,
        "_c" : code
      })
      .then(function(success){
        plan.cost = success.data.amount
        plan.dc = success.data.dc
        plan.dp = success.data.dp
        plan.aa = success.data.aa
        $scope.promoMessage = success.data.message
        $scope.promoIcon = 'check_circle'
        document.getElementById('promoMsg').style.color = 'green'
      }, function(error){
        $scope.promoMessage = error.data.message
        $scope.promoIcon = 'cancel'
        plan.cost = error.data.amount
        plan.dc = error.data.dc
        plan.dp = error.data.dp
        plan.aa = error.data.aa
        document.getElementById('promoMsg').style.color = 'red'
      })
    }

    $scope.regMod = function(plan){
      $http.post('/pFactory/regMod',
               { "_p" : plan._id,
                 "_o" : token._orgId,
                 "_imft" : token._imft,
                 "_r" : $scope.query._r,
                 "_a" : $scope.query._a
               })
      .then(function(success){
        //$window.localStorage.removeItem('_pft');
        $window.open($scope.pfSuccessRedirectUri + '?access_token=' + success.data + '&appid=' + $scope.query._a, "_self")
        //authentication.saveToken(success.data)
        // $window.localStorage.removeItem('authenticationtoken')
        //$window.open($window.location.origin, "_self");
      }, function(error){
        $mdToast.show($mdToast.simple().textContent('Service unavailable at this point of time'));
      })
    }



    // $scope.toPayment = function(plan){
    //   $location.path('/checkout')
    //   .search({plan : plan, orid : token._orgId, rd : $scope.query._rd});
    // }
    
    $scope.submitForm = function(){
      payuform.submit()
    }

    $scope.getPaymentKeys = function(plan){
      $scope.amount = parseFloat(plan.cost).toFixed(2)
      $scope.plan = plan
      var body = {
        "a" : $scope.amount,
        "fn" : $scope.firstname,
        "e" : $scope.email,
        "ap" : plan._id,
        "o" : $scope.org,
        "u" : $scope.user,
        "rs" : $scope.pfSuccessRedirectUri,
        "dp" : $scope.plan.dp,
        "dc" : $scope.plan.dc,
        "aa" : $scope.plan.aa,
        "origin" : window.location.href
      }

      $http.post('/pay/getPaymentKeys', body).then(function(success){

        
        //$scope.productinfo = success.data.pi
        payuform.productinfo.value = success.data.pi;
        payuform.key.value = success.data.key;
        payuform.hash_string.value = success.data.hashString;
        payuform.hash.value = success.data.hash;
        payuform.txnid.value = success.data.txnid;
        payuform.submit();
      }, function(failure){

      })
    }
 



  
}

 })();
