(function() {

    	  angular
    	    .module('processFactory')
    	    .service('breadcrumbHelper', breadcrumbHelper);

    	  breadcrumbHelper.$inject = ['$http'];
    	  function breadcrumbHelper ($http) {
    		  var _data = {};

    			    return {
    			        getProp:  function (name) {               
    			            return _data[name];
    			        },
    			        setProp: function (name,value) {
    			            _data[name] = value;
    			        }
    			    };
    	  }
    	})();