var mongoose = require( 'mongoose' );
var Organizations = require('../models/organizations');
var Users = require('../models/users');
var fs = require('fs');
var leaveAllotmentAudit = require('../controllers/leaveAudit.controller');


module.exports.updateFpsId = function (req, res) {


	Users.findOne({_id : req.params._i})
	.exec(function(err,user){
		if(err){
			res.status(500).send(err);
		}
		if(user){	
		if(user.attendanceBiometricDeviceConfig==undefined || 
			user.attendanceBiometricDeviceConfig.length==0){
			user.attendanceBiometricDeviceConfig=[];
			user.attendanceBiometricDeviceConfig.push({
					"fpsid":req.params._f,
					"deviceId":req.params._dI
			});
			}else{
			/*for(i=0;i<user.attendanceBiometricDeviceConfig.length;i++){
				if(req.params._dI==user.attendanceBiometricDeviceConfig[i].deviceId){
					user.attendanceBiometricDeviceConfig[i].fpsid=req.params._f;
				}
			}*/
			var index1=user.attendanceBiometricDeviceConfig.map(function(a){
				return a.deviceId
			}).indexOf(req.params._dI);
			console.log("index1 ----"+ index1);
			if(index1!=-1){
				user.attendanceBiometricDeviceConfig[index1].fpsid=req.params._f;
			}else if(index1==-1){
				user.attendanceBiometricDeviceConfig.push({
					"fpsid":req.params._f,
					"deviceId":req.params._dI
			});
			}
			}
			user.save(function(err){
				if(err){
				res.sendStatus(500);
				}
			res.sendStatus(200);
			})

		}else{
			res.status(500).json({"message":"User not found!"})
		}
		// {$set: { "attendanceBiometricDeviceConfig.fpsid" : req.params._f,"" }}
		// res.sendStatus(200);
	})
/* 	,function(err, numAffected){
		if(err){
			res.sendStatus(500);
			console.error(err);
			return;
		}
		console.log(numAffected)
		if(numAffected.ok == 1 && numAffected.nModified){
			res.sendStatus(200);
		}
		if(numAffected.ok == 1 && numAffected.nModified == 0 && numAffected.n == 1){
			res.sendStatus(304)
		}
		if(numAffected.ok == 1 && numAffected.nModified == 0 && numAffected.n == 0){
			res.sendStatus(400)
		}
		if(numAffected.ok == 0){
			res.sendStatus(500)
		}
	}) */
}

module.exports.getOrg = function(req, res) {

 	Organizations.find({"_id" : req.query.org}).select({'leaves_config':1 , 'leaves_setting':1,'expenses_setting':1,'expenses_config':1,'leaveReminderConfig':1,'compofflapseAfter':1}).exec(function(err, org){
 		if(err){
 			res.status(500).send(err);
 			return err;
 		}
 		if(org.length > 0){
 			res.status(200).send(org);
 		}
 		else
 			res.status(400).send("No Organization Found.")
 	});
}

//get configuration.json file
module.exports.getConfig = function(req, res){

fs.readFile('\\ProcessFactory\\config.json', 'utf8', function (err,data) {
  if (err) {
    return console.log(err.message);
  }
  res.status(200).send(data);

});

}
module.exports.leaveAllotment = function(req,res){
Users.findOne({_id:req.query.userid},function(err,user){
	if(err){
		console.log("user err :"+ err);
		return err;
	}
	if(user){
		console.log(user.leaves)
		var leaveObject = {};
		for(var i= 0;i<req.body.length;i++){
		//user.leaves[req.body[i].type] = req.body[i].count;
			 //leave audit added on 5th june 2017
	     console.log("check previous value of leave:"+user.leaves[req.body[i].type]);
	     console.log("check current value of leave:"+req.body[i].count);
		  if(user.leaves[req.body[i].type] != null || user.leaves[req.body[i].type] != undefined || user.leaves[req.body[i].type] != "" || req.body[i].count != "" || req.body[i].count != undefined || req.body[i].count != null){
	     if(user.leaves[req.body[i].type] != req.body[i].count){
			 var prvcount = parseInt(user.leaves[req.body[i].type]);
			 var curcount = parseInt(req.body[i].count);
			 var lcount = curcount-prvcount ;
       leaveAllotmentAudit.LeaveAllotment_audit(req.query.ab,user._id,req.body[i].type,lcount).then(function(response){
         console.log(response.success);
        });
         }
		  }
		 //
		 user.leaves[req.body[i].type] = req.body[i].count;
		}

		 //user.leaves= leaveObject;
		 user.markModified('leaves');
		user.save(function(err){
			if(err){
				console.error(err);
				return err;
			}
          res.status(200).send(user);
		});
		
	}
});
	}


module.exports.getleaveAllotment = function(req,res){

Organizations.findOne({_id : req.query.org}).exec(function(err, org){  //.select({'leaves_config':1})
	if(err){
		console.error(err);
		return err;
	}
if(org){
	var leave_names = [];
	var leave_description=[];
	var leave_isCasual=[];
	var leave_isUnpaid=[];
	var leave_isFlexi=[];
	var leave_isSick=[];
	var leave_isCompOff=[];
	var leave_enableHalfDay=[];
	var leave_min_leaves=[];
	var leave_max_leaves=[];
	var show_leaves = [];
	var nlength = org.leaves_config.names.length;
	console.log("leave names length :"+ nlength);
	for(var i = 0; i< nlength;i++){
		if(org.leaves_config.status[i] == true){
		   leave_names.push(org.leaves_config.names[i]);
		   leave_description.push(org.leaves_config.description[i]);
		   leave_isCasual.push(org.leaves_config.isCasual[i]);
		   leave_isUnpaid.push(org.leaves_config.isUnpaid[i]);
		   leave_isFlexi.push(org.leaves_config.isFlexi[i]);
		   leave_isSick.push(org.leaves_config.isSick[i]);
		   leave_isCompOff.push(org.leaves_config.isCompOff[i]);
		   if(org.leaves_config.enableHalfDay[i]!=undefined && org.leaves_config.enableHalfDay[i]!=null){
			leave_enableHalfDay.push(org.leaves_config.enableHalfDay[i]);
		   }else{
		   leave_enableHalfDay.push(false);			   
		   }
		   if(org.leaves_config.min_leaves[i]!=undefined && org.leaves_config.min_leaves[i]!=null){
			leave_min_leaves.push(org.leaves_config.min_leaves[i]);
		   }else{
			leave_min_leaves.push(null);
		   }
		   leave_max_leaves.push(org.leaves_config.max_leaves[i]);
		}
	}
	//console.log(leave_description);
	Users.findOne({_id:req.query.userid},function(err,user){
		if(err){return err;}
		var clength = leave_names.length;
		for(var j=0;j<clength;j++){
			if(user.leaves){
			var leave_type = leave_names[j];
			var count = user.leaves[leave_names[j]];
			var description=leave_description[j];
			var isCasual=leave_isCasual[j];
			var isUnpaid=leave_isUnpaid[j];
			var isFlexi=leave_isFlexi[j];
			var isSick=leave_isSick[j];
			var isCompOff=leave_isCompOff[j];
			var enableHalfDay=leave_enableHalfDay[j];
			var min_leaves=leave_min_leaves[j];
			var max_leaves=leave_max_leaves[j];
		//	console.log("leave_description[j] :"+description);
			
			show_leaves.push({leave_type,description,count,isCasual,isUnpaid,isFlexi,isSick,isCompOff,enableHalfDay,min_leaves,max_leaves});
			}
		 	
		}
           res.status(200).json({"leaves" : show_leaves});
	});//user end
}//if end

});//org end
}

/*reset unpaid leaves*/
module.exports.resetUnpaid = function(req,res){

Organizations.findOne({_id : req.query.org}).exec(function(err, org){  //.select({'leaves_config':1})
	if(err){
		console.error(err);
		return err;
	}
if(org){
	var leave_names = [];
	// var nlength = org.leaves_config.names.length;
	// console.log("leave names length :"+ nlength);
	// for(var i = 0; i< nlength;i++){
	// 	if(org.leaves_config.isUnpaid[i] == true){
	// 		if(org.leaves_config.status[i] == true){
 //           leave_names.push(org.leaves_config.names[i]);
 //       }
	// 	}
	// }
	if(org.leaves_config.isUnpaid.indexOf(true) != -1){
		var index = org.leaves_config.isUnpaid.indexOf(true);
		if(org.leaves_config.status[index] == true){
		leave_names.push(org.leaves_config.names[index]);
	}
//}

	console.log("check leave_name:"+leave_names);
	function syncMultipleUsers(index){
      if(index<req.body.userid.length){

	Users.findOne({_id:req.body.userid[index]},function(err,user){
		if(err){
			console.error(err);
			return err;
		}
		var clength = leave_names.length;
		//for(var j=0;j<clength;j++){
			if(user.leaves){

	      user.leaves[leave_names[0]] = 0;


		}

		//}
        user.markModified('leaves');
		user.save(function(err){
			if(err){
				console.error("user error:"+err);
				syncMultipleUsers(index+1);
				return err;
			}
			syncMultipleUsers(index+1);
		    return;
		
		});
	
	});//user end
      }
      else{
      	res.status(200).json({"message": "Unpaid leaves reseted to zero"});
      }
  }
  syncMultipleUsers(0);
    return;
}
else{
console.log("check leave names:"+org.leaves_config.names);
var namearr=[];
				
				for(var i=0;i<org.leaves_config.status.length;i++)
				{
					if(org.leaves_config.status[i]==true)
					{
						namearr.push(org.leaves_config.names[i]);
					}
				}
	Users.find({_id:{$in:req.body.userid}},function(err,user){
		if(err){
			console.error(err);
			return err;
		}
		if(user.length>0){
         function syncMultipleUsers(index){
         if(index<user.length){
         if(user[index].leaves){
         for(var i=0;i<namearr.length;i++){
        if(user[index].leaves[namearr[i]] > 0){

        }
        else{
        	user[index].leaves[namearr[i]] =0;
        }      
        }  

             }
        user[index].markModified('leaves');
		user[index].save(function(err){
			if(err){
				console.error("user error:"+err);
				syncMultipleUsers(index+1);
				return err;
			}
			syncMultipleUsers(index+1);
		    return;
		
		});
	

            }
            else{
      	res.status(200).json({"message": "Negative leave types reseted to zero"});
      }
        }
    syncMultipleUsers(0);
    return;


		}


});
			//}
		//}
}//if end

}//org end
});
}
