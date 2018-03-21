var mongoose = require( 'mongoose' );
var Comments = require('../models/comments.model');

 module.exports.addComment = function(req, res) {
 	console.log('in comment controller');
 	var newCommentJson = {
 		"topic" : req.body.topic,
 		"email"  :req.body.email,
 		"text" : req.body.text,
 		"upvotes" : req.body.upvotes,
 		"downvotes" : req.body.downvotes
 		
 	};
 	console.log('newComment :: ' + JSON.stringify(newCommentJson));
	var newComment = new Comments(JSON.parse(JSON.stringify(newCommentJson)));
	newComment.save(function(err){
		if(err){
			console.log("in error");
			return err;
		}
		res.status(200).send(newComment);
	});
}


//new comment
/*module.exports.newComment = function(req, res) {
Comments.findOne({'_id': mongoose.Types.ObjectId(req.body.id)},function(err,found){
	if(err){
		return err;
	}
   if(found){
var newCommentJson = {
 		"email"  :req.body.email,
 		"text" : req.body.text,
 		"upvotes" : req.body.upvotes,
 		"downvotes" : req.body.downvotes,
 		//"parent": req.body.id
 	};
 	console.log('newComment :: ' + JSON.stringify(newCommentJson));
	var newComment = new Comments(JSON.parse(JSON.stringify(newCommentJson)));
newComment.save(function(err){
		if(err){
			console.log("in error");
			return err;
		}
		res.status(200).send(newComment);
	});
   }
 else{
 	res.status(403).send("Not Found");
 }
});
}*/

//get comments


module.exports.getComments = function(req,res){
	var perPage = 2;
    //var  page = Math.max(0, req.param('page'));
    var  page = Math.max(0, req.query.page-1);
    console.log("page result :"+page);

      var query = {"topic": req.query.topic};
/*var cursor = Comments.find({}).cursor({skip:perPage * page, limit: perPage,sort:{ time: -1 }}); //Sort by time Added DESC*/
Comments.find(query).skip(perPage * page).limit(perPage).sort('-time').exec(function(err,result){
if(err){
	console.error("Error :"+err);
	return err;
}
//cursor.on('data', function(doc) {
  console.log("doc data:"+result);
  res.status(200).send(result);
//});
});
}


module.exports.upVoting =function(req,res){
Comments.findOneAndUpdate({'_id': mongoose.Types.ObjectId(req.body.commentid)}, { $addToSet: { upvotes: req.body.email },$pull:{downvotes: req.body.email}},function(err,voted){
	if(err){
		console.error("Error :"+err);
		return err;
	}
	res.status(200).send(voted);
});
}

module.exports.downVoting =function(req,res){
Comments.findOneAndUpdate({'_id': mongoose.Types.ObjectId(req.body.commentid)}, { $pull: { upvotes: req.body.email },$addToSet:{ downvotes: req.body.email}},function(err,voted){
	if(err){
		console.error("Error :"+err);
		return err;
	}
	res.status(200).send(voted);
});
}
