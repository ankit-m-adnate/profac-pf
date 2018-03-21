var mongoose = require( 'mongoose' );
var notif_io = require('./../../bin/www');

var notificationSchema = new mongoose.Schema({
organization : {type : String , ref : 'organization'},
app : {type : String},
user:{type: mongoose.Schema.Types.ObjectId, ref: 'User'},
timestamp : {type : Date, default : Date.now},
item : {
	module : String,
	navid : String,
	from : {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
	sentence : String
},
seen : {type : Boolean, default : false},
action : Boolean,
actionable : Boolean
})


notificationSchema.post('save', function(doc, next) {
  mongoose.model('notifications', notificationSchema).findOne({_id : doc._id})
  .populate('item.from')
  .exec(function(err, notif){
  	if(err){
  		console.log(err)
  		next()
  	}
  	if(notif){
  		console.log('SAVED NOTIF : ', notif)
		console.log('emitting event on topic', notif.organization + '/' + notif.app + '/' + notif.user)
		notif_io.notif_io.emit(notif.organization + '/' + notif.app + '/' + notif.user, notif)
		next()
  	}
    else{
      console.log('no matching notif found for : ', doc)
      next()
    }
  })
});



module.exports = mongoose.model('notifications', notificationSchema);


