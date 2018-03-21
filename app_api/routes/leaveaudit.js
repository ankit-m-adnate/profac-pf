var express = require('express');
var router = express.Router();
/*leave allotment audit*/
var ctrlleaveAudit = require('../controllers/leaveAudit.controller');
/*insert bulk of records*/
router.post('/leaveaudit', ctrlleaveAudit.getleaveAudit);

module.exports = router;
