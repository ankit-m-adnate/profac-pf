var express = require('express');
var router = express.Router();

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});

/* get all employee details */
var ctrlEmployees = require('../controllers/users.controller');
var ctrlAuth = require('../controllers/authentication');
var ctrlsession=require('../controllers/session.controller');
router.get('/getEmployees',ctrlsession.validSession,ctrlEmployees.getEmployees);
router.get('/getInactiveEmployees',ctrlsession.validSession,ctrlEmployees.getInactiveEmployees);
router.get('/getSalariedEmployees',ctrlsession.validSession,ctrlEmployees.getSalariedEmployees);
router.get('/getRMSEmployees',ctrlsession.validSession,ctrlEmployees.getRMSEmployees);
router.get('/getHRs',ctrlEmployees.getHRs);
router.get('/getFinances',ctrlEmployees.getFinances);
router.get('/getEmployeesCount', ctrlsession.validSession, ctrlEmployees.getEmployeesCount);
/*save employee details*/
router.post('/onBoarding',ctrlsession.validSession,ctrlEmployees.onBoard);
router.post('/bulkOnBoard',ctrlEmployees.bulkOnBoard);

router.get('/new_t', ctrlsession.validSession, ctrlEmployees.new_t);

router.get('/getProfile/:email',ctrlsession.validSession, ctrlEmployees.getProfile);
router.get('/getEmployeeJobtitle',ctrlsession.validSession, ctrlEmployees.getEmployeeJobtitle);
router.get('/getDocs/:email',ctrlsession.validSession,ctrlEmployees.getDocs);

router.get('/getPFProfile/:email',ctrlsession.validSession, ctrlEmployees.getPFProfile);

router.post('/updateProfile',ctrlsession.validSession,ctrlEmployees.updateProfile);

router.post('/updateEmployeeStatus',ctrlsession.validSession,ctrlEmployees.updateEmployeeStatus);

router.post('/updateEmployeeCode',ctrlsession.validSession,ctrlEmployees.updateEmployeeCode);

router.post('/updateEmployeeDocs',ctrlsession.validSession,ctrlEmployees.updateEmployeeDocs);

router.post('/updateProject',ctrlsession.validSession,ctrlEmployees.updateProject);

router.post('/addEmploymentHistory',ctrlsession.validSession,ctrlEmployees.addEmploymentHistory);
router.post('/deleteEmploymentHistory',ctrlsession.validSession,ctrlEmployees.deleteEmploymentHistory);

router.get('/getSupervisors',ctrlsession.validSession,ctrlEmployees.getSupervisors);

router.get('/getSupervisorsByUser',ctrlsession.validSession,ctrlEmployees.getSupervisorsByUser);

router.post('/validateUser', ctrlsession.validSession, ctrlEmployees.validateUser);

router.post('/inviteUser', ctrlsession.validSession, ctrlEmployees.inviteUserToApp);

router.get('/usersByOrg', ctrlsession.validSession, ctrlEmployees.usersByOrg);

router.post('/permissions', ctrlsession.validSession, ctrlEmployees.editPermissions);

router.post('/verifyMobile', ctrlsession.validSession, ctrlEmployees.verifyMobile);

router.post('/submitOTP', ctrlsession.validSession, ctrlEmployees.submitOTP);

//added on 21/06/2017
router.post('/updateUserRoles', ctrlsession.validSession, ctrlEmployees.updateUserRoles);
router.get('/getUsersDetails',ctrlsession.validSession,ctrlEmployees.getUsersDetails);
router.get('/getAllSupervisors',ctrlsession.validSession,ctrlEmployees.getAllSupervisors);

router.post('/getEmpCounter', ctrlsession.validSession, ctrlEmployees.getEmpCounter);
module.exports = router;
