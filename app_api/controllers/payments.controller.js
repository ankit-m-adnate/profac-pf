/**
 *
 *	HASH FOR PAYU PAYMENT REQUEST
 * hashSequence = key|txnid|amount|productinfo|firstname|email|udf1|udf2|udf3|udf4|udf5||||||salt.
 *
 *
 */


/**
 *
 * HASH FOR PAYU PAYMENT RESPONSE
 * hashSequence = salt|status||||||udf5|udf4|udf3|udf2|udf1|email|firstname|productinfo|amount|txnid|key
 *
 */


 const payu_test = 'test.payumoney.com'
 const payu_secure = 'www.payumoney.com'


 var mongoose = require('mongoose')
 var crypto = require('crypto')
 var PaymentTransactions = require('../models/paymenttransactions')
 var Organizations = require('../models/organizations')
 var Plans = require('../models/plans')
 var Users = require('../models/users')
 var _ = require('underscore')
 var Utilities = require('./utilities.controller')
 /*----------  for production  ----------*/
const payu_key = 'PL8kI6Om'
const payu_salt = 'FaIJqJDqgf'
const payu_header_auth = 'JSCyvjgDbBYSrKXt/QU9FCzpW376CatvQ3DGSKWhxyY='


/*----------  for test  ----------*/
//const payu_key = 'gtKFFx'
//const payu_salt = 'eCwWELxi'



/*=============================================
=            called before payment request to generate hash sequence and hash  =
				SEE HASH SEQUENCES AT TOP
=============================================*/

module.exports.getPaymentKeys = function(req, res){

	if(req.body.a && req.body.fn && req.body.e && req.body.ap && req.body.o && req.body.u && req.body.rs){
		

		Plans.findOne({_id : req.body.ap})
		.populate('txn')
		.exec(function(err, plan){
			if(err){
				console.error(err)
				res.sendStatus(500)
				return
			}
			if(plan){
				var productInfo = plan.txn.displayName + ' - ' + plan.identifier
				var emptyTransaction = new PaymentTransactions();
				emptyTransaction.start_at = new Date()
				emptyTransaction.amount = parseFloat(req.body.a).toFixed(2)
				emptyTransaction.productinfo = productInfo
				emptyTransaction.firstname = req.body.fn.trim()
				emptyTransaction.email = req.body.e.trim()
				emptyTransaction.plan = req.body.ap
				emptyTransaction.organization = req.body.o
				emptyTransaction.user = req.body.u
				emptyTransaction.udf4 = req.body.rs
				emptyTransaction.udf6 = req.body.dc   		//discountcode
				emptyTransaction.udf7 = plan.cost     		//actualamount
				emptyTransaction.udf8 = req.body.dp  		//discountPercentage
				emptyTransaction.udf10 = req.body.origin 	//origination url to be used on transaction failure
				emptyTransaction.udf9 = plan.txn._id 			//app for which the plan has been bought
				//emptyTransaction.udf5 = req.body.rf
				emptyTransaction.save(function(err, et){
					if(err){
						console.error(err)
						res.sendStatus(500)
						return
					}
					else{
						var txnid = et._id
						var hashString = 
						payu_key + '|' 								//KEY
						+  txnid + '|' 								//TXNID
						+ parseFloat(req.body.a).toFixed(2) + '|' 	//AMOUNT
						+ productInfo + '|' 						//PRODUCTINFO
						+ req.body.fn + '|' 						//FIRSTNAME
						+ req.body.e  + '|'	 			 			//EMAIL
						+ req.body.ap + '|'							//PLANID
						+ req.body.o + '|'							//ORGANIZATIONID
						+ req.body.u + '|'							//USER
						+ req.body.rs + '|'							//PFSUCCESSREDIRECTURI
						+  '|'										//UDF5
						+ '|||||'									//separator for salt
						+ payu_salt									//SALT


						var hash = crypto.createHash('sha512').update(hashString).digest('hex')
						console.log(hash, hashString)
						res.json({
							"key" : payu_key,
							"hashString" : hashString,
							"hash" : hash,
							"txnid" : txnid,
							"pi" : productInfo
						})

					}
				})
			}
			else{
				console.log('no such plan found')
				res.sendStatus(400)
			}
		})
	}
	else{
		console.log('invalid request body')
		res.sendStatus(400)
	}
}


				/*=====  End of Section comment block  ======*/



/*=====================================================
=  SUCCESS CALLBACK FOR PAYUMONEY PAYMENT REQUEST     =
=====================================================*/

module.exports.payuSuccess = function(req, res){
	
	/**
	 *
	 * query paymenttransaction collection using txnid sent by payuMoney
	 * generate hash seq and validate against hash from payUMoney
	 * if valid -> push planid to organization
	 */
	
    	

	PaymentTransactions.findOne({_id : req.body.txnid})
	.populate('plan')
	.exec(function(err, pymtxn){
		if(err){
			console.error(err)
			// we could redirect to failure on frontEnd and rollback
			res.sendStatus(500)
			return;
		}
		if(pymtxn){

		/**
			 *
			 * generate and compare hash returned from payu to validate; 
			 * 
			 * SEE SEQUENCE: HASH FOR PAYU PAYMENT RESPONSE at top
			 */

			var hashString = 
						payu_salt + '|' 								//SALT
						+  req.body.status + '|' 						//STATUS
						+ '|||||' 										//separator
						+ '|' 											//udf5
						+ pymtxn.udf4 + '|' 							//udf4
						+ pymtxn.user  + '|'	 			 			//USER
						+ pymtxn.organization + '|'						//ORGANIZATION
						+ pymtxn.plan._id.toString() + '|'				//PLANID
						+ pymtxn.email + '|'							//EMAIL
						+ pymtxn.firstname + '|'						//FIRSTNAME
						+ pymtxn.productinfo + '|'						//PRODUCTINFO
						+ parseFloat(pymtxn.amount).toFixed(1) + '|'	//AMOUNT
						+ pymtxn._id + '|'								//TXNID
						+ payu_key										//KEY

		    var hash = crypto.createHash('sha512').update(hashString).digest('hex')
		    console.log(hash, hashString ,req.body.hash)
		    console.log(req.body)
	        //PROCEED IF HASH MATCHES
		    if(hash == req.body.hash){
		    	//if(1==1){
		    	console.log('hashes match, req.body from payU ::', req.body)

				pymtxn.status = req.body.status
				pymtxn.firstname = req.body.firstname
				pymtxn.amount = req.body.amount
				pymtxn.hash = req.body.hash
				pymtxn.productinfo = req.body.productinfo
				pymtxn.email = req.body.status
				pymtxn.payuMoneyId = req.body.payuMoneyId
				pymtxn.mode = req.body.mode
				pymtxn.organization = req.body.udf2
				pymtxn.user = req.body.udf3
				pymtxn.end_at = new Date()
				pymtxn.unmappedstatus = req.body.unmappedstatus
				pymtxn.cardCategory = req.body.cardCategory
				pymtxn.discount = req.body.discount
				pymtxn.net_amount_debit = req.body.net_amount_debit
				pymtxn.addedon = req.body.addedon
				pymtxn.lastname= req.body.lastname
			    pymtxn.address1= req.body.address1
				pymtxn.address2= req.body.address2
				pymtxn.city= req.body.city
				pymtxn.state= req.body.state
				pymtxn.country= req.body.country
				pymtxn.zipcode= req.body.zipcode
				pymtxn.phone= req.body.phone
				pymtxn.udf5 = req.body.udf5
				pymtxn.udf6= req.body.udf6
				pymtxn.udf7= req.body.udf7
				pymtxn.udf8= req.body.udf8
				pymtxn.udf10= req.body.udf10
				pymtxn.field1= req.body.field1
				pymtxn.field2= req.body.field2
				pymtxn.field3= req.body.field3
				pymtxn.field4= req.body.field4
				pymtxn.field5= req.body.field5
				pymtxn.field6= req.body.field6
				pymtxn.field7= req.body.field7
				pymtxn.field8= req.body.field8
				pymtxn.field9= req.body.field9
				pymtxn.payment_source= req.body.payment_source
				pymtxn.PG_TYPE= req.body.PG_TYPE
				pymtxn.bank_ref_num= req.body.bank_ref_num
				pymtxn.bankcode= req.body.bankcode
				pymtxn.error= req.body.error
				pymtxn.error_Message= req.body.error_Message
				pymtxn.name_on_card= req.body.name_on_card
				pymtxn.cardnum= req.body.cardnum
				pymtxn.cardhash= req.body.cardhash
				pymtxn.issuing_bank= req.body.issuing_bank
				pymtxn.card_type= req.body.card_type
				pymtxn.mihpayid = req.body.mihpayid

				var appid = req.body.udf9

				Organizations.findOne({_id : req.body.udf2})
				.populate('plans')
				.exec(function(err, org){
					if(err){
						console.error(err)
		    			res.sendStatus(500)
		    			return;
					}
					if(org){
						console.log(org.plans, pymtxn.udf9, appid)
						var currentPlan = _.find(org.plans, function(p){
					        return String(p.txn) === String(pymtxn.udf9)
				    	})

						if(currentPlan === undefined){
							currentPlan = ''
							console.log('no current plan found')
						}

							Organizations.update({_id : req.body.udf2}, {$addToSet : {"plans" : pymtxn.plan._id}}, {}, function(err, numAffected){
					    		console.log(numAffected)
					    		if(err){
					    			console.error(err)
					    			res.sendStatus(500)
					    			return;
					    		}

					    		Organizations.update({_id : req.body.udf2}, {$pull : {"plans" : currentPlan._id}}, {}, function(err, num){
					    			if(err) 
					    				console.log('could not pull currentPlan', err)
					    			else
				    					console.log('pull existing plan ::', num)
					    		})

					    		if(numAffected.ok == 1 && numAffected.nModified == 1){
					    			pymtxn.save(function(err){
				    					if(err){
				    						/**
				    						 *
				    						 * ROLL-BACK PLAN PUSHED TO ORGANIZATION AND INITIATE REFUND
				    						 *
				    						 */
				    						
				    						//pull plan from organization
				    						Organizations.update({_id : pymtxn.organizaiton}, {$pull : {"plans" : pymtxn.plan._id}}).exec()

				    						Organizations.update({_id : pymtxn.organizaiton}, {$addToSet : {"plans" : currentPlan._id}}).exec()

				    						//initiate transaction refund
				    						module.exports.initiateRefund(pymtxn.mihpayid, parseFloat(pymtxn.amount).toFixed(2), function(err, res){
				    							if(err){
													/**
													 *
													 * queue refund to be processed later
													 *
													 */
													
												}
												else{
													pymtxn.refund = res
													pymtxn.markModified('refund')
													pymtxn.save()
													res.redirect(Utilities.getConfig().hostUrl+'/#/payment/failure?txnid=' + pymtxn.txnid)
												}
				    						})

				    						


				    					}
				    					else{

				    						Users.findOne({_id : pymtxn.user})
				    						.populate('organization.id')
				    						.exec(function(err, u){
				    							if(err){
				    								console.error(err)
				    								res.redirect(Utilities.getConfig().hostUrl)
				    							}
				    							if(u){
				    								var access_token = u.generateJwt()
				    								res.redirect(pymtxn.udf4 + '?access_token=' + access_token + '&appid=' + pymtxn.plan.txn)
				    							}
				    							else{
				    								res.redirect(Utilities.getConfig().hostUrl)	
				    							}
				    						})
				    					}
				    				})
					    		}

							    else{
									/**
									 *
									 * INITIATE PAYMENT REFUND
									 *
									 */
									module.exports.initiateRefund(pymtxn.mihpayid, parseFloat(pymtxn.amount).toFixed(2), function(err, res){
										if(err){
											/**
											 *
											 * queue refund to be processed later
											 *
											 */
											
										}
										else{
											pymtxn.refund = res
											pymtxn.markModified('refund')
											pymtxn.save()
											res.redirect(Utilities.getConfig().hostUrl+'/#/payment/failure?txnid=' + pymtxn.txnid)
										}
									})	
							    }		    				
							})
						}
					else{
						console.log('payment confirmation failed on pf side')
					}
				})
			}
			else{
				/**
				 *
				 * HASH DID NOT MATCH. HANDLE.
				 * pata nai kya karna, payu se poocho
				 */
				console.log('hash did not match')
			}
		}
		else{
			// txnid returned from payuMoney did not match

			/**
			 *
			 * this is the same as hash not matching
			 *
			 */
			
		}
	})    
}

	/*=====  End of Section comment block  ======*/



/*======================================================
=  FAILURE CALLBACK FOR PAYUMONEY PAYMENT REQUEST      =
=======================================================*/

module.exports.payuFailure = function(req, res){

	PaymentTransactions.findOne({_id : req.body.txnid}, function(err, pymtxn){
		if(err){
			console.log(err)

		}
		if(pymtxn){
			res.redirect(pymtxn.udf10)
		}
	})

		
}

/*=====  End of Section comment block  ======*/




/*=======================================
=            INITIATE REFUND            =
=======================================*/


module.exports.initiateRefund = function(paymentid, refundamount, callback){
	var options = {
	   host: payu_test,
	   port: 443,
	   path: '/payment/merchant/refundPayment/?paymentId=' + paymentid + '&refundAmount=' + refundamount + '&merchantKey=' + payu_key,
	   // authentication headers
	   headers: {
	      'Authorization': payu_header_auth,
	      'Content-Type' : 'application/json'
	   }   
	};
	//this is the call
	request = https.post(options, function(res){
	   var body = "";
	   res.on('data', function(data) {
	      body += data;
	   });
	   res.on('end', function() {
	    //here we have the full response, html or json object
	      console.log(body);
	      callback(null, body)
	   })
	   res.on('error', function(e) {
	      console.log("Got error: " + e.message);
	      callback(e)
	   });
		});
	}
/*=====  End of INITIATE REFUND  ======*/



/*=====================================================
=            GET paymenttransaction by _id            =
=====================================================*/

module.exports.getTxnById = function(req, res){
	console.log(req.params)
	PaymentTransactions.findOne({_id : req.params._id})
	.populate({path : 'plan', populate : {path : 'txn'}})
	.exec(function(err, pymtxn){
		if(err){
			console.error(err)
			res.sendStatus(500)
			return
		}
		if(pymtxn){
			res.send(pymtxn)
		}
		else{
			res.sendStatus(400)
		}
	})
}

/*=====  End of GET paymenttransaction by _id  ======*/






