var mongoose = require( 'mongoose' );
var planSchema = new mongoose.Schema({
  txn: {
    type: mongoose.Schema.Types.ObjectId,
    ref : 'txns'
  },
  identifier : {
	  type : String
  },
  restrictions: {
	  type : mongoose.Schema.Types.Mixed
  },
  app : {
    type : String
  },
  tags : [{type : String}],
  cost : {type : Number},
  months : {type : Number},
  promoCode : {type : mongoose.Schema.Types.Mixed},
  rank : {type : Number}
});
module.exports = mongoose.model('plans', planSchema, 'plans');
