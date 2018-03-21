var mongoose = require( 'mongoose' );

var Organization = require('../models/organizations');
var workingDaysSchema = new mongoose.Schema({
workingDays:[],
organization : {type:String , ref : 'organization'},
tag:{type:String},
unique_code : {
    type : String
  }
});
workingDaysSchema.index({organization: 1, unique_code: 1},{unique:true});
workingDaysSchema.post('save', function(doc, next) {
  Organization.update({'_id':doc.organization},{$addToSet: { 'workdays': doc._id}},function(err,doc){
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
module.exports = mongoose.model('workingdays', workingDaysSchema);