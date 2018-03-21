(function () {

  angular
    .module('processFactory')
    .controller('notificationCtrl', notificationCtrl);

  notificationCtrl.$inject = ['$location','authentication', '$mdMenu', '$scope', '$sce', '$http'];
  function notificationCtrl($location, authentication, $mdMenu, $scope, $sce, $http) {
    var notifvm = this;
    var socket
    notifvm.notifs = new Array()
    $scope.unseenCount = 0;
    function init(){
      /*----------  creates and listens to socket namespace '/notifs' on pf  ----------*/
      socket = io.connect('/notif');
      //console.log('socket listening on : ', authentication.currentUser().org + '/' + 'pf' + '/' + authentication.currentUser()._id)
      socket.on(authentication.currentUser().org + '/' + 'pf' + '/' + authentication.currentUser()._id, function (data) {
      
        data.item.sentence = $sce.trustAsHtml(data.item.sentence + ' by ' + '<b>'+data.item.from.name+'</b>') 
        notifvm.notifs.unshift(data)
        updateNotifBadge();

        
      });
      /*----------  call REST API to fetch last 10 notifs  ----------*/
      $http.get('/notifs/notifications/' + authentication.currentUser().org + '/' + 'pf' + '/' + authentication.currentUser()._id)
      .then(function(success){
        _.each(success.data, function(d){
          d.item.sentence = $sce.trustAsHtml(d.item.sentence + ' by ' + '<b>'+d.item.from.name+'</b>') 

        })
        notifvm.notifs = success.data;

        updateNotifBadge();
      }, function(error){

      })
    }
    init();

    notifvm.getTimeDiff = function(date){
      return moment(date).fromNow()
    }


    function updateNotifBadge(){
      document.getElementById('notifBadge').innerText = (_.where(notifvm.notifs, {seen: false})).length
    }

    notifvm.openMenu = function($mdOpenMenu, ev) {
      var updateNotifArray = new Array()
      originatorEv = ev;
      $mdOpenMenu(ev);
      $('#notifMenu').addClass('arr-down');
      _.each(notifvm.notifs, function(n){
        if(!n.seen){
          updateNotifArray.push(n._id)
        }
        n.seen = true
      })
      updateNotifBadge()
      if(updateNotifArray.length != 0)
        socket.emit('updateNotif', updateNotifArray)
    };

    $scope.$on('$mdMenuClose', function(){
        $('#notifMenu').removeClass('arr-down');    
    })

    /**
     *
     * the following function is designed for $routeProvider, and not $stateProvider;
     * please modify the function if you are using $stateProvider
     */
    notifvm.goToNotif = function(notif){
      var path = '/' + notif.item.module;
      if(notif.item.navId) path = path + '/' + notif.item.navId;
      socket.emit('updateAction', notif._id)
      $location.path(path);
    }
  }

})();
