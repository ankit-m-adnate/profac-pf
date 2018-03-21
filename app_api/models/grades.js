var mongoose = require( 'mongoose' );


var gradeSchema = new mongoose.Schema({
	
name:String,
organization : {type : String , ref : 'organization'}
 
})
  gradeSchema.index({ name: 1, organization: 1},{unique:true});
module.exports = mongoose.model('grade', gradeSchema);
