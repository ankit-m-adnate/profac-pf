var express = require('express');
var router = express.Router();


var ctrlAuth = require('../controllers/authentication');
var ctrlsession =  require('../controllers/session.controller');
var ctrlPayments = require('../controllers/payments.controller')

router.post('/getPaymentKeys', ctrlsession.validSession, ctrlPayments.getPaymentKeys)

router.post('/checkout/success', ctrlsession.validSession, ctrlPayments.payuSuccess)

router.post('/checkout/failure', ctrlsession.validSession, ctrlPayments.payuFailure)

router.get('/g/:_id', ctrlsession.validSession, ctrlPayments.getTxnById)


module.exports = router;
