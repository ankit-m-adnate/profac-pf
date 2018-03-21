var mongoose = require('mongoose');
var gracefulShutdown;
var Utilities = require('../controllers/utilities.controller');
var dbURI = 'mongodb://'+Utilities.getConfig().dbDomain+':'+Utilities.getConfig().dbPort+'/PROCESSFACTORY?authSource='+Utilities.getConfig().dbAuthSource;
if (process.env.NODE_ENV === 'production') {
  dbURI = process.env.MONGOLAB_URI;
}

var dbOptions = {
  user : Utilities.getConfig().dbUserName,
  pass : Utilities.getConfig().dbPass
};
console.log(dbOptions)
mongoose.connect(dbURI, dbOptions);
//mongoose.connect(dbURI);

// CONNECTION EVENTS
mongoose.connection.on('connected', function() {
  console.log('Mongoose connected to ' + dbURI);
});
mongoose.connection.on('error', function(err) {
  console.log('Mongoose connection error: ' + err);
});
mongoose.connection.on('disconnected', function() {
  console.log('Mongoose disconnected');
});

// CAPTURE APP TERMINATION / RESTART EVENTS
// To be called when process is restarted or terminated
gracefulShutdown = function(msg, callback) {
  mongoose.connection.close(function() {
    console.log('Mongoose disconnected through ' + msg);
    callback();
  });
};
// For nodemon restarts
process.once('SIGUSR2', function() {
  gracefulShutdown('nodemon restart', function() {
    process.kill(process.pid, 'SIGUSR2');
  });
});
// For app termination
process.on('SIGINT', function() {
  gracefulShutdown('app termination', function() {
    process.exit(0);
  });
});
// For Heroku app termination
process.on('SIGTERM', function() {
  gracefulShutdown('Heroku app termination', function() {
    process.exit(0);
  });
});

// BRING IN YOUR SCHEMAS & MODELS
require('./users');
require('./txns');
require('./plans');
require('./comments.model');
require('./organizations');
require('./employers');
require('./branches');
require('./payroll_structures');
require('./departments');
require('./workingdays.model');
require('./workinghours.model');
require('./leaveaudit.model');
require('./trainings.model')
require('./notifications')
require('./freeofflinetrails')
require('./license')