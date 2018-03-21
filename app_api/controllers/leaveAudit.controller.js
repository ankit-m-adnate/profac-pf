var mongoose = require( 'mongoose' );
var Leave_audit = require('../models/leaveaudit.model');

module.exports.LeaveAllotment_audit = function(actionBy,actionFor,leaveType,leaveCount) {
	 return new Promise(function(resolve, reject){
	 	console.log("inside leave allotment auditing");
	 	try{
	 		var newLeaveAuditJson = {
 		"action_by" : actionBy,
 		"action_for" : actionFor,
 		"leave_count" : leaveCount,
 		"leave_type" : leaveType
 		
 	};
 	console.log('newLeaveAudit : ' + JSON.stringify(newLeaveAuditJson));
	var newLeaveAudit = new Leave_audit(JSON.parse(JSON.stringify(newLeaveAuditJson)));
	newLeaveAudit.save(function(err){
		if(err){
			console.log("in error");
			return err;
		}else{
			 resolve({"success" : "Inserted Successfully"});
		}
		
	}); 
	 	}
	 	catch(e){
      reject(e);
    }
     	 
  });
}




  module.exports.getleaveAudit = function(req,res){
  module.exports.LeaveAllotment_audit(req.body.ab,req.body.af, req.body.lt, req.body.lc)
  .then(function(success){
    res.send(success);
  }, function(err){
    res.send(err);
  });
}
