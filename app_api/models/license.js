// @ts-check --checkJs
'use strict'

var mongoose = require( 'mongoose' );


var licenseSchema = new mongoose.Schema({
_id : {
  type : String,
   unique: true,
required: true
},
orgid : String,
orgname : {type : String , ref : 'organization'},
used: {type : Boolean, default : false},
userLimit : {type :Number},
usedAt : {type: Date},
reusedAt : [{type: Date}],
reuseData : [{type : mongoose.Schema.Types.Mixed}],
first_name: {type : String},
last_name: {type : String},
email: {type: String},
phone : {type : Number},
mode : {
    type : String,
    enum : ['OFFLINE','ONLINE'],
    default : 'OFFLINE'
},
macAsSalt : {type : String},
app : {type: String},
hash: {type: String},
expires : {type: Date},
validity : {type : Number},
partnerName : {type : String},
partnerCode : {type : String},
createdAt : {type : Date},
appVersion : {type : String},
hddId : {type : String},
organizations : [{type : mongoose.Schema.Types.Mixed}]
//appVersion : {type: String}
})


module.exports = mongoose.model('licenses', licenseSchema);
