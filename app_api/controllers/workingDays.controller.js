var mongoose = require( 'mongoose' );
var WorkingDays = require('../models/workingdays.model');
var Organizations = require('../models/organizations');
module.exports.setWorkingDays = function(req, res) {
try{

	if(req.body.prefix) 
	{
	  
	  var prefix = req.body.prefix;
	}
	else {
	 
	  var prefix = 'workdays'+req.body.org;
	}
	Organizations.findOneAndUpdate(
		{        
		  "_id": req.body.org
		}, 
		{
		  $inc: { "WD_counter.seq": 1 },
		  $set:{"WD_counter.prefix":prefix}
		},
		{
		  upsert:true,
		  new:true
		},
		function(err,count){
			var ucode = count.WD_counter.prefix + "-" + count.WD_counter.seq;
   	var newworkingDays = {
   		organization : req.body.org,
   		tag : req.body.tag,
   		workingDays : req.body.wd,
		unique_code : ucode
 	};

	var newWorkDays = new WorkingDays(JSON.parse(JSON.stringify(newworkingDays)));
	console.log('newWorkDays : ' + JSON.stringify(newworkingDays));

	newWorkDays.save(function(err,workday){
		if(err){
			res.status(500).send(err);
			console.log(err.errmsg);
			return err;		
		}
		//res.status(200).send(newWorkDays);
  /* Organizations.findOne({_id : req.body.org}, function(err, org){
        if(err){
          console.error(err);
          return;
        }
        if(org){
          org.workdays.push(workday._id);
          org.save(function(err){
            if(err){
              console.error(err);
              res.sendStatus(500);
              WorkingDays.find({ _id: workday._id }).remove().exec();
              return;
            }
            res.status(200).send(newWorkDays);
          });
        }
      });*/
			Organizations.update({'_id':req.body.org},{$addToSet: { 'workdays': workday._id}},function(err,doc){
				if(err){
					console.error(err);
					res.sendStatus(500);
					WorkingDays.find({ _id: workday._id }).remove().exec();
					return;
				}
				res.status(200).send(newWorkDays);
			});
	});
});
}

catch (err) {
   
    console.log(err)
}
}


module.exports.updateWorkingDays = function(req, res) {
	try{

 	WorkingDays.findOne({"_id" : mongoose.Types.ObjectId(req.body._id)}, function(err, workingdays){
 		if(err){
 			console.log(err);
			return err;
 		}

 		if(workingdays){
 	 	    if(req.body.tag != null) workingdays.tag = req.body.tag;
             if(req.body.ucode != null) workingdays.unique_code = req.body.ucode;   
 			if(req.body.wd != null) workingdays.workingDays = req.body.wd;

		workingdays.save(function(err){
 				if(err) return err;
 				res.status(200).send(workingdays._id);
 			});
 		}
 		else
 			res.status(403).send("No workingdays Found.");
 	});
}
catch(err){
	console.log(err);
}
}

module.exports.deleteWorkingDays = function(req, res) {

WorkingDays.update({'_id': mongoose.Types.ObjectId(req.query._id),	'unique_code' : req.query.ucode}).then(function(err){
	if(err){
 			res.send(err);
 			return err;
 		}
 		res.status(200).send(req.query._id);
     });
}


module.exports.getWorkingDays = function(req, res) {
    
      	WorkingDays.find({'organization' : req.query.org,'unique_code' : { $exists : true}}).then(function(err, workingdays){
 		if(err){
 			res.send(err);
 			return err;
 		}
 		if(workingdays.length > 0){
 			res.send(workingdays);
 			
 		}
 		else
 			res.send("No workingdays Found.")
 	});
}



// module.exports.setWorkingDays = function(req, res){
//   WorkingDays.update({_id : req.body._id}, req.body, {upsert : true},  function(err, b){
//     if(err){
//       console.log(err);
//       res.send(500);
//       return;
//     }
//     res.send(200);
//   });
// }

