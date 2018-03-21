(function () {

  angular
    .module('processFactory')
    .controller('navigationCtrl', navigationCtrl);

  navigationCtrl.$inject = ['$location','authentication', '$mdSidenav', '$mdUtil', 'breadcrumbs', '$routeParams'];
  function navigationCtrl($location, authentication, $mdSidenav, $mdUtil, breadcrumbs, $routeParams) {
    var vm = this;
    vm.breadcrumbs = breadcrumbs;
    vm.isLoggedIn = authentication.isLoggedIn();

    vm.currentUser = authentication.currentUser();
    vm.toggleLeft = buildToggler('left');
    function buildToggler(navID) {
        var debounceFn = $mdUtil.debounce(function () {
            $mdSidenav(navID)
                .toggle()
        }, 100);
        return debounceFn;
    };
    vm.close = function(){
    	$mdSidenav('left').open()
        .then(function () {
          //$log.debug("close LEFT is done");
        });
    };
  }

})();
