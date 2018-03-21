var express = require('express');
var router = express.Router();

var ctrldesignationhistory = require('../controllers/designation_history.controller');


router.get('/getHistory', ctrldesignationhistory.getHistory);



module.exports = router;