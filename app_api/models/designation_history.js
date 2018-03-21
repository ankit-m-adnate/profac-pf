var mongoose = require( 'mongoose' );
var designation_historySchema = new mongoose.Schema({
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref : 'User'
  },
  organization: {
    type : String, ref : 'organization'
  },
 creation_date:Date,
 action:String,
  new:{
    type: mongoose.Schema.Types.ObjectId,
    ref : 'jobtitle'
  },
  old:{
    type: mongoose.Schema.Types.ObjectId,
    ref : 'jobtitle'
  },
  type:{
    type : String,
    default:'designation'
  }
 
});
module.exports = mongoose.model('designation_history', designation_historySchema);
