(function() {

  angular
    .module('processFactory')
    .factory('metadata', metadata);

  metadata.$inject = ['$http'];
  function metadata ($http) {
	  
	  return{
	      get: function(){
	           return $http.get('/getMetadata');
	      }
	    };
	  
	/*    var metaData = {};
	$http.get('/getMetadata').success(function(data){
		if(data){
			metaData = data;
		    var getprojectTypes = 	function () {
		    	return metaData.projectTypes;
		    };
		    return {
		    	getprojectTypes : getprojectTypes
		    };
		}
	});*/
  }

})();