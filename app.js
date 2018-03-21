var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var passport = require('passport');
var routes = require('./app_api/routes/index');
var users = require('./app_api/routes/users');
var comments = require('./app_api/routes/comments');
var payments = require('./app_api/routes/payments')
var trainings = require('./app_api/routes/trainings');
var workinghours = require('./app_api/routes/workinghours');
var designation_history = require('./app_api/routes/designation_history');
var workingdays = require('./app_api/routes/workingdays');
var leaveaudit = require('./app_api/routes/leaveaudit');
var licenses = require('./app_api/routes/licenses')
var notifications = require('./app_api/routes/notifications')
var multer = require('multer');
var app = express();
var http = require('http');
var session = require('express-session');
var MongoStore = require('connect-mongo')(session);
var cookieSession = require('cookie-session')
var mongoose = require('mongoose');
var pfConfig = require('./app_api/controllers/utilities.controller').getConfig();
// SET ONLY THE APP DOMAINS RATHER THAN '*'
var permitCrossDomainRequests = function(req, res, next) {
  var allowedOrigins = pfConfig.whiteList;
    var origin = req.headers.origin;
    if(allowedOrigins.indexOf(origin) > -1){
         res.setHeader('Access-Control-Allow-Origin', origin);
    }
//res.header('Access-Control-Allow-Origin', '*');
res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
res.header('Access-Control-Allow-Headers', 'X-Requested-With, X-HTTP-Method-Override, Content-Type, Accept');
res.header('Access-Control-Allow-Credentials', true);
// some browsers send a pre-flight OPTIONS request to check if CORS is enabled so you have to also respond to that
if ('OPTIONS' === req.method) {
  res.send(200);
}
else {
  next();
}
};
app.use(permitCrossDomainRequests);
// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

//set env variables for credentials logging
process.env.HOME = 'home';
process.on('uncaughtException', function (err) {
  console.error(err.stack);
});

require('./app_api/config/auth');
//require('./app_api/config/passport')(passport);
require('./app_api/config/passport');
require('./app_api/models/db');

// app.use(cookieParser('S3CRE7'));
// app.use(cookieSession({
//   name: 'session',
//   keys: ['key1', 'key2']
// }));
app.use(cookieParser());
var socketExpressSession = session({
  key : pfConfig.sessionKey,
  secret: pfConfig.sessionSecret,
  cookie : {maxAge: (365 * 24 * 60 * 60 * 1000), domain : pfConfig.cookieDomain},
  store: new MongoStore({
  mongooseConnection: mongoose.connection
  }),
  resave : false,
  saveUninitialized : false
})
app.use(socketExpressSession);
app.use(passport.initialize());
app.use(passport.session());

// uncomment after placing your favicon in /public
app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'uploads')));
// [SH] Set the app_client folder to serve static resources
app.use(express.static(path.join(__dirname, 'app_client')));
app.use(express.static(path.resolve("\\..\\HRMS_Uploads\\employee_profilePictures\\")));
app.use('/pFactory', routes);
app.use('/users', users);
app.use('/trainings', trainings);
app.use('/comment', comments);
app.use('/workinghours',workinghours);
app.use('/workingdays',workingdays);
app.use('/designation_history',designation_history);
app.use('/leaveaudit',leaveaudit);
app.use('/notifs', notifications)
app.use('/pay', payments)
app.use('/lic', licenses)

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  // res.render('error', {
  //   message: err.message,
  //   error: {}
  // });
});

//app.listen(1337);
//console.log('Server running at http://127.0.0.1:1337/ ... :)');


module.exports.app = app;
//module.exports.sessions = socketExpressSession;
