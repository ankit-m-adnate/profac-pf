var mongoose = require( 'mongoose' );
var db = require('../models/db');
var Organizations = require('../models/organizations');

var designation_history=require('../models/designation_history');

 module.exports.getHistory = function(req, res) {
	designation_history.find(
  	{'employee':req.query.employee}
	  )
	  .populate('old')
	  .populate('new')
   .exec(function(err, history)
		{
		if(err){
			res.send(err);
		}
		if(history){
			
			res.status(200).send(history);
		}
		if(!history){
			console.log('history not found');
		}
	});

	 }
	 

module.exports.addHistory = function(employee,organization,old,newrecord,action) {

	var HistoryJson = {
 		"employee" : employee,
 		"organization" : organization,
		"creation_date":new Date(),
		"action": action,
		"old":old,
		"new":newrecord
		
 	};
	var newHistory = new designation_history(JSON.parse(JSON.stringify(HistoryJson)));
	newHistory.save(function(err,history){
		if(err){
			console.log(err)
		}
		
		
	
	
});

}






	