
var mongoose = require( 'mongoose' );
var crypto = require('crypto');

var commentSchema = new mongoose.Schema({
organization : {type:String,required : true},
	topic : String,
	email : String,
	text : String,
	time: { type: Date, default: Date.now },
	upvotes: [String],
	downvotes: [String]
	//parent: mongoose.Schema.Types.ObjectId

});



module.exports = mongoose.model('Comment', commentSchema, 'comments');







//2nd attempt

/*var mongoose = require('mongoose');

var PostSchema = new mongoose.Schema({
    title: String,
    postedBy: {

        user : String
    },
    comments: [{
        text: String,
        postedBy: {
           
            user : String
        }
    }]
});

module.exports = mongoose.model("Post", PostSchema);*/










//1st attempt
  /*comments: [ 
    { user: String, text: String, 
      replies: [ 
        { user: String, text: String },
        subreplies : [{user:String, text : String}] 
        ] 
    }
  ] */