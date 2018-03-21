var mongoose = require( 'mongoose' );

var Organization = require('../models/organizations');
var branchSchema = new mongoose.Schema({
ucode : {
  type : String,
   
required: true
},
name:String,
organization : {type : String , ref : 'organization'},
hr:[{type: mongoose.Schema.Types.ObjectId, ref: 'User'}],
Accountants:[{type: mongoose.Schema.Types.ObjectId, ref: 'User'}],
address : String,
country : String,
location : String,
contact : {
  code : Number,
  number : Number
},geofencing : {
  lattitude : Number,
  longitude : Number,
  radius:Number
},
timezone : String
})

branchSchema.index({organization : 1, ucode : 1}, {unique : true});

branchSchema.post('save', function(doc, next) {
  Organization.update({'_id':doc.organization},{$addToSet: { 'branches': doc._id}},function(err,doc){
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
module.exports = mongoose.model('branch', branchSchema);
