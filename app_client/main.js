(function () {

  angular.module('processFactory', ['ngRoute', 'ngMaterial', 'ngAnimate' ,'ngAria', 'ngMessages', 'angular.filter', 'ng-breadcrumbs', 'gridster', 'angular-loading-bar', 'ngDraggable', 'md.data.table' , 'ngFileUpload']);

  function config ($httpProvider, $routeProvider, $locationProvider, $mdThemingProvider) {
    $httpProvider.defaults.withCredentials = true;
    $httpProvider.interceptors.push('errorInterceptor');
    $routeProvider
    //    .when('/checkout', {
    //   templateUrl : 'payments/payment.html',
    //   controller : 'paymentController'
    // })
    .when('/payment/failure', {
      templateUrl : 'payments/paymentFailure.html',
      controller : 'paymentFailureController'
    })
    // .when('/payment/success', {
    //   templateUrl : 'payments/paymentSuccess.html',
    //   controller : 'paymentSuccessController'
    // })
      .when('/', {
        templateUrl: '/auth/login/login.view.html',
        controller: 'loginCtrl',
        controllerAs: 'vm',
        label : 'Welcome'
      })
      .when('/setup', {
        templateUrl: '/setup/setup.view.html',
        controller: 'setupCtrl',
        controllerAs: 'vm',
        label : 'Setup'
      })
      .when('/register', {
        templateUrl: '/auth/register/register.view.html',
        controller: 'registerCtrl',
        controllerAs: 'vm',
        label : 'Register'
      })
      .when('/forgot', {
        templateUrl: '/auth/forgot/forgot.view.html',
        controller: 'forgotCtrl',
        controllerAs: 'vm',
        label : 'Forgot Password'
      })
      .when('/home', {
        templateUrl: '/home/home.view.html',
        controller: 'homeCtrl',
        controllerAs: 'vm',
        label : 'Home'
      })
      .when('/master', {
        templateUrl: '/admin/apps.view.html',
        controller: 'appsCtrl',
        controllerAs: 'vm',
        label : 'Admin'
      })
      .when('/login', {
        templateUrl: '/auth/login/login.view.html',
        controller: 'loginCtrl',
        controllerAs: 'vm',
        label : 'Login'
      })
      .when('/account', {
        templateUrl: '/account/account.view.html',
        controller: 'accountCtrl',
        controllerAs: 'vm'
      })
 



    
    .when('/choosePlan', {
      templateUrl : 'choosePlan/choosePlan.html',
      controller  : 'choosePlanController'
    })

      .otherwise({redirectTo: '/'});

    // use the HTML5 History API
    //$locationProvider.html5Mode(false);
    $locationProvider.html5Mode({
   enabled: false,
   requireBase: false,

});
//.hashPrefix('!');
 									$mdThemingProvider.theme('grey', 'default')
      .primaryPalette('grey');
    $mdThemingProvider.theme('input')
  }

  function run($rootScope, $location, authentication) {
  	if($location.path() == '/choosePlan' && $location.search().access_token){
  		authentication.saveToken($location.search().access_token)
  	}
    if ($location.path() !== '/register' && $location.path() !== '/login' && $location.path() !== '/' &&  $location.path()!== '/forgot' &&  $location.path()!== '/choosePlan' && !authentication.isLoggedIn()) {
      $location.path('/');
    }
    if(authentication.isLoggedIn() && ($location.path() === '/register' || $location.path() === '/login' || $location.path() === '/')){
      $location.path('/home');
    }
    if(authentication.isLoggedIn() && authentication.currentUser()._imft == true && $location.path() !== '/choosePlan'){
      $location.path('/setup');
    }

    $rootScope.$on('$routeChangeStart', function(event, nextRoute, currentRoute) {
    if($location.path() == '/choosePlan' && $location.search().access_token){
  		authentication.saveToken($location.search().access_token)
  	}	
      if ($location.path() !== '/register' && $location.path() !== '/login' && $location.path() !== '/' && $location.path()!== '/forgot' &&  $location.path()!== '/choosePlan' && !authentication.isLoggedIn()) {
        $location.path('/');
      }
      if(authentication.isLoggedIn() && ($location.path() === '/register' || $location.path() === '/login' || $location.path() === '/')){
        $location.path('/home');
      }
      if(authentication.isLoggedIn() && authentication.currentUser()._imft == true && $location.path() !== '/choosePlan'){
        $location.path('/setup');
      }
    });
  }

  angular
    .module('processFactory')
    .config(['$httpProvider', '$routeProvider', '$locationProvider', '$mdThemingProvider', config])
    .run(['$rootScope', '$location', 'authentication', run])
    .factory('errorInterceptor', function ($q,$window) {

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
});

})();
