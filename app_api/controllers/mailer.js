var passport = require('passport');
var mongoose = require('mongoose');
//var User = mongoose.model('User');
var User = require('../models/users');
var fs = require('fs');
var sendJSONresponse = function(res, status, content) {
  res.status(status);
  res.json(content);
};



var nodemailer = require('nodemailer');
var smtpTransport = require('nodemailer-smtp-transport');
var smtpPool = require('nodemailer-smtp-pool');
module.exports.sendMail = function(mailOptions){
  // create reusable transporter object using the default SMTP transport
  var transporter = nodemailer.createTransport('smtps://contact%40adnatesolutions.com:Adnate@123@smtp.gmail.com');

  /*var transporter = nodemailer.createTransport(smtpTransport({
    service: 'gmail',
    auth: {
      user: 'contact@adnatesolutions.com',
      pass: 'Adnate@123'
    }
  }));*/
  
  
  /*// setup e-mail data with unicode symbols
  var mailOptions = {
      from: '"Fred Foo 👥" <foo@blurdybloop.com>', // sender address
      to: 'bar@blurdybloop.com, baz@blurdybloop.com', // list of receivers
      subject: 'Hello ✔', // Subject line
      text: 'Hello world 🐴', // plaintext body
      html: '<b>Hello world 🐴</b>' // html body
  };*/
  var transporter = nodemailer.createTransport(smtpPool({
    host: 'smtp.gmail.com',
    pool:true,
    port: 465,
    secure: true,
    auth: {
        user: 'contact@adnatesolutions.com',
        pass: 'Adnate@123'
    },
    // use up to 5 parallel connections, default is 5
    maxConnections: 5,
    // do not send more than 10 messages per connection, default is 100
    maxMessages: 1,
    // no not send more than 5 messages in a second, default is no limit
    rateLimit: 1
}));
function callback(mailOptions){
  return function (error, info){
    if(error){
  
   
    console.log('mailOptions---------');
    console.log(mailOptions.to);

    setTimeout(transporter.sendMail(mailOptions, callback(mailOptions)), 1000);
       // return console.log(error);
  
    }
  else
{    console.log('Message sent: ' + info.response+','+mailOptions.to);

fs.appendFile("mailerr", mailOptions.to, function(err) {
  if(err) {
    
      return console.log(err);
  }

 
}); 

}
  }
}
  // send mail with defined transport object
  transporter.sendMail(mailOptions, callback(mailOptions));
};

module.exports.generateToken = function(){
  //create random 16 character token
  var chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
      var token = '';
      for (var i = 16; i > 0; --i) {
        token += chars[Math.round(Math.random() * (chars.length - 1))];
      }
   
  // create expiration date
  var expires = new Date();
  expires.setHours(expires.getHours() + 6);
   
  return {'item' : token, 'expires' : expires};
};