var express = require('express');
var router = express.Router();


var ctrlLicenses = require('../controllers/license');

router.post('/vlic_b', ctrlLicenses.validateBooksLicense)

router.post('/genlic', ctrlLicenses.generateLicense)

router.post('/getlic', ctrlLicenses.getLicenses)

module.exports = router;
