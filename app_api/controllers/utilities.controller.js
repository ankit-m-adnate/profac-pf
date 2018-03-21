


var mongoose = require('mongoose');
var crypto = require('crypto');

var moment = require('moment');

var multer  = require('multer');
var fs = require('fs');
var express = require('express');
var http = require('http');
var path = require('path');
var router = express.Router();

//this should always be the first method
module.exports.getConfig = function(){
  
   var data=fs.readFileSync('config.json', 'utf8');
   return JSON.parse(data);
  
}

module.exports.sendNotification= function(organization,app,users,module,from,actionable,sentence,navid) {
	
	if(users!=null)
	{
		
		
	
	
	var options = {
  "method": "POST",
  "hostname": module.exports.getConfig().hostDomain,
  "port": module.exports.getConfig().hostPort,
  "path": "/notifs/push",
  "headers": {
    "content-type": "application/json",
    "cache-control": "no-cache"
  }
};

var req = http.request(options, function (res) {
  var chunks = [];

  res.on("data", function (chunk) {
    chunks.push(chunk);
  });

  res.on("end", function () {
    var body = Buffer.concat(chunks);
    console.log(body.toString());
  });
});
if(navid==null){
req.write(JSON.stringify({
      "organization" : organization,
  "app" : app,
  "user": users,
  "item" : {
    "sentence" : sentence,
    "module" : module,
    "from" : from
  },
  "actionable" : actionable,
  "action" : false
  }));
  }

	
else {
  req.write(JSON.stringify({
      "organization" : organization,
  "app" : app,
  "user": users,
  "item" : {
    "sentence" : sentence,
    "module" : module,
    "from" : from,
    "navid":navid
  },
  "actionable" : actionable,
  "action" : false
  }));
}	
req.end();	
	}
	

 
};



//get configuration.json file
module.exports.getConfigAPI = function(req, res){
  
   var data=Utilities.getConfigMethod();
   console.log(data);
  res.status(200).send(data);
   //, function (err,data) {
   //   if (err) {
   //     console.log(err.message); Utilities.getConfig();
   //     res.sendStatus(500) 
   //   }
   //   res.status(200).send(data);
  
   // });
  //  res.status(200).send(data);
  }
  



