var express = require('express');
var router = express.Router();
var ctrlNotif = require('../controllers/notifications')

router.post('/push' , ctrlNotif.push);

router.get('/notifications/:org/:app/:user', ctrlNotif.getNotifications)

module.exports = router;
