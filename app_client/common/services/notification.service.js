(function () {

  angular
    .module('processFactory')
    .service('notification', notification);

  notification.$inject = ['$http', '$window', 'authentication'];
  function notification ($http, $window, authentication) {
    notifs = new Array()

    init = function() {
      var socket = io.connect('/notif');
      socket.on(authentication.currentUser().org + '/' + 'pf' + '/' + authentication.currentUser()._id, function (data) {
        //console.log('socket emit recieved');
        //init();
        //vm.logout();
        //socket.emit('my other event', { my: 'data' });
        console.log(JSON.stringify(data))
        notifs.push(data)
        console.log(notifs)
        
      });
      return notifs;
    };

    return {
      init : init
    };
  }


})();
