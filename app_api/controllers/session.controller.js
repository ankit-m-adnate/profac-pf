var cookieParser = require('cookie-parser')
var MongoClient = require('mongodb').MongoClient;
var Utilities = require('./utilities.controller');
var url = 'mongodb://'+Utilities.getConfig().dbUserName+':'+Utilities.getConfig().dbPassUrlEncoded+'@'+Utilities.getConfig().dbDomain+':'+Utilities.getConfig().dbPort+'/PROCESSFACTORY?authSource='+Utilities.getConfig().dbAuthSource;

module.exports.validSession = function(req, res, next){
  var ua = req.headers['user-agent'],
  $ = {};

  //console.log('user-agent::' , ua);

  if (/mobile/i.test(ua))
      $.Mobile = true;

  if (/like Mac OS X/.test(ua)) {
      $.iOS = /CPU( iPhone)? OS ([0-9\._]+) like Mac OS X/.exec(ua)[2].replace(/_/g, '.');
      $.iPhone = /iPhone/.test(ua);
      $.iPad = /iPad/.test(ua);
  }

  if (/Android/.test(ua))
      $.Android = /Android ([0-9\.]+)[\);]/.exec(ua)[1];

  if (/webOS\//.test(ua))
      $.webOS = /webOS\/([0-9\.]+)[\);]/.exec(ua)[1];

  if (/(Intel|PPC) Mac OS X/.test(ua))
      $.Mac = /(Intel|PPC) Mac OS X ?([0-9\._]*)[\)\;]/.exec(ua)[2].replace(/_/g, '.') || true;

  if (/Windows NT/.test(ua))
      $.Windows = /Windows NT ([0-9\._]+)[\);]/.exec(ua)[1];

  //console.log($);
  if($.iOS || $.webOS || $.Mac || $.Windows){
    if(!req.cookies["_pf_.sid"]){
      res.send(401);
      return;
    }
    //console.log(req.cookies["_pf_.sid"]);
    var unsignedCookie = cookieParser.signedCookie(req.cookies["_pf_.sid"], 'keyboard cat');
    //console.log('unsignedCookie:: ', unsignedCookie);
    if(!unsignedCookie || unsignedCookie === req.cookies["_pf_.sid"]) {
      res.send(401);
      return;
    }

   MongoClient.connect(url, function(err, db) {
     if(err){
       console.error(err);
       res.sendStatus(500);
       return;
     }
     if(db){
       //console.log("Connected successfully to session store.");
       db.collection('sessions').findOne({'_id' : unsignedCookie}, function(err, sessionObject){
         if(err){
           console.error(err);
           res.sendStatus(500);
           return;
         }
         sessionObject = sessionObject ?  sessionObject = JSON.parse(sessionObject.session): null;
         if(!sessionObject || !sessionObject.authenticated){
           console.error("Session invalid/expired");
           console.log("Session invalid/expired");
           res.sendStatus(401);
           return;
         }
         if(sessionObject && sessionObject.authenticated){
           //console.log('session valid');
           next();
         }
         db.close();
       });
     }
     else{
       console.log('FATAL  :  ','Could not connect to session store')
       res.sendStatus(500);
     }
   });
  }
  else next();
};
