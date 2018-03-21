// @ts-check --checkJs
var mongoose = require( 'mongoose' );


var freeofflinetrialsSchema = new mongoose.Schema({

orgid : String,
orgname : {type : String , ref : 'organization'},
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
expires : {type: Date},
appVersion : {type : String},
hddId : {type : String},
organizations : [{type : mongoose.Schema.Types.Mixed}]
//,
//appVersion : {type: String}
})


module.exports = mongoose.model('freeofflinetrials', freeofflinetrialsSchema);
