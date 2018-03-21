(function () {

  angular
    .module('processFactory')
    .directive('notification', notification);

  function notification () {
    return {
      restrict: 'EA',
      templateUrl: '/common/directives/notification/notification.template.html',
      controller: 'notificationCtrl as notifvm'
    };
  }

})();