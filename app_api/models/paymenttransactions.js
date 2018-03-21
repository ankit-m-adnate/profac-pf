var mongoose = require( 'mongoose' );


var paymenttransactionsSchema = new mongoose.Schema({

status : {
	type : String
},
firstname : {
	type : String
},
amount : {
	type : Number
},
txnid : {
	type : mongoose.Schema.Types.ObjectId
},
hash : {
	type : String
},
productinfo : {
	type : String
},
phone : {
	type : Number
},
email : {
	type : String
},
payuMoneyId : {
	type : String
},
mode : {
	type : String
},
plan : {
	type : mongoose.Schema.Types.ObjectId, ref : 'plans'
},
start_at : {
	type : Date
},
end_at : {
	type : Date
},
unmappedstatus : {
	type : String
},
cardCategory : {
	type : String
},
discount : {
	type : String
},
net_amount_debit : {
	type : String
},
addedon : {
	type : String
},
lastname : {
	type : String
},
address1 : {
	type : String
},
address2 : {
	type : String
},
city : {
	type : String
},
state : {
	type : String
},
country : {
	type : String
},
zipcode : {
	type : String
},
organization : {
	type : String, ref : 'organization'
},
user : {
	type : mongoose.Schema.Types.ObjectId, ref : 'User'
},
udf4 : {
	type : String
},
udf5 : {
	type : String
},
udf6 : {
	type : String
},
udf7 : {
	type : String
},
udf8 : {
	type : String
},
udf9 : {
	type : String
},
udf10 : {
	type : String
},
field1 : {
	type : String
},
field2 : {
	type : String
},
field3 : {
	type : String
},
field4 : {
	type : String
},
field5 : {
	type : String
},
field6 : {
	type : String
},
field7 : {
	type : String
},
field8 : {
	type : String
},
field9 : {
	type : String
},
payment_source : {
	type : String
},
PG_TYPE : {
	type : String
},
bank_ref_num : {
	type : String
},
bankcode : {
	type : String
},
error : {
	type : String
},
error_Message : {
	type : String
},
name_on_card : {
	type : String
},
cardnum : {
	type : String
},
cardhash : {
	type : String
},
issuing_bank : {
	type : String
},
card_type : {
	type : String
},
mihpayid : {
	type : String
},
refund : {
	type : mongoose.Schema.Types.Mixed
}
})


module.exports = mongoose.model('paymenttransactions', paymenttransactionsSchema);
