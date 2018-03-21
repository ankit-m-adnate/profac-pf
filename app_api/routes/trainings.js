var express = require('express');
var router = express.Router();

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});

/* get all employee details */
var ctrlTraining = require('../controllers/trainings.controller');
var ctrlAuth = require('../controllers/authentication');
var ctrlsession =  require('../controllers/session.controller');


router.post('/enroll', ctrlsession.validSession, ctrlTraining.enrollTrainingCourse);

router.get('/getTraining/:access_token/:org', ctrlsession.validSession,  ctrlTraining.userTrainings);

router.post('/endlesson', ctrlsession.validSession, ctrlTraining.endLesson);

router.post('/startLesson', ctrlsession.validSession, ctrlTraining.startLesson);

module.exports = router;
