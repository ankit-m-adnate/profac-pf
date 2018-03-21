var Notifications = require('../models/notifications')
var _ = require('underscore')

function insertOne(notif) {
	var notifObj = new Notifications(notif)
	notifObj.save(function(err){
		if(err){
			console.error(err)
			return
		}
		console.log('notif pushed')
	});
}

module.exports.push = function(req, res){
	
	_.each(req.body.user, function(u){
		var newNotif = {
			"organization" : req.body.organization,
			"app" : req.body.app,
			"user" : u,
			"item" : req.body.item,
			"actionable" : req.body.actionable,
			"action" : req.body.action
		}
		insertOne(newNotif)
	})
	res.sendStatus(200);
}


module.exports.markAsSeen = function(data){
	Notifications.update({_id : {$in : data}}, { $set : {seen : true}}, {multi : true}, function(err, nModified){
		if(err){
			console.error(err)
			return
		}
		console.log(nModified)
	})
}

module.exports.markAction = function(data){
	Notifications.update({_id : data}, { $set : {action : true}}, {}, function(err, nModified){
		if(err){
			console.error(err)
			return
		}
		console.log(nModified)
	})
}


module.exports.getNotifications = function(req, res){
	Notifications.find({"organization" : req.params.org, "app" : req.params.app, "user" : req.params.user})
	.populate('item.from')
	.sort([['timestamp' , -1]])
	.limit(10)
	.exec(function(err, notifications){
		if(err){
			console.error(err)
			res.sendStatus(500)
			return;
		}
		res.send(notifications)
	})
}