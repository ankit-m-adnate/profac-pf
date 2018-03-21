var express = require('express');
var router = express.Router();

var ctrlWorkingHours = require('../controllers/workingHours.controller');

router.post('/setWorkingHours', ctrlWorkingHours.setWorkingHours);
router.post('/updateWorkingHours', ctrlWorkingHours.updateWorkingHours);
router.get('/deleteWorkingHours', ctrlWorkingHours.deleteWorkingHours);
router.get('/getWorkingHours', ctrlWorkingHours.getWorkingHours);
module.exports = router;