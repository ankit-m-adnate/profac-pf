var mongoose = require( 'mongoose' );

var Organization = require('../models/organizations');
var jobtitleSchema = new mongoose.Schema({
name:String,
unique_code : {
    type : String
  },
organization : {type : String , ref : 'organization'}
 
})

jobtitleSchema.index({ name: 1, organization: 1, unique_code: 1},{unique:true});

jobtitleSchema.post('save', function(doc, next) {
  Organization.update({'_id':doc.organization},{$addToSet: { 'designations': doc._id}},function(err,doc){
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
module.exports = mongoose.model('jobtitle', jobtitleSchema);

