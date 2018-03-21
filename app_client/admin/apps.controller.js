(function() {
  
  angular
    .module('processFactory')
    .controller('appsCtrl', appsCtrl);
  
  	appsCtrl.$inject = ['$http', 'breadcrumbs', '$mdToast', '$mdPanel' , 'Upload' , '$mdDialog'];
    function appsCtrl ($http, breadcrumbs, $mdToast, $mdPanel , Upload , $mdDialog, mdPanelRef) {
    	
    	var vm = this;
        vm.apps = {};
        vm.categoryMaster = ['Applications' , 'HR4U' , 'Connect' , 'Tools' , 'Dashboard' , 'Codes'];
        vm._mdPanel = $mdPanel;
        vm.selected = [];
        vm.file = {};
        vm.newApp = {
            'name' : '',
            'category' : '',
            'desc' : '',
            'imagePath' : '',
            'url' : ''
        };
        vm.editApp = {
            'name' : '',
            'category' : '',
            'desc' : '',
            'imagePath' : '',
            'url' : ''
        };
        var init = function(){
            $http.get('/appsGate/appTxns')
            .then(function(response) {
            vm.apps = response.data;
          })
          .catch(function(response) {
            console.error('Error', response.status, response.data);
          })
          .finally(function() {
            console.log("init complete");
          });
        };
        init();
        vm.newAppPanel = function() {
          var position = vm._mdPanel.newPanelPosition()
              .absolute()
                //.addPanelPosition($mdPanel.xPosition.CENTER, $mdPanel.yPosition.BELOW)
                //.addPanelPosition($mdPanel.xPosition.CENTER, $mdPanel.yPosition.ABOVE)
              .center();

          var config = {
            attachTo: angular.element(document.body),
            controller: function () {
                return vm;
            },
            controllerAs: 'vm',
            disableParentScroll: vm.disableParentScroll,
            templateUrl: 'panel.tmpl.html',
            hasBackdrop: true,
            panelClass: 'demo-dialog-example',
            position: position,
            trapFocus: true,
            zIndex: 150,
            clickOutsideToClose: true,
            escapeToClose: true,
            focusOnOpen: true
          };
          
        vm._mdPanelRef = vm._mdPanel.create(config);
        vm._mdPanelRef.open();
        //vm._mdPanelRef = mdPanelRef;
        };


            // upload later on form submit or something similar
    vm.submit = function() {
      if ($scope.form.file.$valid && $scope.file) {
        $scope.upload($scope.file);
      }
    };

    // upload on file select or drop
    vm.upload = function () {
        vm.progressVisible = true;
        //var f = angular.element(document.querySelector('#file')).prop("files")[0];
        //console.log(f);
        Upload.upload({
            url: '/appsGate/upload',
            method: 'POST',
            arrayKey: '',
            data: vm.file
        }).then(function (resp) {
            console.log('Success ' + resp.config.data.file.name + 'uploaded. Response: ' + resp.data);
            vm.newApp.imagePath = resp.data.path;
        }, function (resp) {
            console.log('Error status: ' + resp.status);
        }, function (evt) {
            vm.progressPercentage = parseInt(100.0 * evt.loaded / evt.total);
            console.log('progress: ' + vm.progressPercentage + '% ' + evt.config.data.file.name);
        });
    };

    vm.uploadEdit = function () {
        vm.progressVisible = true;
        //var f = angular.element(document.querySelector('#file')).prop("files")[0];
        //console.log(f);
        Upload.upload({
            url: '/appsGate/upload',
            method: 'POST',
            arrayKey: '',
            data: vm.editfile
        }).then(function (resp) {
            console.log('Success ' + resp.config.data.file.name + 'uploaded. Response: ' + resp.data);
            vm.editApp.imagePath = resp.data.path;
        }, function (resp) {
            console.log('Error status: ' + resp.status);
        }, function (evt) {
            vm.progressPercentage = parseInt(100.0 * evt.loaded / evt.total);
            console.log('progress: ' + vm.editProgressPercentage + '% ' + evt.config.data.file.name);
        });
    };

    vm.addNewActivity = function(ev){
        if(vm.newApp.name == '' || vm.newApp.category == '' || vm.newApp.desc == '' || vm.newApp.url == '' || vm.newApp.imagePath == '' ){
            $mdToast.show($mdToast.simple().textContent('All fields mandatory!'));
            return;
        }
        $http.post('/appsGate/updateAppTxns', {"action" : "add", "txn" : vm.newApp})
         .then(function(response) {
            //$scope.gists = response.data;

            init();
          })
          .catch(function(response) {
            console.error('Gists error', response.status, response.data);
          })
          .finally(function() {
            vm.closeDialog();
            $mdToast.show($mdToast.simple().textContent('Application Added!'));
            
          });
    };

    vm.getImage = function(t){
        console.log(t);
            return t.imagePath.split('\\')[t.imagePath.split('\\').length-1];
    }

    vm.editAppDialog = function(txn){
        vm.editApp = txn;
        var position = vm._mdPanel.newPanelPosition()
              .absolute()
                //.addPanelPosition($mdPanel.xPosition.CENTER, $mdPanel.yPosition.BELOW)
                //.addPanelPosition($mdPanel.xPosition.CENTER, $mdPanel.yPosition.ABOVE)
              .center();

          var config = {
            attachTo: angular.element(document.body),
            controller: function () {
                return vm;
            },
            controllerAs: 'vm',
            disableParentScroll: vm.disableParentScroll,
            templateUrl: 'editpanel.tmpl.html',
            hasBackdrop: true,
            panelClass: 'demo-dialog-example',
            position: position,
            trapFocus: true,
            zIndex: 150,
            clickOutsideToClose: true,
            escapeToClose: true,
            focusOnOpen: true
          };
          
        vm._mdPanelRef = vm._mdPanel.create(config);
        vm._mdPanelRef.open();
        //vm._mdPanelRef = mdPanelRef;
    }

    vm.confirmEdit = function(ev){
        if(vm.editApp.name == '' || vm.editApp.category == '' || vm.editApp.desc == '' || vm.editApp.url == '' || vm.editApp.imagePath == '' ){
            $mdToast.show($mdToast.simple().textContent('All fields mandatory!'));
            return;
        }
        $http.post('/appsGate/updateAppTxns', {"action" : "update", "txn" : vm.editApp})
         .then(function(response) {
            //$scope.gists = response.data;
            init();
          })
          .catch(function(response) {
            console.error('Gists error', response.status, response.data);
          })
          .finally(function() {
            vm.closeDialog();
            $mdToast.show($mdToast.simple().textContent('Changes Saved!'));
            
          });
    }

    vm.deleteTxn = function(){
        $http.post('/appsGate/updateAppTxns', {"action" : "delete", "txn" : vm.selected})
         .then(function(response) {
            //$scope.gists = response.data;

            init();
          })
          .catch(function(response) {
            console.error('Gists error', response.status, response.data);
          })
          .finally(function() {
            vm.closeDialog();
            $mdToast.show($mdToast.simple().textContent('Deleted!'));
            init();
          });
    }

    vm.closeDialog = function() {
            //var panelRef = vm._mdPanelRef;
            vm.newApp = {
            'name' : '',
            'category' : '',
            'desc' : '',
            'imagePath' : '',
            'url' : ''
        };
        vm.editApp = {
            'name' : '',
            'category' : '',
            'desc' : '',
            'imagePath' : '',
            'url' : ''
        };
            vm._mdPanelRef && vm._mdPanelRef.close().then(function() {
            angular.element(document.querySelector('.demo-dialog-open-button')).focus();
            vm._mdPanelRef.destroy();
          });
        };
    }

})();