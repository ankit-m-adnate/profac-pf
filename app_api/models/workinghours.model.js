var mongoose = require( 'mongoose' );

var Organization = require('../models/organizations');
var workingHoursSchema = new mongoose.Schema({
	workingHours:{
  open : String,
  pause : String,
  cont : String,
  close : String
},

offset : Number,
desc : String,
organization : {type:String, ref : 'organization'},
unique_code : {
    type : String
  },
  virtualExtension: {
    type : Number
  },
  maxAutoApprovalDuration: {
    type : Number
  },
  approvalFrom: [{
    type: String,
    enum : ['MANAGER', 'HR']
  }]
});
workingHoursSchema.index({ organization: 1, unique_code: 1},{unique:true});

workingHoursSchema.post('save', function(doc, next) {
  Organization.update({'_id':doc.organization},{$addToSet: { 'shifts': doc._id}},function(err,doc){
    if(err)
    {
      next();
    }
    else
    {
      next();
    }
  })
});

module.exports = mongoose.model('workinghours', workingHoursSchema);