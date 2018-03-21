var express = require('express');
var router = express.Router();

var ctrlWorkingDays = require('../controllers/workingDays.controller');

//router.post('/setWorkingDays', ctrlWorkingDays.setWorkingDays);
router.post('/setWorkingDays',ctrlWorkingDays.setWorkingDays);

router.post('/updateWorkingDays',ctrlWorkingDays.updateWorkingDays);

router.get('/deleteWorkingDays', ctrlWorkingDays.deleteWorkingDays);

router.get('/getWorkingDays', ctrlWorkingDays.getWorkingDays);

module.exports = router;