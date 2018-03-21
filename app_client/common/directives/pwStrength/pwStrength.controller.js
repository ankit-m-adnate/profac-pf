(function () {

  angular
    .module('processFactory')
    .controller('pwStrengthCtrl', pwStrengthCtrl);

  pwStrengthCtrl.$inject = ['$scope'];
  function pwStrengthCtrl($scope) {
    $scope.pw = '';

  }

})();
