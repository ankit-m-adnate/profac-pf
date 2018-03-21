var mongoose = require( 'mongoose' );


var employerSchema = new mongoose.Schema({
  _id: {
    type: String,
   unique: true
    },	
email:String,
name:String,
contact_no:Number,
contact_name:String,
office_address:String,
notes:String,
organization : {type : String , ref : 'organization'}
 
})

module.exports = mongoose.model('employer', employerSchema);
