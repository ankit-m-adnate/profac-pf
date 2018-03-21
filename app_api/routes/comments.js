var express = require('express');
var router = express.Router();


var ctrlTraining = require('../controllers/trainings.controller');
var ctrlAuth = require('../controllers/authentication');
var ctrlComment = require('../controllers/comment.controller');
var ctrlsession =  require('../controllers/session.controller');

/*post comments*/
router.post('/addComment', ctrlsession.validSession, ctrlComment.addComment);
/*new comment*/
//router.post('/newComment', ctrlComment.newComment);
/*get all comment*/
router.get('/getComments', ctrlsession.validSession,  ctrlComment.getComments);
/*upvoting to comment*/
router.post('/upVoting', ctrlsession.validSession,  ctrlComment.upVoting);
/*downvoting to comment*/
router.post('/downVoting', ctrlsession.validSession , ctrlComment.downVoting);

module.exports = router;
