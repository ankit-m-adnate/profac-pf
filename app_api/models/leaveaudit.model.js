var mongoose = require( 'mongoose' );


var leaveAuditSchema = new mongoose.Schema({
action_by:{
	type: mongoose.Schema.Types.ObjectId, ref: 'User'
       },
action_for:{
	type: mongoose.Schema.Types.ObjectId, ref: 'User'
       },
    timestamp : {
	  type : Date,default: Date.now
  },
leave_count :{
	  type : Number
},
leave_type :{
	  type : String
}      
})
module.exports = mongoose.model('leaveAllotmentAudit', leaveAuditSchema);
