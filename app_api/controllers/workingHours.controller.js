var mongoose = require( 'mongoose' );
var WorkingHou=require('../models/workinghours.model');
var WorkingHours = require('../models/workinghours.model');
var Organizations = require('../models/organizations');
//var Schedulers = require('./../controllers/schedulers');


module.exports.setWorkingHours = function(req, res) {
try{
	if(req.body.prefix) 
	{
	  
	  var prefix = req.body.prefix;
	}
	else {
	 
	  var prefix =  'workinghours'+req.body.org;
	}

	Organizations.findOneAndUpdate(
		{        
		  "_id": req.body.org
		}, 
		{
		  $inc: { "WH_counter.seq": 1 },
		  $set:{"WH_counter.prefix":prefix}
		},
		{
		  upsert:true,
		  new:true
		},
		function(err,count){
			var ucode = count.WH_counter.prefix + "-" + count.WH_counter.seq;
   	var newworkingHours = {
   		"organization" : req.body.org,
        "desc" : req.body.desc,
    	"offset" : req.body.offset,
		"unique_code" : ucode,
    	// "workingHours":{
    	// "open" : req.body.open,
	    // "pause" : req.body.pause,
	    // "cont" : req.body.cont,
	    // "close" : req.body.close
     //      }
           "workingHours" : req.body.wh,
		   "maxAutoApprovalDuration": req.body.maxAutoApprovalDuration,
			  "approvalFrom": req.body.approvalFrom,
		"virtualExtension" : req.body.virtualExtension
    	
 	};
 
	var newWorkHours = new WorkingHours(JSON.parse(JSON.stringify(newworkingHours)));
	console.log('newWorkHours : ' + JSON.stringify(newworkingHours));


	newWorkHours.save(function(err,workhours){
		if(err){
			res.status(500).send(err);
			console.log(err.errmsg);
			return err;		
		}
		//res.status(200).send(newWorkHours);
  /*Organizations.findOne({_id : req.body.org}, function(err, org){
        if(err){
          console.error(err);
          return;
        }
        if(org){
          org.shifts.push(workhours._id);
          org.save(function(err){
            if(err){
              console.error(err);
              res.sendStatus(500);
              WorkingHours.find({ _id: workhours._id }).remove().exec();
              return;
            }
            res.status(200).send(newWorkHours);
          });
        }
      });*/
			Organizations.update({'_id':req.body.org},{$addToSet: { 'shifts': workhours._id}},function(err,doc){
				if(err){
					console.error(err);
					res.sendStatus(500);
					WorkingHours.find({ _id: workhours._id }).remove().exec();
					return;
				}
				res.status(200).send(newWorkHours);
			});
	});
});
}

catch (err) {
    // handle the error safely
    console.log(err)
}
}



// module.exports.updateWorkingHours = function(req,res){
// WorkingHours.findOneAndUpdate({"_id" :mongoose.Types.ObjectId(req.body._id), "workingHours._id" : mongoose.Types.ObjectId(req.body.whid)},
// { $set : {"workingHours.$.open" : req.body.open,"workingHours.$.pause" :req.body.pause,"workingHours.$.desc" :req.body.desc,"workingHours.$.offset" :req.body.offset,"workingHours.$.cont" :req.body.cont,"workingHours.$.close" :req.body.close}},{new : true},function(err,updated){
// 	if(err){
// 		return err;
// 	}
// 	res.status(200).send("Updated Sucessfully");
// });
// }

// module.exports.deleteWorkingHours = function(req, res) {
// WorkingHours.findOneAndUpdate(
//     {'_id': mongoose.Types.ObjectId(req.query._id)}, 
//     { $pull: { "workingHours" : { _id: mongoose.Types.ObjectId(req.query.whid) } } },{new : true}).then(function(err){ //$pull:remove object from array           	
//     	if(err){
//     		res.send(err);
//     		console.error(err);
//     		return err;
//     	}
//     res.status(200).send("deleted Sucessfully");	
//     });
	
// }


module.exports.getWorkingHours = function(req, res) {
    
      	WorkingHours.find({'organization' : req.query.org,'unique_code' : { $exists : true}}).then(function(err, workinghours){
 		if(err){
 			res.send(err);
 			return err;
 		}
 		if(workinghours.length > 0){
 			res.send(workinghours);
 			
 		}
 		else
 			res.send("No workinghours Found.")
 	});
}



module.exports.updateWorkingHours = function(req, res) {
	try{

 	WorkingHours.findOne({"_id" : mongoose.Types.ObjectId(req.body._id)}, function(err, workinghours){
 		if(err){
 			console.log(err);
			return err;
 		}

 		if(workinghours){ 
 			if(req.body.wh != null ){
 				workinghours.workingHours = req.body.wh
 			}
            if(req.body.desc != null) workinghours.desc = req.body.desc;
			 if(req.body.ucode != null) workinghours.unique_code = req.body.ucode;   
 			if(req.body.offset != null) workinghours.offset = req.body.offset;
			 if (req.body.maxAutoApprovalDuration != null) workinghours.maxAutoApprovalDuration = req.body.maxAutoApprovalDuration;
				if (req.body.approvalFrom != null) workinghours.approvalFrom = req.body.approvalFrom;
				if (req.body.virtualExtension != null) workinghours.virtualExtension = req.body.virtualExtension;
		workinghours.save(function(err){
 				if(err) return err;
 				res.status(200).send(workinghours._id);
 	// Schedulers.scheduleAttenanceSync();
    //  Schedulers.scheduleAttenanceSyncout();
 			});
 		}
 		else
 			res.status(403).send("No workinghours Found.");
 	});
}
catch(err){
	console.log(err);
}
}




module.exports.deleteWorkingHours = function(req, res) {

WorkingHours.remove({'_id': mongoose.Types.ObjectId(req.query._id),'unique_code' : req.query.ucode}).then(function(err){
	if(err){
 			res.send(err);
 			return err;
 		}
 		res.status(200).send(req.query._id);
     });
}