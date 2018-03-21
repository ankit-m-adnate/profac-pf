var mongoose = require( 'mongoose' );

var Organization = require('../models/organizations');
var departmentSchema = new mongoose.Schema({
name:String,
unique_code : {
    type : String
  },
organization : {type : String , ref : 'organization'}

})
 departmentSchema.index({ name: 1, organization: 1, unique_code: 1},{unique:true});
 departmentSchema.post('save', function(doc, next) {
  Organization.update({'_id':doc.organization},{$addToSet: { 'departments': doc._id}},function(err,doc){
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
module.exports = mongoose.model('department', departmentSchema);
