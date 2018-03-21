(function() {

  angular
    .module('processFactory')
    .controller('setupCtrl', setupCtrl);

  	setupCtrl.$inject = ['$http', '$mdToast', 'authentication', '$location', 'Upload'];
    function setupCtrl ($http,  $mdToast, authentication,$location, Upload, $scope) {
      var vm = this;
      vm.noOfTabs = 2;
      vm.isSelected = false;
      vm.sectors = ["AGRICULTURE", "AUTOMOBILES", "AUTO COMPONENTS" , "AVIATION", "BANKING", "BIOTECHNOLOGY", "CEMENT", "CONSUMER MARKETS", "EDUCATION AND TRAINING", "ENGINEERING", "FINANCIAL SERVICES", "FOOD PROCESSING", "GEMS AND JEWELLERY", "HEALTHCARE", "INFRASTRUCTURE", "INSURANCE", "IT & ITES", "MANUFACTURING", "MEDIA AND ENTERTAINMENT", "OIL AND GAS", "PHARMACEUTICALS", "REAL ESTATE", "RESEARCH AND DEVELOPMENT", "RETAIL", "SCIENCE AND TECHNOLOGY", "SEMICONDUCTOR", "SERVICES", "STEEL", "TELECOMMUNICATIONS", "TEXTILES", "TOURISM AND HOSPITALITY", "URBAN MARKET", "OTHERS"];
      vm.strengths = ["< 10", "10 - 100", "101-500" , "501-1000" , " > 1000"];
      vm.selectedTab = 0;
      vm.notification="";
      
      vm.username = authentication.currentUser().name;
      vm.disableNext = true;
      vm.orgName = authentication.currentUser().orgName;
      vm.commit = function() {
        str = "form" + (vm.selectedTab+1);
        if(document.getElementsByName(str)[0].checkValidity()){
            vm.notification = "";
            if(vm.selectedTab == 0){
              $http.post('/pFactory/setupOrg/'+ authentication.currentUser().org, vm.org).then(
                function(success){

                  $http.post('/pFactory/commitImft', {"_i" : authentication.currentUser()._id}).then(
                    function(s){
                      $http.get('/users/new_t?token='+ window.localStorage._pft).then(
                        function(success){
                          authentication.saveToken(success.data.success);
                          $location.path('/');
                        }, function(err){
                          $mdToast.show(
                            $mdToast.simple()
                              .textContent('Try again.')
                              .position('top right')
                              .hideDelay(3000)
                          );
                        }
                      );
                    }, function(error){
                      console.log("error", error);
                      $mdToast.show(
                        $mdToast.simple()
                          .textContent('Try again.')
                          .position('top right')
                          .hideDelay(3000)
                      );
                    }
                  )
                }, function(error){
                  console.log("error", error);
                }
              )
            }
        }
        else {
          vm.notification="Please fill in the mandatory fields";
        }
      }

      // upload on file select or drop
      vm.upload = function () {
          vm.progressVisible = true;
          //var f = angular.element(document.querySelector('#file')).prop("files")[0];
          //console.log(f);
          Upload.upload({
              url: '/pFactory/upload',
              method: 'POST',
              arrayKey: '',
              data: vm.file
          }).then(function (resp) {
              console.log('Success ' + resp.config.data.file.name + 'uploaded. Response: ' + resp.data);
              vm.org.logo = resp.data.path;
          }, function (resp) {
              console.log('Error status: ' + resp.status);
          }, function (evt) {
              vm.progressPercentage = parseInt(100.0 * evt.loaded / evt.total);
              console.log('progress: ' + vm.progressPercentage + '% ' + evt.config.data.file.name);
          });
      };


      vm.logout = function(){
        $http.get('/pFactory/logout/')
          .then(function(response) {
            //$scope.gists = response.data;
            //console.log(response);
            if(response.status === 200){
              authentication.logout();
              $location.path('/');
            }
          })
          .catch(function(response) {
            //console.error('Gists error', response.status, response.data);
          })
          .finally(function() {
            //console.log("finally finished gists");
          });
      }
    }

})();
