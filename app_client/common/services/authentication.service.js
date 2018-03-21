(function () {

  angular
    .module('processFactory')
    .service('authentication', authentication);

  authentication.$inject = ['$http', '$window'];
  function authentication ($http, $window) {

    var saveToken = function (token) {
      $window.localStorage['_pft'] = token;
    };

    var getToken = function () {
      return $window.localStorage['_pft'];
    };

    var isLoggedIn = function() {
      var token = getToken();
      var payload;

      if(token){
        payload = token.split('.')[1];
        payload = $window.atob(payload);
        payload = JSON.parse(payload);

        //return payload.exp > Date.now() / 1000;
        return true;
      } else {
        return false;
      }
    };

    var currentUser = function() {
      if(isLoggedIn()){
        var token = getToken();
        var payload = token.split('.')[1];
        payload = $window.atob(payload);
        payload = JSON.parse(payload);
        return {
          email : payload.email,
          name : payload.name,
          org : payload._orgId,
          orgName : payload._orgName,
          _id : payload._id,
          _imft : payload.pf_imft,
          fn : payload.fn,
          ln : payload.ln,
          _m : payload._m,
          _mv : payload._mv,
          _pfr : payload._pfr
        };
      }
    };

    register = function(user) {
      return $http.post('/pFactory/register', user).success(function(data){
        //saveToken(data.token);
      });
    };

    forgot = function(email) {
      return $http.post('/pFactory/forgot' , email).success(function(data){

      });
    }

    login = function(user) {
      return $http.post('/pFactory/login', user).success(function(data) {
        saveToken(data.token);
      });
    };

    logout = function() {
      $window.localStorage.removeItem('_pft');
    };

    return {
      currentUser : currentUser,
      saveToken : saveToken,
      getToken : getToken,
      isLoggedIn : isLoggedIn,
      register : register,
      login : login,
      logout : logout,
      forgot : forgot
    };
  }


})();
