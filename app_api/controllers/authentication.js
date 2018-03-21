const LOGIN_OTP_MAX_RETRIES = 3

var http = require('http')
var passport = require('passport');
var mongoose = require('mongoose');
//var User = mongoose.model('User');
var User = require('../models/users');
var Txns = require('../models/txns');
var jwt = require('jsonwebtoken');
var _ = require('underscore');
var app = require('./../../app');
var Organization = require('../models/organizations');
var Employer = require('../models/employers');
var Plans = require('../models/plans');
var Counter = require('../models/counter.model')
var PaymentTransactions = require('../models/paymenttransactions')
var sendJSONresponse = function(res, status, content) {
  res.status(status);
  res.json(content);
};

var ctrlMail = require('../controllers/mailer');



//#region api controllers
module.exports.txnObjectForOnBoardedUser=function(organization, role){
  
  
  
  try{
    return new Promise(function(resolve, reject){
      var txnObject = new Array();
      var organizationString = organization.trim().toLowerCase().replace(/ /g,"");
      var returnVal = {
        "role" : "generic",
        "txnObject" : []
      };
      Txns.findOne({"name" : "HRMS"},function(err,txn){
        if(err){
          //res.status(500).send(err);
          console.err(err);
          return false;
        }
        if(txn){
          txnObject.push({
            "txn" : txn._id,
            "c_x" : 0,
            "c_y" : 0,
            "s_x" : 3,
            "s_y" : 1,
            "noOfHits" : 0,
            "favor" : false,
            "role" : role
          });
          returnVal.txnObject = [];
          returnVal.txnObject = txnObject;
          resolve(returnVal);
        }
        else{
          console.log("HRMS not present in txns collection");
          resolve(returnVal);
        }
      });
    });
    
  }
  catch(err){
    console.log(err);
    return false;
  }
}


module.exports.register = function(req, res) {
  
  if(req.body.confPassword != req.body.password){
    res.status(400).json({"message" : "Password do not match."});
    return false;
  }
  //Minimum 8 characters at least 1 Uppercase Alphabet, 1 Lowercase Alphabet, 1 Number and 1 Special Character:
  
  var passwordRegex = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[$@$!%*?&])[A-Za-z\d$@$!%*?&]{8,}"
  if(req.body.password.match(passwordRegex) === null){
    if(req.body.password.length <8){
      res.status(400).json({"message" : "Password should be minimum 8 characters."});
      return false;
    }
    if(req.body.password.match("[A-Z]") === null){
      res.status(400).json({"message" : "Password should contain at least one uppercase character."});
      return false;
    }
    if(req.body.password.match("[a-z]") === null){
      res.status(400).json({"message" : "Password should contain at least one lowercase character."});
      return false;
    }
    if(req.body.password.match("[0-9]") === null){
      res.status(400).json({"message" : "Password should contain at least one numeric character."});
      return false;
    }
    if(req.body.password.match(/[-!$%^&*#@()_+|~=`{}\[\]:\";'<>?,.\/\\]/) === null){
      res.status(400).json({"message" : "Password should contain at least one special character."});
      return false;
    }
  }
  try{
    User.findOne({"organization.id" : req.body.organization.trim().toLowerCase().replace(/ /g,""), pFacRole : 'ADM'})
    .populate('organization.id')
    .exec(function(err, u){
      if(err){
        console.error(err);
        return;
      }
      if(u){
        res.status(403).json({"message" : "Organization " + req.body.organization + " already exists. They have been notified of your willingness to join!"});
        var mailOptions = {
          from: '"Process Factory 👥" <contact@adnatesolutions.com>', // sender address
          to: u.email, // list of receivers
          subject: req.body.email + ' wants to join ' + u.organization.id.name, // Subject line
          text: req.body.email + ' wants to join your organizaiton. Please invite if the person is relevant to ' + u.organization.id.name // plaintext body
        };
        ctrlMail.sendMail(mailOptions);
      }
      else{
        debugger;
        module.exports.txnObjectForNewUser(req.body.organization).then(function(data){
          var txnObject = data;
          console.log("txnObject for new User created :: " + JSON.stringify(txnObject));
          var userToken = ctrlMail.generateToken();
          
          var user = new User();
          user.pFacRole = 'ADM';
          user.first_name = req.body.first_name;
          user.personal_info.mobile = req.body.mobile;
          user.last_name = req.body.last_name;
          user.name = (req.body.first_name).trim() + " " + (req.body.last_name).trim();
          user.email = (req.body.email).trim().toLowerCase();
          user.organization.id = req.body.organization.trim().toLowerCase().replace(/ /g,"").replace(/&/g, "and").replace(/\?/g, "").replace(/=/g, "");
          //user.organization.name = req.body.organization;
          user.pFactoryRole = txnObject.role;
          user.txns = txnObject.txnObject;
          user.token = userToken;
          user.setPassword(req.body.password);
          user._imft = true;
          user.active = true;
          user.save(function(err) {
            if(err){
              if(err.code === 11000){
                res.status(400).json({"message" : "This email is already in use."});
                console.error(err);
                return;
              }
              res.send(400);
              console.error(err);
              return;
            }
            var organization = new Organization({
              _id : user.organization.id,
              name : req.body.organization,
              leaves_setting : {
                "backdated_leave" : true,
                "self_approval" : false,
                "sandwich_rule" : false,
                "Approval_level" : 1,
                "Hr_engagement" : "0",
                //"yearly_cycle" : 3,
                "creditleave_expiration" : 1,
                "compoff_factor_holiday" : 1,
                "compoff_factor_weekend" : 1,
                "self_approval_jobgrade":null,
                "self_approval_designation":null
              },
              expenses_config : {
                "Accountant_Engagement" : "0"
              },
              
              createdOn : new Date()
            });
            console.log("creating org", user.organization.id);
            Plans.findOne({"identifier" : 'HRMS - FREE'}, function(err, plan){
              if(err){
                console.error(err);
                return;
              }
              if(plan){
                console.log("found plan")
                organization.plans.push(plan._id);
              }
              Counter.findOneAndUpdate({"_id" : "CUSTID"}, {$inc : {"seq" : 1}}, {new : true}, function(e, counter){
                if(e){
                  console.error(e)
                  res.sendStatus(500)
                  return
                }
                organization.customer_id = counter.seq;
                organization.save(function(err){
                  if(err){
                    console.error(err);
                    res.sendStatus(500);
                    user.remove();
                    return;
                  }
                  
                  var employer = new Employer({
                    _id : user.organization.id,
                    name : req.body.organization,
                    organization:user.organization.id
                  });
                  employer.save(function(err){
                    if(err){
                      console.error('Adding Employer'+err);
                      res.sendStatus(500);
                      
                    }
                    
                    var token;
                    token = user.generateJwt();
                    res.status(200);
                    res.json({
                      "token" : token,
                      "custId" : organization.customer_id
                    });
                    
                    
                    console.log("HOST:::" + req.headers.host);
                    var _rd
                    if(req.body._rd){
                      _rd = '?_rd='+req.body._rd
                    }
                    else{
                      _rd = ''
                    }
                    
                    var mailOptions = {
                      from: 'Process Factory <contact@adnatesolutions.com>', // sender address
                      to: user.email, // list of receivers
                      subject: 'Welcome to Process Factory', // Subject line
                      text: 'Verify Mail', // plaintext body
                      html: '<a href="http://'+req.headers.host+'/pFactory/verifyMail/'+userToken.item + _rd + '">Please click here to verify your email address</a><p>Your link will expire in 6 hours.</p>' // html body
                    };
                    var mailOptions = {
                      from: '"Process Factory 👥" <contact@adnatesolutions.com>', // sender address
                      to: user.email, // list of receivers
                      subject: '[Verify] Welcome to ' + req.body.organization, // Subject line
                      text: 'Please verify your email.', // plaintext body
                      html:'<div style="background-color: white;width:80%;height:80%;padding:20px">'+'<div layout-gt-sm="row" style="width:100%;height:auto;margin-bottom:5%;text-align:center;display:block">'+'<img src="http://i1266.photobucket.com/albums/jj540/Adnate/gear-icon_zpsn9yshyg1.png?t=1489985234" />'
                      +'<h1 class="column" style="margin: 0px;font-weight: 600;color:black;margin-top:-5px">Process Factory</h1>'+'</div>'+'<div>'+'<h2  style="margin-left:2%;color:#47ADCB">Hi '+user.first_name+',</h2><h3 style="margin-left:2%;color:black">Thank you for registering with us. We need you to verify your email. Please click on the button below.</h3>'+'<p style="margin-left:2%;color:black">Your Customer ID is <b>'+ organization.customer_id +'</b>. Please use this ID in all subsequent communications with us.</p><p style="color:black;margin-left:2%">Or you may copy/paste this link into your browser:'+'<a href="http://' + req.headers.host + '/pFactory/verifyMail/' + userToken.item + '?_rd=' + _rd +'">http://'+req.headers.host+'/pFactory/verifyMail/'+userToken.item + _rd + '</a>'+'</p>'+'<p style="margin-left:2%;color:black;margin-top:10px">Have a question or need help? Please contact us at feedback@adnatesolutions.com and we’ll respond.</p>'+'</div>'+'<div style="text-align:center;margin-top:5%">'+'<a href="http://' + req.headers.host + '/pFactory/verifyMail/' + userToken.item + _rd + '\n\n">'+'<button style="width:auto;background:#47ADCB;color:white;width: 165px;height: 54px;font-size: large;border: none;">Verify Email</button></a>'+' </div>'+'</div>',
                      
                    };
                    ctrlMail.sendMail(mailOptions);
                  });
                });
              })
            });
            
          });
        }
        ,function(err){
          console.log(err);
          return err;
        });
      }
    });
  }
  catch(err){
    console.log(err);
    return false;
  }
  
  
};


module.exports.logout = function(req,res){
  
  
  var io = req.app.get('socketio');
  //res.send(200);
  console.log("cookies::",req.cookies);
  console.log("session::",req.session);
  console.log("isAUth::",req.isAuthenticated());
  if(req.isAuthenticated()){
    req.session.authenticated = false;
    req.session.destroy();
    req.logout();
    if(!req.isAuthenticated()){
      res.clearCookie('_pf_.sid', { path: '/' });
      res.send(200);
      //io.emit('redirect_lgO');
    };
  }
  else{
    res.send(401);
  }
  
  //req.session.authenticated = false;
  //   if (!req.isAuthenticated()) {
  //   return res.status(200).json({
  //     status: false
  //   });
  // }
  // res.status(200).json({
  //   status: true
  // });
  
}

module.exports.login = function(req, res) {
  
  if (req.body.email) {
    req.body.email = req.body.email.trim().toLowerCase()
  }
  /** can login with both mobile/email
  *  
  */
  console.log(req.session)
  console.log(req.body)  
  console.log(req.body.phone, req.body.email, req.session.loginOTP)
  
  if(!req.body.phone && req.body.email){
    console.log('user logging in via email')
    passport.authenticate('local', function(err, user, info){
      var token;
      
      // If Passport throws/catches an error
      if (err) {
        console.log('passport error');
        res.status(404).json('passport err: ' + err);
        return;
      }
      
      if(req.body.app){
        var breakFlag = false
        // If a user is found
        if(user && user.active){
          
          _.each(user.txns, function(t){
            if((t.txn.name).toLowerCase() == (req.body.app).toLowerCase())
            {   
              breakFlag = true;       
              req.login(user, function(error) {
                
                if (error) return next(error);
                token = user.generateJwt();
                req.session.authenticated = true;
                result = {
                  "token" : token,
                  "appid" : t.txn._id
                }
                return res.status(200).json({
                  "result" : result
                });
              });
            }
          });
          
          if(!breakFlag){
            return res.status(400).json({"message" : "Unauthorized for this module"});
          }
          
        } else {
          // If user is not found
          console.error(info);
          res.status(400).json(info);
        }
      }
      else{
        // If a user is found
        if(user && user.active){
          req.login(user, function(error) {
            if (error) return next(error);
            token = user.generateJwt();
            req.session.authenticated = true;
            //res.status(200);
            return res.status(200).json({
              "token" : token
            });
          });
        } else {
          // If user is not found
          res.status(400).json(info);
        }
      }
    })(req, res);
  }
  else if(req.session.loginOTP){
    console.log('user loginOTP session detected')
    if(new Date(req.session.loginOTP.expires).getTime() < Date.now()){
      console.log('user loginOTP session expired ... destoying session')
      req.session.loginOTP = undefined;
      res.status(400).send({
        "message" : "OTP expired"
      })
    }
    else if(req.body._r == true && parseInt(req.session.loginOTP.retries) < LOGIN_OTP_MAX_RETRIES){
      //
      // ─── RESEND USER OTP AND UPADTE RETIRES IN SESSION ───────────────
      //
      console.log('resending user OTP')
      var options = {
        host: '198.24.149.4',
        port: 80,
        path: '/API/pushsms.aspx?loginID=' 
        + encodeURIComponent('gauravgta') 
        + '&password=' + encodeURIComponent('Gaurav@123') 
        + '&mobile='+parseInt(req.session.loginOTP.number)+'&text=' 
        + encodeURIComponent('Your One Time Password is ') +parseInt(req.session.loginOTP.otp) + encodeURIComponent('. Retries remaining : ') + parseInt((LOGIN_OTP_MAX_RETRIES - parseInt(req.session.loginOTP.retries)) - 1)  
        + '&senderid=PROFAC&route_id=2&Unicode=0'
      };
      
      console.log(options)
      http.get(options, function(resp){
        var str = '';
        
        resp.on('data', function (chunk) {
          str += chunk;
        });
        
        resp.on('end', function () {
          console.log("response recieved::",str, str.length);
          
          req.session.loginOTP.retries = parseInt(req.session.loginOTP.retries) + 1
          //req.session.loginOTP.expires = req.session.cookie._expires
          res.status(202).send({ 
            "message" : "OTP has been successfully sent. Valid for 5 minutes.",
            "expiresAt" : req.session.loginOTP.expires,
            "retry_remaining" : LOGIN_OTP_MAX_RETRIES - parseInt(req.session.loginOTP.retries)
          })
        });
      }).on("error", function(e){
        console.log("Got error: " + e.message);
      });
      
      
    }
    else if(req.body._r == true && parseInt(req.session.loginOTP.retries) >= LOGIN_OTP_MAX_RETRIES){
      res.status(202).send({
        "message" : "All retries used."
      })
      //req.session.destroy();
    }
    else if(req.body._r == false){
      //
      // ─── MATCH OTP WITH SESSION LOGINOTP AND CHECK EXPIRY ────────────
      //     SEND JWT TOKEN  & STATUS 200 IF ABOVE IS VALID
      //
      
      console.log('checking input OTP against session OTP')
      
      if(parseInt(req.body.otp) == req.session.loginOTP.otp){
        
        
        
        User.findOne({"personal_info.mobile" : parseFloat(req.session.loginOTP.number)})
        .populate('txns.txn')
        .exec(function(err, user){
          if(err){
            console.error(err)
            res.status(400).send({
              "message" : "Please try again with a new OTP."
            })
          }
          if(user){
            if(user.active){
              var breakFlag = false
              req.body.app = req.body.app || ''
              _.each(user.txns, function(t){
                console.log(req.body.app)
                if((t.txn.name).toLowerCase() == (req.body.app).toLowerCase())
                {   
                  breakFlag = true;       
                  req.login(user, function(error) {
                    
                    if (error) return next(error);
                    token = user.generateJwt();
                    req.session.authenticated = true;
                    req.session.loginOTP = undefined;
                    result = {
                      "token" : token,
                      "appid" : t.txn._id
                    }
                    return res.status(200).json({
                      "result" : result
                    });
                  });
                }
              });
              
              if(!breakFlag){
                return res.status(400).json({"message" : "Unauthorized for this module"});
              }
            }
            else{
              res.status(400).send({
                "message" : "This user is not active anymore"
              })
            }
            
          }
          else{
            res.status(400).send({
              "message" : "Wrong OTP"
            })
          }
        })
      }else{
        res.status(400).send({
          "message" : "Wrong OTP"
        })
      }
      
    }
    else if((req.body._r == null || req.body._r === undefined ) && (req.body.otp == null || req.body.otp === undefined )){
      
      console.log('transmitting existsing session data to front end')
      req.session.cookie._expires = req.session.loginOTP.expires
      res.status(202).send({
        "message" : "OTP session active. Valid for 5 minutes.",
        "expiresAt" : req.session.loginOTP.expires,
        "retry_remaining" : LOGIN_OTP_MAX_RETRIES - parseInt(req.session.loginOTP.retries),
        "number" : req.session.loginOTP.number
      })
    }
  }
  else if(req.body.phone && !req.body.email){
    console.log('user logging in via phone')
    User.find({"personal_info.mobile" : parseFloat(req.body.phone)}, function(err, user){
      if(err){
        console.error(err)
        res.status(400).send({
          message : "Please try again later"
        })
        return;
      }
      if(user.length == 0){
        res.status(400).send({
          message : "Please enter a valid mobile number"
        })
      }
      else if(user.length == 1){
        /** if unique phone number is found, initiate otp 
        *  user phone should eventually be unique across all application, 
        *  but since the check is not implemented in all applications yet
        *  we'll only allow users with unique phone numbers to login via OTP
        */
        
        
        //
        // SEND OTP TO USER MOBILE AND SAVE SESSION WITH GENERATED OTP, RETRIES; SET EXPIRY OF SESSION to 5mins
        //
        user = user[0]
        var otp = Math.floor(100000 + Math.random() * 900000);
        var retry, updateObject = {};
        var d = new Date(); d.setMinutes(d.getMinutes() + 5);
        
        
        req.session.loginOTP = {
          "otp" : otp,
          "retries" : 0,
          "expires" : d,
          "number" : req.body.phone
        }
        req.session.cookie.maxAge = 300000
        
        
        //http://198.24.149.4/API/pushsms.aspx?loginID=gauravgta&password=Gaurav@123&mobile=7507500582&text=HI HOW ARE YOU&senderid=DEMOOO&route_id=17&Unicode=0
        
        var urlEncodedParams = encodeURIComponent('loginID=gauravgta&password=Gaurav@123&mobile='+req.body._m+'&text=Your One Time Password is '+otp+'&senderid=PFPOPL&route_id=2&Unicode=0');
        
        var options = {
          host: '198.24.149.4',
          port: 80,
          path: '/API/pushsms.aspx?loginID=' 
          + encodeURIComponent('gauravgta') 
          + '&password=' + encodeURIComponent('Gaurav@123') 
          + '&mobile='+parseInt(req.session.loginOTP.number)+'&text=' 
          + encodeURIComponent('Your One Time Password is ') +parseInt(req.session.loginOTP.otp)
          + '&senderid=PROFAC&route_id=2&Unicode=0'
        };
        
        console.log(options)
        http.get(options, function(resp){
          var str = '';
          
          //another chunk of data has been recieved, so append it to `str`
          resp.on('data', function (chunk) {
            str += chunk;
          });
          
          //the whole response has been recieved, so we just print it out here
          resp.on('end', function () {
            console.log("response recieved::",str, str.length);
            res.status(202).send({ 
              "message" : "OTP has been successfully sent. Valid for 5 minutes.",
              "expiresAt" : d,
              "retry_remaining" : LOGIN_OTP_MAX_RETRIES - parseInt(req.session.loginOTP.retries)
            })
          });
        }).on("error", function(e){
          console.log("Got error: " + e.message);
        });
        
        
        
        
        
        
      }
      else if(user.length > 1){
        res.status(400).send({
          message : "Please use email to login"
        })
      }
    })
  }
  else{
    console.log('found session ... went to else')
    res.status(400).send({
      "message" : "OTP expired"
    });
  }
  
};

module.exports.mlogin = function(req, res) {
  try{
    console.log(req.body);
    // if(!req.body.email || !req.body.password) {
    //   sendJSONresponse(res, 400, {
    //     "message": "All fields required"
    //   });
    //   return;
    // }
    
    passport.authenticate('local', function(err, user, info){
      var token;
      console.log("mlogin -> passport");
      // If Passport throws/catches an error
      if (err) {
        console.error(err);
        res.status(404).json('passport err: ' + err);
        return;
      }
      
      // If a user is found
      if(user && user.active){
        
        console.log("mlogin-> passport -> userfound");
        var matchFlag = false;
        var isModReg = false;
        var expireAt;
        console.log("user found", user.organization.id._id, mongoose.Types.ObjectId(req.body.appid))
        PaymentTransactions.aggregate(
          { $match : {'status' : 'success', 'organization' : user.organization.id._id}},
          { $lookup : {
            from: 'plans',
            localField: 'plan',
            foreignField: '_id',
            as: 'current_plan'
          }
        },
        { $unwind: '$current_plan' },
        {
          $lookup: {
            from: 'txns',
            localField: 'current_plan.txn',
            foreignField: '_id',
            as: 'current_txn'
          }
          },
          
          
          {$unwind : '$current_txn' },
          {$match : { 'current_txn.name' : req.body.app, 'end_at' : {$exists : true}}},
          {$sort : {'end_at' : -1}},  
          {$limit : 1}
        ).exec(function(err, lastSub){
          console.log("LAST SUB:: " + lastSub)
          if(err){
            console.error(err)
            res.sendStatus(500)
            return;
          }
          
          _.each(user.txns, function(txn){
            console.log("matching against user.txns for :: ", txn.txn)
            //console.log(txn.txn);
            //console.log(req.body.app);
            if(txn.txn._id.toString() == lastSub[0].current_txn._id.toString()){
              console.log("MATCHED FOR user.txns for :: ", txn.txn)
              //console.log(user.organization.id.plans)
              _.each(user.organization.id.plans, function(plan){
                if(plan.txn.toString() == lastSub[0].current_txn._id.toString()){
                  console.log("plan assigned to user")
                  if(lastSub.length > 0){        
                    //lastSub = lastSub[0]
                    var timeSinceLastSub = new Date() - new Date(lastSub[0].end_at)
                    
                    var timeToNextSub = ((lastSub[0].current_plan.months * 30 * 24 * 60 * 60 * 1000) - timeSinceLastSub) / (24 * 60 * 60 * 1000)
                    expireAt = new Date(new Date(lastSub[0].end_at).getTime() + (lastSub[0].current_plan.months * 30 * 24 * 60 * 60 * 1000))
                    var trialPlan = lastSub[0].current_plan.cost == 0 ? true : false
                    if(timeToNextSub > 0){
                      console.log("plan has not expired")
                      isModReg = true;
                    }
					
					
                  }
                }
              })
              
              req.login(user, function(error) {
                if (error) {
					console.error(error)
					res.send(500)
				};
                token = user.generateMJwt(txn.role, txn.txn, txn._imft, isModReg, expireAt);
                req.session.authenticated = true;
                res.set("Content-type", "application/json");
                return res.status(200).send({
                  "token" : token,
                  "role" : txn.role
                });
              });
              
              matchFlag = true;
            }
          }) 
          if(!matchFlag){
            res.status(401).send("You don't belong here.");
          } 
        });
        
        
      } else {
        // If user is not found
        console.error(info);
        res.status(400).json(info);
      }
    })(req, res);
    
  }
  catch(e){
    console.error(e);
  }
};

module.exports.verifyJwtToken = function(token){
  try{
    return new Promise(function(resolve, reject){
      
      
      //    jwt.verify(token, "MY_SECRET" , { algorithms: ['HS256'], ignoreExpiration : true }, function(err, decoded){
      
      //console.log("verification token :: " + token);
      var decoded = jwt.decode(token);
      if(decoded){
        //    console.log(JSON.stringify(decoded));
        //console.log(decoded.exp);
        //console.log(Date.now() / 1000);
        //if(decoded.exp > (Date.now() / 1000)){
        //console.log("token not expired");
        User.findOne({email : decoded.email}, function(err, user){
          if(err){
            console.log(err);
            reject(err);
          }
          if(user){
            var newToken = user.generateJwt();
            //console.log('verifyJWTToken :: ' + newToken);
            resolve({"email" :  decoded.email, "token" : newToken});
          }
        });
      }
      else reject("Invalid Token");
      
    });
  }
  catch(e){
    console.log(e);
    reject(e);
  }
  
}

module.exports.txnObjectForNewUser=function(organization, user){
  
  
  
  try{
    return new Promise(function(resolve, reject){
      var role ="";
      var txnObject = new Array();
      var organizationString = organization.trim().toLowerCase().replace(/ /g,"");
      console.log("new user to register");
      role = "ADM";
      Txns.find({"custom" : false},function(err,txns){
        if(err){
          //res.status(500).send(err);
          console.err(err);
          return false;
        }
        if(txns.length > 0){
          console.log("creating txn Object for ADM");
          _.each(txns, function(t){
            txnObject.push({
              "txn" : t._id,
              "c_x" : 0,
              "c_y" : 0,
              "s_x" : 3,
              "s_y" : 1,
              "noOfHits" : 0,
              "favor" : false,
              "role" : "ADM",
              "active" : true,
              "_imft" : true
            });
          });
          var returnVal = {
            "role" : "",
            "txnObject" : []
          };
          returnVal.role = role;
          returnVal.txnObject = [];
          returnVal.txnObject = txnObject;
          resolve(returnVal);
        }
        else{
          console.log("No txns found to map");
          var returnVal = {
            "role" : "",
            "txnObject" : []
          };
          returnVal.role = role;
          returnVal.txnObject = [];
          returnVal.txnObject = txnObject;
          resolve(returnVal);
        }
      });
    });
    
  }
  catch(err){
    console.log(err);
    return false;
  }
}
//#endregion api controleers