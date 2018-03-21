var Users = require('../models/users');
var mongoose = require( 'mongoose' );
var db = require('../models/db');
var ctrlMail = require('../controllers/mailer');
var ctrlAuth = require('../controllers/authentication');
var Utilities = require('../controllers/utilities.controller');
var designation_history = require('../controllers/designation_history.controller');
var _ = require('underscore');
var moment = require('moment');
var Branch = require('../models/branches');
var http = require('http');
var Organization = require('../models/organizations')
var fs = require('fs')
var Txns = require('../models/txns')
var WorkingDays = require('../models/workingdays.model')
var WorkingHours = require('../models/workinghours.model')
var Departments=require('../models/departments')
var Designation=require('../models/jobtitles.model');
var async = require('async');
var PaymentTransactions = require('../models/paymenttransactions');

/*
'active':true,'mailVerified':'Y'
*/
module.exports.getInactiveEmployees = function(req, res) {
  Users.find(
    {'organization.id': req.query.org, 'employee_code' : {$exists : true},$or: [{'active':false},{'mailVerified':'N'}],
    txns: { $elemMatch: { txn: req.query.appid} }
    
  }
)
.exec(function(err, user)
{
  if(err){
    return err;
  }
  if(user){
    console.log('userfound');
    res.status(200).send(user);
  }
  if(!user){
    console.log('user not found');
  }
});

}

module.exports.a = function(req, res) {
  //  Users.find(
  //  	{'organization.id': req.query.org, 'employee_code' : {$exists : true}},
  //  	{ first_name: 1, last_name: 1,job_title : 1,email : 1,role : 1, branch: 1 ,name : 1, organization : 1, joining_date : 1, reporting_to : 1, employee_type : 1, employee_status : 1,mailVerified:1,skill_set:1,active:1, fpsid : 1 })
  //  .exec(function(err, user)
  //  {
  //    if(err){
  //     return err;
  //   }
  //   if(user){
  //     console.log('userfound');
  //     res.status(200).send(user);
  //   }
  //   if(!user){
  //     console.log('user not found');
  //   }
  // }); previously 
  
  //updated0n 23/6/2017
  
  
  
  Users.find(
    {'organization.id': req.query.org, 'employee_code' : {$exists : true}},
    { txns: { $elemMatch: { txn: mongoose.Types.ObjectId(req.query.appid) } },first_name: 1,"txns.role":1, 
    last_name: 1,job_title : 1,email : 1,role : 1, branch: 1 ,name : 1,
    organization : 1, joining_date : 1, reporting_to : 1, employee_type : 1,
    employee_status : 1,mailVerified:1,skill_set:1,active:1, fpsid : 1,profile_pic:1}
    
    
  )
  .populate({path:'job_title'})
  .exec(function(err, user)
  {
    if(err){
      return err;
    }
    if(user){
      console.log('userfound');
      res.status(200).send(user);
    }
    if(!user){
      console.log('user not found');
    }
  });
  
  
  
  
  
}

module.exports.getHRs= function(req, res) {
	
	Users.find(
    {'organization.id': req.query.org, 'employee_code' : {$exists : true},'active':true,'mailVerified':'Y',
    txns: { $elemMatch: { txn: req.query.appid , role:'HR'} }}
    
    
  )
  .exec(function(err, user)
  {
    if(err){
      return err;
    }
    if(user){
      console.log('userfound');
      res.status(200).send(user);
    }
    if(!user){
      console.log('user not found');
    }
  });
	
}
module.exports.onBoard = function(req, res){
  debugger;
  var result = {
    "win" :    [],
    "fail":    [],
    "exists" : []
  };
  
  ctrlAuth.txnObjectForOnBoardedUser(req.body[0].organization.name, req.body[0].role).then(function(data){


    
    Users.findOne({email : req.body[0].email})
    .exec(function(err, user){



      if(err){
        console.error(err);
        result.fail.push({
          "index" : 0,
          "name" : req.body.email,
          "employee_code" : req.body[0].ecode,
          "message" : "Please try again after some time"
        });
        res.status(200).send(result);
        return;
      }
      Organization.findOne({_id : req.body[0].organization.id}, function(err, org){
        if(err){
          result.fail.push({
            "index" : 0,
            "name" : req.body.email,
            "employee_code" : req.body[0].ecode,
            "message" : "This service is currently unavailable"
          });
          res.status(200).send(result);
          return;
        }
        if(org){

          var newLeaveObj = {}
          for(var i=0; i< org.leaves_config.names.length; i++){
            if(org.leaves_config.status[i] == true){
              newLeaveObj[org.leaves_config.names[i]] = org.leaves_config.initial_quota[i]; 
            }
          }
          
          //READ DIR PATH FROM CONFIG FILE
          var dir = '/HRMS_Uploads/employee_documents/'+req.body[0].email+'/';
          
          if (!fs.existsSync(dir)){
            fs.mkdirSync(dir);
          }
          if(!user){
            var userToken_mail = ctrlMail.generateToken();
            var newEmployeeJson = {
              "name" : req.body[0].fname.charAt(0).toUpperCase() + req.body[0].fname.slice(1).trim() + " " + req.body[0].lname.charAt(0).toUpperCase() + req.body[0].lname.slice(1).trim(),
              "first_name" : req.body[0].fname,
              "last_name" : req.body[0].lname,
              "job_title"  : req.body[0].jtitle,  //should be an enum
              "email" : req.body[0].email,
              "joining_date" : new Date(req.body[0].joining_date),
              "employee_type" : req.body[0].employee_type,  //enum maybe
              "employee_status"  : 'Employed',
              "token" : userToken_mail,
              "employee_code" : req.body[0].ecode,
              "branch" : req.body[0].bcode,
              "department" : req.body[0].dcode,
              "workingDays" : req.body[0].wd,
              "workingHours" : req.body[0].wh,
              "hr_manager": (req.body[0].hr_manager && req.body[0].hr_manager != '') ? req.body[0].hr_manager : null,
              "job_grade":req.body[0].job_grade,
              "personal_info":{"dob":new Date(req.body[0].dob),"gender":req.body[0].gender}
            }
            
            if(!(req.body[0].reporting_to == null || req.body[0].reporting_to == undefined || req.body[0].reporting_to == '')){
              newEmployeeJson.reporting_to = req.body[0].reporting_to;
            }
            
            newEmployeeJson.organization = {
              "id" : req.body[0].organization.id
            };
            newEmployeeJson.pFactoryRole = data.role;
            newEmployeeJson.leaves = newLeaveObj;
            newEmployeeJson.txns = data.txnObject;
            var newUser = new Users(JSON.parse(JSON.stringify(newEmployeeJson)));
            newUser.save(function(err,user1){
              if(err){
                if(err.code === 11000)        // mongo error code for duplicate key; unique email
                {
                  
                  console.log('email exists ::');
                  result.exists.push({
                    "index" : 0,
                    "name" : newUser.name,
                    "employee_code" : newUser.employee_code
                  });
                  res.status(200).send(result);
                  return;
                }
                else{
                  console.error(err);
                  result.fail.push({
                    "index" : 0,
                    "name" : newUser.name,
                    "employee_code" : newUser.employee_code,
                    "message" : "This service is currently unavailable."
                  });
                  res.status(200).send(result);
                  return;
                }
                
              }
              else{
                if((req.body[0].role).toUpperCase() == 'HR'){
                  Branch.update({_id : req.body[0].bcode}, {$set : {'hr' : newUser._id}}, function(err, numAffected){
                    if(err){
                      console.error(err);
                      console.log('Assigning HR to branch failed');
                    }
                    if(numAffected.ok == 1){
                      console.log('HR ', newUser.name, 'assigned to branch.');
                    }
                  });
                }
                console.log("Employee onBoard initialized!");
                result.win.push({
                  "index" : 0,
                  "name" : newUser.name,
                  "employee_code" : newUser.employee_code
                });
                var old=null;
                var newrecord=user1.job_title;
                designation_history.addHistory(user1._id,user1.organization.id,old,newrecord,'add');
                res.status(200).send(result);
                
                var mailOptions = {
                  from: '"Process Factory 👥" <contact@adnatesolutions.com>', // sender address
                  to: newUser.email, // list of receivers
                  subject: '[INVITATION] Welcome to ' + org.name, // Subject line
                  text: 'Activate your account.', // plaintext body
                  html:'<div style="background-color: white;width:80%;height:80%;padding:20px">'+'<div layout-gt-sm="row" style="width:100%;height:auto;margin-bottom:5%;text-align:center;display:block">'+'<img src="http://i1266.photobucket.com/albums/jj540/Adnate/gear-icon_zpsn9yshyg1.png?t=1489985234" />'
                  +'<h1 class="column" style="margin: 0px;font-weight: 600;color:black;margin-top:-5px">Process Factory</h1>'+'</div>'+'<div>'+'<h1  style="margin-left:2%;color:#47ADCB">Hi '+req.body[0].fname.trim() + " " + req.body[0].lname.trim()+',</h1>'+'<h1 style="margin-left:2%;color:#47ADCB">Join '+org.name+' on Process factory</h1>'+'<h3 style="margin-left:2%;color:black">You have been invited to join team '+org.name+'.</h3>'+'<p style="color:black;margin-left:2%">You may copy/paste this link into your browser:'+'<a href="http://' + req.headers.host + '/pFactory/activate/' + userToken_mail.item + '\n\n">http://'+req.headers.host+'/pFactory/activate/'+userToken_mail.item+'</a>'+'</p>'+'<h3 style="margin-left:2%;color:black;margin-top:10px">Have a question or need help? Please contact us at info@processfactory.in and we’ll respond.</h3>'+'</div>'+'<div style="text-align:center;margin-top:5%">'+'<a href="http://' + req.headers.host + '/pFactory/activate/' + userToken_mail.item + '\n\n">'+'<button style="width:auto;background:#47ADCB;color:white;width: 165px;height: 54px;font-size: large;border: none;">Join Team</button></a>'+' </div>'+'</div>',
                  
                };
                ctrlMail.sendMail(mailOptions);
                
                /*Users.find(
                  {'organization.id': req.body[0].organization.id,
                  txns: { $elemMatch: { txn: mongoose.Types.ObjectId(req.body[0].app)} }}
                  
                  
                )
                .exec(function(err, user)
                {
                  if(err){
                    return err;
                  }
                  if(user.length>0){
                    var userdata=[];
                    for(var i=0;i<user.length;i++)
                    {
                      userdata.push(user[i]._id.toString());
                    }
                    var newarr = userdata.filter(function(a){return a !== req.body[0].fromemp.toString()})
                    Utilities.sendNotification(req.body[0].organization.id,req.body[0].app,newarr,'hrms.employeedetails',null,true,'<b>'+req.body[0].fname.charAt(0).toUpperCase() + req.body[0].fname.slice(1).trim() + " " + req.body[0].lname.charAt(0).toUpperCase() + req.body[0].lname.slice(1).trim()+'</b>'+' joined <b>'+req.body[0].organization.name+'</b>',req.body[0].email)
                    
                  }
                  
                });*/
              }
            });
            
          }
          else{
            if(user.organization.id == req.body[0].organization.id && user.employee_code){
              //NOPE, USER ALREADY EXISTS IN THE SAME ORGANIZATION,
              console.log('NOPE, USER ALREADY EXISTS IN THE SAME ORGANIZATION')
              result.exists.push({
                "index" : 0,
                "name" : user.name,
                "employee_code" : user.employee_code
              });
              res.status(200).send(result)
            }
            else if(user.organization.id == req.body[0].organization.id && !user.employee_code){ //this means the organization admin a.k.a pFacRole = ADM is being onBoarded
              // IF USER ALREADY EXISTS IN ORGANIZATION
              //var userToken_mail = ctrlMail.generateToken();
              
              user.name = req.body[0].fname.charAt(0).toUpperCase() + req.body[0].fname.slice(1).trim() + " " + req.body[0].lname.charAt(0).toUpperCase() + req.body[0].lname.slice(1).trim();
              user.first_name=  req.body[0].fname;
              user.last_name = req.body[0].lname;
              user.job_title = req.body[0].jtitle;  //should be an enum
              user.joining_date = new Date(req.body[0].joining_date);
              user.employee_type = req.body[0].employee_type;  //enum maybe
              user.employee_status = 'Employed';
              user.employee_code = req.body[0].ecode;
              user.branch = req.body[0].bcode;
              user.department = req.body[0].dcode;
              user.workingDays = req.body[0].wd,
              user.workingHours = req.body[0].wh,
              user.hr_manager = (req.body[0].hr_manager && req.body[0].hr_manager != '') ? req.body[0].hr_manager : null,
              user.job_grade = req.body[0].job_grade,
              user.personal_info={"dob":req.body[0].dob,"gender":req.body[0].gender}
              //user.personal_info.gender = req.body[0].gender
              if(!(req.body[0].reporting_to == null || req.body[0].reporting_to == undefined || req.body[0].reporting_to == '')){
                user.reporting_to = req.body[0].reporting_to;
              }
              
              var overwrittenFlag = false;
              _.each( user.txns, function(t){
                if(t.txn.equals(data.txnObject[0].txn)){
                  overwrittenFlag = true;
                  t.role = t.role == 'ADM' ? t.role : data.txnObject[0].role;
                  //t.role = data.txnObject[0].role;
                }
              })
              
              if(!overwrittenFlag){
                user.txns.push(data.txnObject[0]);
              }
              
              user.leaves = newLeaveObj;
              user.markModified('leaves');
              user.save(function(err,user1){
                if(err){
                  console.error(err);
                  result.fail.push({
                    "index" : 0,
                    "name" : user.name,
                    "employee_code" : req.body[0].ecode,
                    "message" : "This service is currently unavailable."
                  });
                  res.status(200).send(result);
                  return;
                }
                else{
                  if((req.body[0].role).toUpperCase() == 'HR'){
                    Branch.update({_id : req.body[0].bcode}, {$set : {'hr' : user._id}}, function(err, numAffected){
                      if(err){
                        console.error(err);
                        console.log('Assigning HR to branch failed');
                      }
                      if(numAffected.ok == 1){
                        console.log('HR ', user.name, 'assigned to branch.');
                      }
                    });
                  }
                  console.log("Employee onBoard initialized!");
                  result.win.push({
                    "index" : 0,
                    "name" : user.name,
                    "employee_code" : user.employee_code
                  });
                  res.status(200).send(result);
                  
                  var mailOptions = {
                    from: '"Process Factory 👥" <contact@adnatesolutions.com>', // sender address
                    to: user.email, // list of receivers
                    subject: '[INVITATION] HRMS @ ' + org.name, // Subject line
                    text: 'You are now a part of HRMS @ ' + org.name + '.', // plaintext body
                    html:'<div style="background-color: white;width:80%;height:80%;padding:20px">'+'<div layout-gt-sm="row" style="width:100%;height:auto;margin-bottom:5%;text-align:center;display:block">'+'<img src="http://i1266.photobucket.com/albums/jj540/Adnate/gear-icon_zpsn9yshyg1.png?t=1489985234" />'+'<h1 class="column" style="margin: 0px;font-weight: 600;color:black;margin-top:-5px">Process Factory</h1>'+'</div>'+'<div>'+'<h2  style="color:#47ADCB">Hi '+req.body[0].fname.trim() + " " + req.body[0].lname.trim()+',</h2>'+'<h3 style="margin-left:2%;color:#47ADCB">Welcome to HRMS on Process factory.</h3><p style="color:black;margin-left:2%">You are now a part of HRMS at '+ org.name +'. The application has been added to your account. Please proceed to login to <a href="https://www.procfactory.com">Process Factory</a> to find the app.</p>'+'<h5 style="margin-left:2%;color:black;margin-top:10px">Have a question or need help? Please contact us at feedback@adnatesolutions.com and we’ll respond.</h5>'+'</div></div>',
                    
                  };
                  ctrlMail.sendMail(mailOptions);
                  var old=null;
                  var newrecord=user1.job_title;
                  designation_history.addHistory(user1._id,user1.organization.id,old,newrecord,'add')
                  /*Users.find(
                    {'organization.id': req.body[0].organization.id,
                    txns: { $elemMatch: { txn: mongoose.Types.ObjectId(req.body[0].app)} }}
                    
                    
                  )
                  .exec(function(err, user)
                  {
                    if(err){
                      return err;
                    }
                    if(user.length>0){
                      var userdata=[];
                      for(var i=0;i<user.length;i++)
                      {
                        userdata.push(user[i]._id.toString());
                      }
                      var newarr = userdata.filter(function(a){return a !== req.body[0].fromemp.toString()})
                      Utilities.sendNotification(req.body[0].organization.id,req.body[0].app,newarr,'hrms.employeedetails',null,true,'<b>'+req.body[0].fname.charAt(0).toUpperCase() + req.body[0].fname.slice(1).trim() + " " + req.body[0].lname.charAt(0).toUpperCase() + req.body[0].lname.slice(1).trim()+'</b>'+' joined <b>'+req.body[0].organization.name+'</b>',req.body[0].email)
                      
                    }
                    
                  });*/
                }
              });
              
            }
            else{
              //NOPE, USER EXISTS IN OTHER ORGANIZATION, 
              console.log('NOPE, USER EXISTS IN OTHER ORGANIZATION,')
              result.exists.push({
                "index" : 0,
                "name" : user.email,
                "employee_code" : ''
              });
              res.status(200).send(result)
            }
          }



        }
        else{
          result.fail.push({
            "index" : 0,
            "name" : req.body.email,
            "employee_code" : req.body[0].ecode,
            "message" : "Bad Request"
          });
          res.status(200).send(result);
          return;
          823}
        })  
        
        

      });



    },function(err){
      console.error(err);
      return err;
    });
    
    
  }
  
  
  module.exports.getEmpCounter = function(req, res) {
    var query;
    console.log(query);
    if(req.body.prefix) 
    {
      
      var prefix = req.body.prefix;
    }
    else {
     
      var prefix =  'EMP'+req.body.organization;
    }
    Organization.findOneAndUpdate(
      {        
        "_id": req.body.organization
      }, 
      {
        $inc: { "employee_counter.seq": 1 },
        $set:{"employee_counter.prefix":prefix}
      },
      {
        upsert:true,
        new:true
      },
      function(err,count){
        console.log(count);
        var ucode = count.employee_counter.prefix + "-" + count.employee_counter.seq;
        res.status(200).send(ucode);
      });
  }
  
  module.exports.bulkOnBoard = function(req, res) {
    debugger;
    var multiuser=[];
    var result = {
      "win" :    [],
      "fail":    [],
      "exists" : []
    };
    function syncMultipleOnBoards(index){
      if(index < req.body.length){
        ctrlAuth.txnObjectForOnBoardedUser(req.body[index].organization.name, req.body[index].role).then(function(data){
          //org added
          Organization.findOne({_id : req.body[index].organization.id}, function(err, org){
            if(err){
              result.fail.push({
                "index" : 0,
                "name" : req.body[index].email,
                "employee_code" : req.body[index].ecode,
                "message" : "This service is currently unavailable"
              });
              res.status(200).send(result);
              return;
            }
            if(org){
              var newLeaveObj = {}
              for(var i=0; i< org.leaves_config.names.length; i++){
                if(org.leaves_config.status[i] == true){
                  newLeaveObj[org.leaves_config.names[i]] = org.leaves_config.initial_quota[i]; 
                }
              }
              //org added
              console.log('txnObjectForOnBoardedUser ', data);
              console.log('onBoard request: ', req.body[index]);
              
              var userToken_mail = ctrlMail.generateToken();
              
              async.waterfall([
                function(wCallback) {
                  Users.findOne({'employee_code' : req.body[index].reporting_to,'organization.id':req.body[index].organization.id},function(err, user){
                    if(err){
                      result.fail.push({
                        "index" : 0,
                        "name" : req.body[index].reporting_to,
                        "employee_code" : req.body[index].ecode,
                        "message" : "reporting_to didn't fetch"
                      });
                      syncMultipleOnBoards(index+1);		   
                    }
                    if(user){ wCallback(null, user._id)}
                    else{
                      // inserting
                      wCallback(null,null)
                    }
                  })
                  
                },
                function(user_id, wCallback){
                  
                  Departments.findOne({'unique_code' : req.body[index].depcode,'organization':req.body[index].organization.id}, function(err, dept){
                    if(err){
                      result.fail.push({
                        "index" : 0,
                        "name" : req.body[index].depcode,
                        "employee_code" : req.body[index].ecode,
                        "message" : "Department didn't fetch"
                      });
                      syncMultipleOnBoards(index+1);
                    }
                    if(dept){ wCallback(null, user_id, dept._id)}
                    else{
                      //after inserting call wCallback with dept._id
                      var depJson = {
                        'unique_code' : req.body[index].depcode,
                        'organization' : req.body[index].organization.id,
                        'name' : req.body[index].depcode
                      }
                      Departments.create(depJson, function (err, depart) {
                        if (err) {
                          if(err.code === 11000)        // mongo error code for duplicate key; unique email
                          {
                            console.error(err);
                            console.log('Department exists ::');
                            result.exists.push({
                              "index" : index,
                              "employee_code" : req.body[index].ecode,
                              "message" : "department exists"
                            });
                            
                            syncMultipleOnBoards(index+1);
                            
                          }
                          else{
                            console.error(err);
                            result.fail.push({
                              "index" : index,
                              "employee_code" : req.body[index].ecode,
                              "message" : "Please try again after some time"
                            });
                            
                            syncMultipleOnBoards(index+1);
                          }
                        }
                        wCallback(null, user_id, depart._id)        // saved!
                      })
                      
                    }
                  })
                },
                function(user_id, dept_id, wCallback){
                  //query job title
                  WorkingHours.findOne({'unique_code' : req.body[index].whcode,'organization':req.body[index].organization.id},function(err,wh){
                    if(err){
                      result.fail.push({
                        "index" : 0,
                        "name" : req.body[index].whcode,
                        "employee_code" : req.body[index].ecode,
                        "message" : "Working Hours didn't fetch"
                      });
                      syncMultipleOnBoards(index+1);		   
                    }
                    if(wh){wCallback(null, user_id, dept_id, wh._id)}
                    else{
                      var whJson = {
                        'unique_code' : req.body[index].whcode,
                        'organization' : req.body[index].organization.id,
                        'desc' : req.body[index].whcode,
                        'workingHours' : {
                          "open" : "10:00",
                          "pause" : "10:05",
                          "cont" : "10:10",
                          "close" : "18:38"
                        }
                      }
                      WorkingHours.create(whJson, function (err, whs) {
                        if (err) {
                          if(err.code === 11000)        // mongo error code for duplicate key; unique email
                          {
                            console.error(err);
                            console.log('WorkingHours exists ::');
                            result.exists.push({
                              "index" : index,
                              "employee_code" : req.body[index].ecode,
                              "message" : "WorkingHours exists"
                            });
                            
                            syncMultipleOnBoards(index+1);
                            
                          }
                          else{
                            console.error(err);
                            result.fail.push({
                              "index" : index,
                              "employee_code" : req.body[index].ecode,
                              "message" : "Please try again after some time"
                            });
                            
                            syncMultipleOnBoards(index+1);
                          }
                        };
                        wCallback(null, user_id, dept_id,whs._id)        // saved!
                      })
                    }
                  })
                  //wCallback with (null, reporting_to_id, dept._id, job_title._id)
                  
                },
                function(user_id, dept_id,wh_id, wCallback){
                  WorkingDays.findOne({'unique_code' : req.body[index].wdcode,'organization':req.body[index].organization.id},function(err,wd){
                    if(err){
                      result.fail.push({
                        "index" : 0,
                        "name" : req.body[index].wdcode,
                        "employee_code" : req.body[index].ecode,
                        "message" : "Working Days didn't fetch"
                      });
                      syncMultipleOnBoards(index+1);		   
                    }
                    if(wd){wCallback(null, user_id, dept_id, wh_id,wd._id)}
                    else{
                      var wdJson = {
                        'unique_code' : req.body[index].wdcode,
                        'organization' : req.body[index].organization.id,
                        'tag' : "4 days working(except saturday,monday)",
                        "workingDays" : "[[1,2,3,4,5],[],[1,2,3,4,5],[1,2,3,4,5],[1,2,3,4,5],[1,2,3,4,5],[]]"
                      }
                      WorkingDays.create(wdJson, function (err, wds) {
                        if (err) {
                          if(err.code === 11000)        // mongo error code for duplicate key; unique email
                          {
                            console.error(err);
                            console.log('WorkingDays exists ::');
                            result.exists.push({
                              "index" : index,
                              "employee_code" : req.body[index].ecode,
                              "message" : "WorkingDays exists"
                            });
                            
                            syncMultipleOnBoards(index+1);
                            
                          }
                          else{
                            console.error(err);
                            result.fail.push({
                              "index" : index,
                              "employee_code" : req.body[index].ecode,
                              "message" : "Please try again after some time"
                            });
                            
                            syncMultipleOnBoards(index+1);
                          }  
                        };
                        wCallback(null, user_id, dept_id,wh_id,wds._id)        // saved!
                      })
                    }
                  })
                  
                },
                function(user_id, dept_id,wh_id,wd_id, wCallback){
                  Designation.findOne({'unique_code' : req.body[index].jobcode,'organization':req.body[index].organization.id},function(err,jd){
                    if(err){
                      result.fail.push({
                        "index" : 0,
                        "name" : req.body[index].jobcode,
                        "employee_code" : req.body[index].ecode,
                        "message" : "job garde didn't fetch"
                      });
                      syncMultipleOnBoards(index+1);		   
                    }
                    if(jd){wCallback(null, user_id, dept_id, wh_id,wd_id,jd._id)}
                    else{
                      var desJson = {
                        'unique_code' :req.body[index].jobcode,
                        'organization' : req.body[index].organization.id,
                        'name' : req.body[index].jobcode
                      }
                      Designation.create(desJson, function (err, jds) {
                        if (err) {
                          if(err.code === 11000)        // mongo error code for duplicate key; unique email
                          {
                            console.error(err);
                            console.log('Designation exists ::');
                            result.exists.push({
                              "index" : index,
                              "employee_code" : req.body[index].ecode,
                              "message" : "Designation exists"
                            });
                            
                            syncMultipleOnBoards(index+1);
                            
                          }
                          else{
                            console.error(err);
                            result.fail.push({
                              "index" : index,
                              "employee_code" : req.body[index].ecode,
                              "message" : "Please try again after some time"
                            });
                            
                            syncMultipleOnBoards(index+1);
                          }  
                        };
                        wCallback(null, user_id, dept_id,wh_id,wd_id,jds._id)        // saved!
                      })
                    }
                  })
                  
                },
                function(user_id, dept_id,wh_id,wd_id,jd_id,wCallback){
                  if(req.body[index].hr_manager==null)
                  {
                    wCallback(null, user_id, dept_id, wh_id,wd_id,jd_id,null);
                  }
                  else
                  {
                  Users.findOne({'employee_code' :req.body[index].hr_manager,'organization.id':req.body[index].organization.id},function(err,hr_mg){
                    if(err){
                      result.fail.push({
                        "index" : 0,
                        "name" : req.body[index].hr_manager,
                        "employee_code" : req.body[index].ecode,
                        "message" : "HR didn't fetch"
                      });
                    }
                    if(hr_mg){wCallback(null, user_id, dept_id, wh_id,wd_id,jd_id,hr_mg._id)}
                    else{
                      wCallback(null, user_id, dept_id, wh_id,wd_id,jd_id,null)
                    }
                  })
                }
                },
                
                /**for branch */
                function(user_id, dept_id,wh_id,wd_id,jd_id,hr_id, wCallback){
                  Branch.findOne({'ucode' : req.body[index].bcode, 'organization' : req.body[index].organization.id},function(err,br){
                    if(err){
                      result.fail.push({
                        "index" : 0,
                        "name" : req.body[index].bcode,
                        "employee_code" : req.body[index].ecode,
                        "message" : "branch didn't fetch"
                      });
                      syncMultipleOnBoards(index+1);		   
                    }
                    if(br){wCallback(null, user_id, dept_id, wh_id,wd_id,jd_id,hr_id,br._id)}
                    else{
                      var brJson = {
                        'ucode' :req.body[index].bcode,
                        'organization' : req.body[index].organization.id,
                        'name' : req.body[index].bcode
                      }
                      Branch.create(brJson, function (err, newBr) {
                        if (err) {
                          if(err.code === 11000)        // mongo error code for duplicate key; unique email
                          {
                            console.error(err);
                            console.log('Branch exists ::');
                            result.exists.push({
                              "index" : index,
                              "employee_code" : req.body[index].ecode,
                              "message" : "Branch exists"
                            });
                            
                            syncMultipleOnBoards(index+1);
                            
                          }
                          else{
                            console.error(err);
                            result.fail.push({
                              "index" : index,
                              "employee_code" : req.body[index].ecode,
                              "message" : "Please try again after some time"
                            });
                            
                            syncMultipleOnBoards(index+1);
                          }  
                        };
                        
                        wCallback(null, user_id, dept_id,wh_id,wd_id,jd_id,hr_id,newBr._id)        // saved!
                      })
                    }
                  })
                  
                }


              ], function(err, user_id, dept_id, wh_id,wd_id,jd_id,hr_id, br_id){
                //save newUser
                var newEmployeeJson = {
                  "name" : req.body[index].fname.charAt(0).toUpperCase() + req.body[index].fname.slice(1).trim() + " " + req.body[index].lname.charAt(0).toUpperCase() + req.body[index].lname.slice(1).trim(),
                  "first_name" : req.body[index].fname,
                  "last_name" : req.body[index].lname,
                  "email" : req.body[index].email,
                  "joining_date" : new Date(req.body[index].joining_date),
                  "employee_type" : req.body[index].employee_type,  //enum maybe
                  "employee_status"  : 'Employed',
                  "token" : userToken_mail,
                  "employee_code" : req.body[index].ecode,
                  "personal_info":{"dob":new Date(req.body[index].dob),"gender":req.body[index].gender}
                  
                }
                newEmployeeJson.organization = {
                  "id" : req.body[index].organization.id,
                  "name" : req.body[index].organization.name
                };
                newEmployeeJson.pFactoryRole = data.role;
                newEmployeeJson.txns = data.txnObject;
                newEmployeeJson.leaves = newLeaveObj;
                newEmployeeJson.department = dept_id
                newEmployeeJson.workingHours = wh_id;
                newEmployeeJson.workingDays = wd_id;
                newEmployeeJson.reporting_to = user_id;
                newEmployeeJson.job_title = jd_id;
                newEmployeeJson.hr_manager = hr_id;
                newEmployeeJson.branch = br_id;
                console.log('check user schema :'+JSON.stringify(newEmployeeJson) );
                var newUser = new Users(JSON.parse(JSON.stringify(newEmployeeJson)));
                console.log("check object of employee :"+ newUser);
                //
                newUser.save(function(err,user1){
                  if(err){
                    if(err.code === 11000)        // mongo error code for duplicate key; unique email
                    {
                      console.error(err);
                      console.log('email exists ::');
                      result.exists.push({
                        "index" : index,
                        "name" : newUser.name,
                        "employee_code" : newUser.employee_code
                      });
                      
                      syncMultipleOnBoards(index+1);
                      
                    }
                    else{
                      console.error(err);
                      result.fail.push({
                        "index" : index,
                        "name" : newUser.name,
                        "employee_code" : newUser.employee_code,
                        "message" : "Please try again after some time"
                      });
                      
                      syncMultipleOnBoards(index+1);
                    }
                    
                  }
                  else{
                    if((req.body[index].role).toUpperCase() == 'HR'){
                      Branch.update({'ucode' : req.body[index].bcode,'organization':req.body[index].organization.id}, {$set : {'hr' : newUser._id}}, function(err, numAffected){
                        if(err){
                          console.error(err);
                          console.log('Assigning HR to branch failed');
                        }
                        if(numAffected.ok == 1){
                          console.log('HR ', newUser.name, 'assigned to branch.');
                        }
                      });
                    }
                    
                    console.log("Employee onBoard initialized!");
                    
                    result.win.push({
                      "index" : index,
                      "name" : newUser.name,
                      "employee_code" : newUser.employee_code
                    });
                    console.log('check email :'+newUser.email);
                    
                    var old=null;
                    var newrecord=user1.job_title;
                    designation_history.addHistory(user1._id,user1.organization.id,old,newrecord,'add');

                    var mailOptions = {
                      from: '"Process Factory ??" <contact@adnatesolutions.com>', // sender address
                      to: newUser.email, // list of receivers
                      subject: '[INVITATION] Welcome to ' + req.body[index].organization.name, // Subject line
                      text: 'Activate your account.', // plaintext body
                      html:'<div style="background-color: white;width:80%;height:80%;padding:20px">'+'<div layout-gt-sm="row" style="width:100%;height:auto;margin-bottom:5%;text-align:center;display:block">'+'<img src="http://i1266.photobucket.com/albums/jj540/Adnate/gear-icon_zpsn9yshyg1.png?t=1489985234" />'
                      +'<h1 class="column" style="margin: 0px;font-weight: 600;color:black;margin-top:-5px">Process Factory</h1>'+'</div>'+'<div>'+'<h1  style="margin-left:2%;color:#47ADCB">Hi '+req.body[index].fname.trim() + " " + req.body[index].lname.trim()+',</h1>'+'<h1 style="margin-left:2%;color:#47ADCB">Join '+req.body[index].organization.name+' on Process factory</h1>'+'<h3 style="margin-left:2%;color:black">You have been invited to join team '+req.body[index].organization.name+'.</h3>'+'<p style="color:black;margin-left:2%">You may copy/paste this link into your browser:'+'<a href="http://' + req.headers.host + '/pFactory/activate/' + userToken_mail.item + '\n\n">http://'+req.headers.host+'/pFactory/activate/'+userToken_mail.item+'</a>'+'</p>'+'<h3 style="margin-left:2%;color:black;margin-top:10px">Have a question or need help? Please contact us at feedback@adnatesolutions.com and we�ll respond.</h3>'+'</div>'+'<div style="text-align:center;margin-top:5%">'+'<a href="http://' + req.headers.host + '/pFactory/activate/' + userToken_mail.item + '\n\n">'+'<button style="width:auto;background:#47ADCB;color:white;width: 165px;height: 54px;font-size: large;border: none;">Join Team</button></a>'+' </div>'+'</div>',
                      
                    };
                    ctrlMail.sendMail(mailOptions);
                    syncMultipleOnBoards(index+1);
                  }
                });
                //
              });
              
            }
            else{
              result.fail.push({
                "index" : 0,
                "name" : req.body.email,
                "employee_code" : req.body[0].ecode,
                "message" : "Bad Request"
              });
              res.status(200).send(result);
              return;
              823}
            })
          },function(err){
            console.error(err);
            return err;
          });
        }
        else{
          res.status(200).send(result);
        }
      }
      syncMultipleOnBoards(0);
    }
    
    
    
    module.exports.getPFProfile = function(req, res){
      Users.findOne({'email': req.params.email}, {"personal_info.mobile" : 1, "first_name" : 1, "last_name" : 1, "email" : 1, "otp.retries" : 1, "otp.expires" : 1, "mobileVerified" : 1})
      .exec(function(err, user)
      {
        if(err){
          console.error(err);
          res.sendStatus(500);
          return;
        }
        if(user){
          
          res.status(200).send(user);
        }
        else{
          res.sendStatus(400);
        }
      });
    }
    
    
    module.exports.getProfile = function(req, res){
      Users.find({'email': req.params.email}, {hash : 0, salt : 0, token : 0, mailVerified: 0, __v : 0, "otp.code" : 0})
      .populate({path : 'reporting_to', select : 'name email employee_code'})
      .populate({path : 'job_title'})
      .populate({path : 'salary_structure'})
      .populate({path : 'hr_manager', select : 'name email employee_code'})
      .populate({path : 'branch', populate : {path : 'hr', select : 'name email'}})
      .populate({path : 'department'})
      .populate({path : 'workingHours'})
      .populate({path : 'workingDays'})
      .exec(function(err, user)
      {
        if(err){
          console.error(err);
          res.sendStatus(500);
          return;
        }
        if(user){
          console.log('userfound');
          res.status(200).send(user);
        }
        else{
          res.sendStatus(400);
          console.log('user not found');
        }
      });
    }
    module.exports.getDocs = function(req, res){
      Users.find({'email': req.params.email})
      
      .exec(function(err, user)
      {
        if(err){
          console.error(err);
          res.sendStatus(500);
          return;
        }
        if(user){
          console.log('userfound');
          res.status(200).send(user[0].documents);
        }
        else{
          res.sendStatus(400);
          console.log('user not found');
        }
      });
    }
    
    module.exports.getEmployeesCount = function(req, res) {
      Users.find(
        {'organization.id': req.query.org,"employee_code": { $exists: true, $ne: null } })
        .exec(function(err, user)
        {
          if(err){
            return err;
          }
          if(user){
            var arr=user;
            var arrlen=arr.length.toString();
            console.log(arrlen);
            res.status(200).send(arrlen);
          }
          if(!user){
            console.log('user not found');
          }
        });
        
      }
      
      
      module.exports.updateProject = function(req, res){
        Users.findOneAndUpdate({_id : req.body._u, "projects._id" : req.body._p._id}, {"projects.$" : req.body._p}, function(err, user){
          if(err){
            console.error(err);
            res.sendStatus(500);
            return;
          }
          res.sendStatus(200);
        })
      }
      module.exports.deleteEmploymentHistory = function(req,res) {
        Users.findOne({"_id" : mongoose.Types.ObjectId(req.body._id)}, function(err, user){
          if(err){
            res.status(500).send(err);
            return false;
          }
          if(user){
            user.employment_history=req.body.employment_history;
            user.save(function(err){
              if(err) {
                res.status(500).send(err);
                return err;
              }
              res.send(user);
            });
    }
    else
    res.status(400).send("id invalid.");
  });
    }
      module.exports.addEmploymentHistory = function(req,res) {

        Users.findOne({"_id" : mongoose.Types.ObjectId(req.body._id)}, function(err, user){
          if(err){
            res.status(500).send(err);
            return false;
          }
          if(user){
            var obj={};
            if(req.body.company_name != null) obj.company_name = req.body.company_name;
            if(req.body.start_date != null) obj.start_date = new Date(req.body.start_date);
            if(req.body.end_date != null) obj.end_date = new Date(req.body.end_date);
            if(req.body.location != null) obj.location = req.body.location;
            if(req.body.designation != null) obj.designation = req.body.designation;
            if(req.body.docPath != null) obj.docPath = req.body.docPath;
            user.employment_history.push(obj);
            user.save(function(err){
              if(err) {
                res.status(500).send(err);
                return err;
              }
              res.send(user);
            });
          }
          else
          res.status(400).send("id invalid.");
        });

      }

      module.exports.updateEmployeeStatus = function(req,res) {
        Users.findOne({"email" : req.body.email}, function(err, user){
          if(err){
            res.status(500).send(err);
            return false;
          }
          if(user){
            if(req.body.status != null) user.active = req.body.status;
            user.save(function(err){
              if(err) {
                res.status(500).send(err);
                return err;
              }
              res.send(user.active);
            });
          }
          else
          res.status(400).send("Email invalid.");
        });
      }
      module.exports.updateEmployeeCode = function(req,res) {
        Users.findOne({"email" : req.body.email}, function(err, user){
          if(err){
            res.status(500).send(err);
            return false;
          }
          if(user){
            if(req.body.employee_code != null) user.employee_code = req.body.employee_code;
            user.save(function(err){
              if(err) {
                res.status(500).send(err);
                return err;
              }
              res.send(user.employee_code);
            });
          }
          else
          res.status(400).send("Email invalid.");
        });
      }
      module.exports.updateEmployeeDocs = function(req,res) {
        Users.findOne({"email" : req.body.email}, function(err, user){
          if(err){
            res.status(500).send(err);
            return false;
          }
          if(user){
            if(req.body.document){
              user.documents.push({"docType" : req.body.document.docType,
              "docPath" : req.body.document.docPath});
            }
            user.save(function(err){
              if(err) {
                res.status(500).send(err);
                return err;
              }
              res.send(user._id);
            });
          }
          else
          res.status(400).send("Email invalid.");
        });
      }
      
      module.exports.updateProfile = function(req,res) {
        console.log('ini updateProfile');
        Users.findOne({"email" : req.body.email})
        .populate('organization.id')
        .populate('job_title')
        .exec(function(err, user){
          if(err){
            res.status(500).send(err);
            return false;
          }
          if(user){
            var token=null;
            console.log('req jtitle---'+req.body.job_title);
            console.log('user jtitle---'+user.job_title);
            
            if(req.body.job_title!=user.job_title._id)
            {
var changedjob=true;
var old=JSON.parse(JSON.stringify(user.job_title._id));

            }
            else
            {
              var changedjob=false;
            }
            console.log('user for updateProfile found');
            if(req.body.first_name != null) user.first_name = req.body.first_name;
            if(req.body.last_name != null) user.last_name = req.body.last_name;
            if(req.body.last_name != null && req.body.first_name != null) user.name = req.body.first_name.charAt(0).toUpperCase() + req.body.first_name.slice(1).trim() + " " + req.body.last_name.charAt(0).toUpperCase() + req.body.last_name.slice(1).trim();
            if(req.body.job_title != null) user.job_title = req.body.job_title;
            if(req.body.joining_date != null) user.joining_date = new Date(req.body.joining_date);
            if(req.body.employee_type != null) user.employee_type = req.body.employee_type;
            if(req.body.employee_status != null) user.employee_status = req.body.employee_status;
            if(req.body.leaving_reason != null) user.leaving_reason = req.body.leaving_reason;
            if(req.body.resignation != null) user.resignation = new Date(req.body.resignation);
            if(req.body.notice_period != null) user.notice_period = Number(req.body.notice_period);
            if(req.body.tentative_date != null) user.tentative_date = new Date(req.body.tentative_date);
            if(req.body.remarks != null) user.remarks = req.body.remarks;
            if(req.body.manager_remarks != null) user.manager_remarks = req.body.manager_remarks;
            if(req.body.final_date != null) user.final_date = new Date(req.body.final_date);
            if(req.body.bcode != null) user.branch = req.body.bcode;
            if(req.body.wh != null) user.workingHours = req.body.wh;
            if(req.body.wd != null) user.workingDays = req.body.wd;
            user.department = req.body.dcode;
            user.job_grade = req.body.job_grade;
            user.hr_manager = req.body.hr_manager;
            user.reporting_to = req.body.reporting_to;
            if(req.body.skill_set != null && req.body.skill_set.length){
              user.skill_set = req.body.skill_set;
            }
            if(req.body.profilePicObj!=null)
            {
              
              token = user.generateMJwt(req.body.r,req.body.a,req.body.i);
              
            }
            if(req.body.profilePicObj!=null) user.profile_pic=req.body.profilePicObj;
            
            if(req.body.bio != null) user.bio = req.body.bio;
            
            if(req.body.projects != null && req.body.projects.length > 0){
              user.projects = req.body.projects;
            }
            
            if(req.body.personal_info){
              if(req.body.personal_info.dob != null) user.personal_info.dob = req.body.personal_info.dob;
              if(req.body.personal_info.marital_status != null) user.personal_info.marital_status = req.body.personal_info.marital_status;
              if(req.body.personal_info.mobile != null) user.personal_info.mobile = req.body.personal_info.mobile;
              if(req.body.personal_info.landline != null) user.personal_info.landline = req.body.personal_info.landline;
              if(req.body.personal_info.gender != null) user.personal_info.gender = req.body.personal_info.gender;
              if(req.body.personal_info.address != null) user.personal_info.address = req.body.personal_info.address;
              if(req.body.personal_info.city != null) user.personal_info.city = req.body.personal_info.city;
              if(req.body.personal_info.state != null) user.personal_info.state = req.body.personal_info.state;
              if(req.body.personal_info.postal_code != null) user.personal_info.postal_code = req.body.personal_info.postal_code;
              if(req.body.personal_info.country != null) user.personal_info.country = req.body.personal_info.country;
             user.personal_info.educational_details = req.body.personal_info.educational_details;
            }
            
            if(req.body.emergency_info){
              if(req.body.emergency_info.first_name != null) user.emergency_info.first_name = req.body.emergency_info.first_name;
              if(req.body.emergency_info.last_name != null) user.emergency_info.last_name = req.body.emergency_info.last_name;
              if(req.body.emergency_info.relationship != null) user.emergency_info.relationship = req.body.emergency_info.relationship;
              if(req.body.emergency_info.contact != null) user.emergency_info.contact = req.body.emergency_info.contact;
            }
            
            if(req.body.bank_info){
              if(req.body.bank_info.bank_name != null) user.bank_info.bank_name = req.body.bank_info.bank_name;
              if(req.body.bank_info.pan_number!= null) user.bank_info.pan_number = req.body.bank_info.pan_number;
              if(req.body.bank_info.account_type != null) user.bank_info.account_type = req.body.bank_info.account_type;
              if(req.body.bank_info.account_number != null) user.bank_info.account_number = req.body.bank_info.account_number;
              if(req.body.bank_info.IFSC!= null) user.bank_info.IFSC = req.body.bank_info.IFSC;
              if(req.body.bank_info.pf_covered!= null) user.bank_info.pf_covered = req.body.bank_info.pf_covered;
              if(req.body.bank_info.pf_uan!= null) user.bank_info.pf_uan = req.body.bank_info.pf_uan;
              if(req.body.bank_info.pf_number!= null) user.bank_info.pf_number = req.body.bank_info.pf_number;
              user.bank_info.pf_enrollment = req.body.bank_info.pf_enrollment;
              if(req.body.bank_info.epf_number!= null) user.bank_info.epf_number = req.body.bank_info.epf_number;
              if(req.body.bank_info.relativename!= null) user.bank_info.relativename = req.body.bank_info.relativename;
              if(req.body.bank_info.service_period!= null) user.bank_info.service_period = req.body.bank_info.service_period;
              if(req.body.bank_info.relationship!= null) user.bank_info.relationship = req.body.bank_info.relationship;
              if(req.body.bank_info.eps_entitled!= null) user.bank_info.eps_entitled = req.body.bank_info.eps_entitled;
              if(req.body.bank_info.esi_covered!= null) user.bank_info.esi_covered = req.body.bank_info.esi_covered;
              if(req.body.bank_info.esi_number!= null) user.bank_info.esi_number = req.body.bank_info.esi_number;
              
            }
            
            user.save(function(err,user1){
              if(err) {
                console.log(err);
                res.status(500).send(err);
                return err;
              }
              var obj={'_id':user._id}
              if(token!=null)
              {
                obj.token=token;
              }
              console.log(changedjob);
              if(changedjob==true)
              {
                var newrecord=user1.job_title;
                designation_history.addHistory(user1._id,user1.organization.id,old,newrecord,'update');
              }
              res.send(obj);
            });
            if(req.body.val=='user')
            {
              console.log(req.body.managermail);
              var resignation_dte=moment(req.body.resignation).format('Do MMM YYYY');
              var mailOptions = {
                from: '"Process Factory" <contact@adnatesolutions.com>', // sender address
                to: req.body.managermail, // list of receivers
                cc: req.body.hremail,
                subject: 'Separation Request', // Subject line
                text: 'Separation Request', // plaintext body
                
                html:'<div>'+'<p style="color:black">Dear '+req.body.managername+',</p><p style="margin-top:20px;color:black">Separation Request is submitted by '+req.body.username+'</p>'+'<div style="margin:0px;padding:0px"><h4 style="margin-top:20px;display:inline;color:black">Resignation Date: </h4><p style="display:inline-block;margin:0px;color:black">'+resignation_dte+'</p></div><div style="margin:0px;padding:0px;margin-top:10px"><h4 style="display:inline;color:black">Notice Period: </h4> <p style="display:inline-block;margin:0px;color:black">'+req.body.notice_period+' days</p></div>'+'<div style="margin:0px;padding:0px;margin-top:10px"><h4 style="display:inline;color:black">Remarks:</h4> <p style="display:inline-block;margin:0px;color:black">'+req.body.remarks+'</p></div><p style="margin-top:20px;color:black">Please login to HRMS and submit the employee\'s tentative resignation date.</p><p style="margin-top:20px;color:black">Regards,<br/>Team '+req.body.org_name+'</p></div>'
                
                
              };
              ctrlMail.sendMail(mailOptions);
            }
            if(req.body.val=='hr')
            {
              user.active=false;
            }
            if(req.body.val=='manager')
            {
              var tentative_dte=moment(req.body.tentative_date).format('Do MMM YYYY');
              var mailOptions = {
                from: '"Process Factory" <contact@adnatesolutions.com>', // sender address
                to: req.body.email, // list of receivers
                cc: req.body.hremail,
                subject: 'Separation Accepted', // Subject line
                text: 'Separation Accepted', // plaintext body
                
                html:'<div>'+'<p style="color:black">Dear '+req.body.username+',</p><p style="margin-top:20px;color:black">Your separation request is approved by '+req.body.managername+' and your tentative date for separation is '+tentative_dte+'</p><div style="margin:0px;padding:0px"><h4 style="margin-top:20px;display:inline;color:black">Manager Remarks:</h4><p style="display:inline-block;margin:0px;color:black">'+req.body.manager_remarks+'</p></div><p style="margin-top:20px;color:black">Regards,<br/>Team '+req.body.org_name+'</p>'+'</div>'
                
                
              };
              ctrlMail.sendMail(mailOptions);
            }
            
            
            
          }
          else
          res.status(400).send("Email invalid.");
        });
      }
      
      
      module.exports.getEmployeeJobtitle = function(req, res){
        Users.findOne({_id : req.query._i}).exec(function(err, user){
          if(err){
            console.error(err);
            res.sendStatus(500);
            return
          }
          if(user){
            
            res.send(user.job_title);
          }
          else
          res.sendStatus(400)
        })
      }

      module.exports.getSupervisorsByUser = function(req, res){
        Users.findOne({_id : req.query._i}).populate('branch').exec(function(err, user){
          if(err){
            console.error(err);
            res.sendStatus(500);
            return
          }
          if(user){
            var resp = {
              "hr" : user.branch.hr,
              "manager" : user.reporting_to
            }
            res.send(resp);
          }
          else
          res.sendStatus(400)
        })
      }
      
      
      module.exports.getSupervisors = function(req, res){
        Users.find(
          {'organization.id': req.query.org, 'employee_code' : { $exists : true}, 'mailVerified' : 'Y', 'active' : true},
          { job_title : 1, name : 1, email: 1, employee_code : 1,branch:1,salary_structure:1 })
          .populate({'path':'branch','select':'name'})
          .populate({path:'job_title'})
          .populate({'path':'salary_structure','select':'Monthlysalary ctc_annual'})
          .exec(function(err, user)
          {
            if(err){
              console.log(err);
              return err;
            }
            if(user){
              res.status(200).send(user);
            }
            if(!user){
              console.log('user not found');
            }
          });
        }

        module.exports.getAllSupervisors = function(req, res){
          Users.find(
            {'organization.id': req.query.org, 'employee_code' : { $exists : true}, 'mailVerified' : 'Y'},
            { job_title : 1, name : 1, email: 1, employee_code : 1,branch:1,salary_structure:1 })
            .populate({'path':'branch','select':'name'})
            .populate({path:'job_title'})
            .populate({'path':'salary_structure','select':'Monthlysalary ctc_annual'})
            .exec(function(err, user)
            {
              if(err){
                console.log(err);
                return err;
              }
              if(user){
                res.status(200).send(user);
              }
              if(!user){
                console.log('user not found');
              }
            });
          }

        module.exports.getRMSEmployees = function(req, res){
          Users.find(
            {'organization.id': req.query.org,'active' : true,'txns.txn' : mongoose.Types.ObjectId(req.query.app)},
            { name : 1, email: 1})

            .exec(function(err, user)
            {
              if(err){
                console.log(err);
                return err;
              }
              if(user){
                res.status(200).send(user);
              }
              if(!user){
                console.log('user not found');
              }
            });
          }
        module.exports.getSalariedEmployees = function(req, res){
          console.log(req.query.inactiveuser);
          if(req.query.inactiveuser=='true')
          {
           
          Users.find(
            {'organization.id': req.query.org, 'employee_code' : { $exists : true},'salary_structure':{ $exists : true}, 'mailVerified' : 'Y', 'active' : true},
            { job_title : 1, name : 1, email: 1, employee_code : 1,branch:1,salary_structure:1,joining_date:1 })
            .populate({'path':'branch','select':'name'})
            .populate({path:'job_title'})
            .populate({'path':'salary_structure','select':'Monthlysalary ctc_annual'})
            .exec(function(err, user)
            {
              if(err){
                console.log(err);
                return err;
              }
              if(user){
                res.status(200).send(user);
              }
              if(!user){
                console.log('user not found');
              }
            });
          }
          else
          {
            Users.aggregate([{
              "$match":{"employee_code":{$ne:null},"organization.id":req.query.org,"salary_structure":{$ne:null},"mailVerified":"Y","active":true},
              
              },{
                   "$lookup": {
                       "from": "payroll_structures",
                       "localField": "salary_structure",
                       "foreignField": "_id",
                       "as": "result"
                   }
               },{ "$unwind": "$result" },{"$project":{"name":"$name","email":"$email","first_name":"$first_name","last_name":"$last_name","temp":"$result.salary_template",
                   "dob":"$dob","joining_date":"$joining_date","employee_code":"$employee_code","branch":"$branch","organization":"$organization","job_title":"$job_title",
                   "salary_structure":{"_id":"$result._id","Monthlysalary":"$result.Monthlysalary","ctc_annual":"$result.ctc_annual"}
                   }},{
                   "$lookup": {
                       "from": "payroll_templates",
                       "localField": "temp",
                       "foreignField": "_id",
                       "as": "resulttemplate"
                   }
               },{ "$unwind": "$resulttemplate" },{"$match":{"resulttemplate.active":true}},{
                   "$lookup": {
                       "from": "branches",
                       "localField": "branch",
                       "foreignField": "_id",
                       "as": "branch"
                   }
               },{ "$unwind": "$branch" },{
                   "$lookup": {
                       "from": "jobtitles",
                       "localField": "job_title",
                       "foreignField": "_id",
                       "as": "job_title"
                   }
               },{ "$unwind": "$job_title" }])
               
               .exec(function(err, user)
               {
                 if(err){
                   console.log(err);
                   return err;
                 }
                 if(user){
                   res.status(200).send(user);
                 }
                 if(!user){
                   console.log('user not found');
                 }
               });
          }
          }
          
          module.exports.new_t = function(req,res){
            ctrlAuth.verifyJwtToken(req.query.token).then(function(resp){
              res.json({"success" : resp.token});
            }, function(err){
              console.error(err);
              res.sendStatus(500);
            });
          }
          

          module.exports.validateUser = function(req,res){
            try{
              if(req.body.token){
                
                ctrlAuth.verifyJwtToken(req.body.token).then(function(resp){
                  Users.findOne({"email" : resp.email}, {"branch" : 1 , "name" : 1, "email" : 1, "job_title" : 1,  "first_name" : 1 , "last_name" : 1, "txns" : 1, "role" : 1, "organization" : 1, "profile_pic":1})
                  .populate({path : 'organization.id', populate : {path : 'plans'}})
                  .populate({path : 'job_title'})
                  .exec(function(err, user){
                    if(err){
                      console.error(err);
                      res.status(500).send(err);
                    }
                    if(user){
                      var matchFlag = false;
                      var isModReg = false;
                      //console.log("user found", user.organization.id._id, mongoose.Types.ObjectId(req.body.appid))
                      PaymentTransactions.aggregate(
                        { $match : {'status' : 'success', 'organization' : user.organization.id._id}},
                        { $lookup : {
                          from: 'plans',
                          localField: 'plan',
                          foreignField: '_id',
                          as: 'current_plan'
                        }},
                        {$match : { 'current_plan.txn' : mongoose.Types.ObjectId(req.body.appid), 'end_at' : {$exists : true}}},
                        {$sort : {'end_at' : -1}},  
                        {$limit : 1},
                        {$unwind : '$current_plan'}
                      ).exec(function(err, lastSub){
                        //console.log("LAST SUB:: " + lastSub)
                        if(err){
                          console.error(err)
                          res.sendStatus(500)
                          return;
                        }
                        
                        _.each(user.txns, function(txn){
                          //console.log("matching against user.txns for :: ", txn.txn)
                          //console.log(txn.txn);
                          //console.log(req.body.appid);
                          if(txn.txn.toString() == (req.body.appid)){
                            //console.log("MATCHED FOR user.txns for :: ", txn.txn)
                            //console.log(user.organization.id.plans)
                            _.each(user.organization.id.plans, function(plan){
                              if(plan.txn.toString() == req.body.appid){
                                //console.log("plan assigned to user")
                                if(lastSub.length > 0){        
                                  lastSub = lastSub[0]
                                  var timeSinceLastSub = new Date() - new Date(lastSub.end_at)
                                  
                                  var timeToNextSub = ((lastSub.current_plan.months * 30 * 24 * 60 * 60 * 1000) - timeSinceLastSub) / (24 * 60 * 60 * 1000)
                                  
                                  var trialPlan = lastSub.current_plan.cost == 0 ? true : false
                                  if(timeToNextSub > 0){
                                    //console.log("plan has not expired")
                                    isModReg = true;
                                  }
                                }
                              }
                            })
                            var response = {};
                            response.role = txn.role;
                            response.email = user.email;
                            //response.token = token;
                            response.token = user.generateMJwt(txn.role, txn.txn, txn._imft, isModReg, null);
                            response.first_name = user.first_name;
                            response.organization = {
                              "id" : user.organization.id._id,
                              "name" : user.organization.id.name
                            };
                            response.last_name = user.last_name;
                            
                            
                            
                            res.send(response);
                            matchFlag = true;
                          }
                        }) 
                        if(!matchFlag){
                          res.status(401).send("You don't belong here.");
                        } 
                      });
                      
                      
                    }
                    else{
                      res.status(400).send();
                    }
                  });
                },function(err){
                  console.error(err);
                  res.status(500).send(err);
                });
                
              }
              else res.sendStatus(400);
            }
            
            catch(e)
            {
              console.error(e);
              return false;
            }
          };
          
          
          
          module.exports.inviteUserToApp = function(req, res){
            try {
              Users.findOne({ "_id": req.session.passport.user }, function (err, hostUser) {
                if (err) {
                  console.error(err)
                  res.sendStatus(500)
                  return
                }
                if (hostUser) {
                  //check if the user exists in organization
                  Users.findOne({"email" : req.body.email, "organization.id" : req.body.orgid})
                  .populate('organization.id')
                  .exec(function(err, user){
                    console.log(req.body);
                    if(err){
                      console.error(err);
                      res.status(500).send();
                      return err;
                    }
                    if(user){
                      console.log(mongoose.Types.ObjectId(req.body.appid));
                      console.log("user:::", JSON.stringify(user.txns));
                      if(_.filter(user.txns, function(t){ return t.txn.toString() === req.body.appid }).length > 0){
                        res.status(400).json({
                          message :"Cannot invite user more than once."
                        });
                        return false;
                      }
                      else{
                        var txnObject = {
                          "txn" : mongoose.Types.ObjectId(req.body.appid),
                          "c_x" : 0,
                          "c_y" : 0,
                          "s_x" : 3,
                          "s_y" : 1,
                          "noOfHits" : 0,
                          "favor" : false,
                          "role" : req.body.role
                        };
                        console.log(JSON.stringify(user));
                        user.txns.push(txnObject);
                        user.save(function(err){
                          if(err){
                            console.error(err);
                            res.status(500).send();
                            return false;
                          }
                          res.status(200).json({
                            message : "User Invited"
                          });
                          
                          Txns.findOne({_id : req.body.appid}, function(err, txn){
                            if(err){
                              console.log(error);
                              return;
                            }
                            if(txn){
                              var mailOptions = {
                                from: '"Process Factory 👥" <contact@adnatesolutions.com>', // sender address
                                to: user.email, // list of receivers
                                subject: ' Welcome to Process'+ txn.displayName+ ' @ ' + user.organization.id.name , // Subject line
                                //text: 'Activate your account.', // plaintext body
                                //html: '<a href="http://' + req.headers.host + '/pFactory/activate/' + userToken_mail.item + '\n\n">Please click here to activate your account.</a><p>Your link will expire in 6 hours.</p>' // html body
                                html:'<div style="background-color: white;width:80%;height:80%;padding:20px">'+'<div layout-gt-sm="row" style="width:100%;height:auto;margin-bottom:5%;text-align:center;display:block">'+'<img src="http://i1266.photobucket.com/albums/jj540/Adnate/gear-icon_zpsn9yshyg1.png?t=1489985234" />'
                                +'<h1 class="column" style="margin: 0px;font-weight: 600;color:black;margin-top:-5px">Process Factory</h1>'+'</div>'+'<div>'+'<h2  style="margin-left:2%;color:#47ADCB">Hi '+user.first_name + " " + user.last_name+',</h2><h4 style="margin-left:2%;color:black">'+ hostUser.first_name +' '+ hostUser.last_name +' ('+ hostUser.email +') has invited you to join Process'+ txn.displayName + ' @ ' + user.organization.id.name+'.</h4>',
                                /*attachments: [{
                                  filename: 'gear-icon.png',
                                  Path: 'https://encrypted-tbn2.gstatic.com/images?q=tbn:ANd9GcToMwU0vkhJ4f0Gsp21xw5BSiYuNAbAReyHr0djUVkKm0B_kBozSg',
                                  
                                  cid: 'unique@nodemailer.com' //same cid value as in the html img src
                                }]*/
                              };
                              ctrlMail.sendMail(mailOptions);
                            }
                          });
                        });
                      }
                    }
                    else{
                      //ctrlAuth.txnObjectForNewUser(req.body.orgname).then(function(data){
                      /*save employee details*/
                      var userToken_mail = ctrlMail.generateToken();
                      var newEmployeeJson = {
                        "name" : req.body.fname.charAt(0).toUpperCase() + req.body.fname.slice(1).trim() + " " + req.body.lname.charAt(0).toUpperCase() + req.body.lname.slice(1).trim(),
                        "first_name" : req.body.fname.charAt(0).toUpperCase() + req.body.fname.slice(1).trim(),
                        "last_name" : req.body.lname.charAt(0).toUpperCase() + req.body.lname.slice(1).trim(),
                        "job_title"  : req.body.jtitle ? req.body.jtitle : null,
                        "email" : req.body.email,
                        "joining_date" : req.body.jdate ? new Date(req.body.jdate) : new Date(),
                        "reporting_to" : req.body.reporting_to ? req.body.reporting_to : null,
                        "employee_type" : req.body.etype,
                        "employee_status"  : 'Employed',
                        "token" : userToken_mail,
                      };
                      newEmployeeJson.organization = {
                        "id" : req.body.orgid
                      };
                      newEmployeeJson.pFactoryRole = 'generic';
                      //newEmployeeJson.txns = data.txnObject;				//adding the user to all the apps
                      newEmployeeJson.txns = [];
                      newEmployeeJson.txns.push({
                        "txn" : mongoose.Types.ObjectId(req.body.appid),
                        "c_x" : 0,
                        "c_y" : 0,
                        "s_x" : 3,
                        "s_y" : 1,
                        "noOfHits" : 0,
                        "favor" : false,
                        "role" : req.body.role
                      });
                      var newUser = new Users(JSON.parse(JSON.stringify(newEmployeeJson)));
                      newUser.save(function(err){
                        if(err){
                          if(err.code === 11000) 				// mongo error code for duplicate key; unique email
                          {
                            //var e = new Error('Email already exists');
                            console.log('email exists ::');
                            res.status(400).send('Email already exists');
                          }
                          return err;
                        }
                        console.log("New User invite initialized!");
                        
                        res.status(200).send(newUser);
                        var mailOptions = {
                          from: '"Process Factory 👥" <contact@adnatesolutions.com>', // sender address
                          to: newUser.email, // list of receivers
                          subject: '[INVITATION] Welcome to ' + req.body.orgname , // Subject line
                          text: 'Activate your account.', // plaintext body
                          //html: '<a href="http://' + req.headers.host + '/pFactory/activate/' + userToken_mail.item + '\n\n">Please click here to activate your account.</a><p>Your link will expire in 6 hours.</p>' // html body
                          html:'<div style="background-color: white;width:80%;height:80%;padding:20px">'+'<div layout-gt-sm="row" style="width:100%;height:auto;margin-bottom:5%;text-align:center;display:block">'+'<img src="http://i1266.photobucket.com/albums/jj540/Adnate/gear-icon_zpsn9yshyg1.png?t=1489985234" />'
                          +'<h1 class="column" style="margin: 0px;font-weight: 600;color:black;margin-top:-5px">Process Factory</h1>'+'</div>'+'<div>'+'<h2  style="margin-left:2%;color:#47ADCB">Hi '+req.body.fname.trim() + " " + req.body.lname.trim()+',</h2>'+'<h2 style="margin-left:2%;color:#47ADCB">Join '+req.body.orgname+' on Process factory</h2>'+'<h4 style="margin-left:2%;color:black">'+ hostUser.first_name +' '+ hostUser.last_name +' ('+ hostUser.email +') has invited you to join team '+req.body.orgname+'.</h4>'+'<p style="color:black;margin-left:2%">You may copy/paste this link into your browser:'+'<a href="http://' + req.headers.host + '/pFactory/activate/' + userToken_mail.item + '\n\n">http://'+req.headers.host+'/pFactory/activate/'+userToken_mail.item+'</a>'+'</p>'+'<h4 style="margin-left:2%;color:black;margin-top:10px">Have a question or need help? Please contact us at feedback@adnatesolutions.com and we’ll respond.</h4>'+'</div>'+'<div style="text-align:center;margin-top:5%">'+'<a href="http://' + req.headers.host + '/pFactory/activate/' + userToken_mail.item + '\n\n">'+'<button style="width:auto;background:#47ADCB;color:white;width: 165px;height: 54px;font-size: large;border: none;">Join Team</button></a>'+' </div>'+'</div>',
                          /*attachments: [{
                            filename: 'gear-icon.png',
                            Path: 'https://encrypted-tbn2.gstatic.com/images?q=tbn:ANd9GcToMwU0vkhJ4f0Gsp21xw5BSiYuNAbAReyHr0djUVkKm0B_kBozSg',
                            
                            cid: 'unique@nodemailer.com' //same cid value as in the html img src
                          }]*/
                        };
                        ctrlMail.sendMail(mailOptions);
                      });
                      //res.status(400).send("User not found.");
                    }
                  });
                  
                  //add app to user object --> txn
                  
                  // send notification mail to user
                  
                  
                }
                else {
                  res.sendStatus(400);
                }
              })
            }
            catch(e){
              console.error(e);
              return;
            }
          };
          
          module.exports.usersByOrg = function(req,res){
            Users.aggregate(
              {$match : {"organization.id": req.query.org, "txns.txn" : mongoose.Types.ObjectId(req.query.app)}},
              {$project : {
                txns: {
                  $filter: {
                    input : "$txns",
                    as : "txn",
                    cond: { $eq : ["$$txn.txn", mongoose.Types.ObjectId(req.query.app)]}
                  }
                },
                name : 1, email : 1,crm_reporting_to:1
              }
            }
          ).exec(function(err, users){
            if(err){
              console.error(err);
              return false;
            }
            res.status(200).send(users);
          });
        }
        
        
        module.exports.editPermissions = function(req, res){
          // if(req.body.s && req.body.r){
          //
          // }
          Users.findOne({"email" : req.body.e, "organization.id" : req.body.o, "txns.txn" : req.body.a},
          function(err, user){
            if(err){
              console.error(err);
              res.send(500);
              return;
            }
            if(user){
              user = _.map(user.txns, function(txn){
                console.log(txn.txn === mongoose.Schema.Types.ObjectId(req.body.a), typeof txn.txn, typeof req.body.a)
                if(txn.txn == req.body.a){
                  if(typeof req.body.s == 'boolean')  txn.active = req.body.s;  //check for boolean value
                  if(req.body.r) txn.role = req.body.r;
                  if(req.body.crepo)user.crm_reporting_to=req.body.crepo;
                  user.save(function(err){
                    if(err){
                      console.error(err);
                      res.sendStatus(500);
                      return;
                    }
                    res.sendStatus(200);
                    return;
                  });
                }
              });
            }
            else {
              res.sendStatus(400);
            }
          });
        }
        
        
        module.exports.submitOTP = function(req, res){
          Users.findOne({_id : req.body._i}, function(err, user){
            if(err){
              console.error(err);
              res.status(500).json({"message" : "This service is currently down at the moment."})
              return;
            }
            if(user){
              if(user.otp.code === parseInt(req.body._c)){
                if((new Date(user.otp.expires).getTime() - new Date().getTime()) > 0){
                  user.mobileVerified = 'Y'
                  user.save(function(err){
                    if(err){
                      console.error(err);
                      res.sendStatus(500)
                      return;
                    }
                    res.send(200)
                  })
                }
                else{
                  res.status(400).json({"message" : "Your code has expired."})
                }
              }
              else{
                res.status(400).json({"message" : "Wrong Code."})
              }
            }
            else
            res.sendStatus(400)
          })
        }
        
        module.exports.verifyMobile = function(req, res){
          var otp = Math.floor(100000 + Math.random() * 900000);
          var retry, updateObject = {};
          
          var d = new Date(); d.setMinutes(d.getMinutes() + 5);
          if(req.body._t){
            retry = req.body._t,
            updateObject = {"otp.retries" : retry}
          }
          else{
            retry = 0;
            updateObject = {"otp.code" : otp, "otp.retries" : retry, "otp.expires" : d}
          }
          
          Users.findOneAndUpdate({_id : req.body._i}, updateObject, {new : true}, function(err, user){
            if(err){
              console.error(err);
              res.sendStatus(500)
              return;
            }
            
            //http://198.24.149.4/API/pushsms.aspx?loginID=gauravgta&password=Gaurav@123&mobile=7507500582&text=HI HOW ARE YOU&senderid=DEMOOO&route_id=17&Unicode=0
            
            var urlEncodedParams = encodeURIComponent('loginID=gauravgta&password=Gaurav@123&mobile='+req.body._m+'&text=Your One Time Password is '+otp+'&senderid=PFPOPL&route_id=2&Unicode=0');
            
            var options = {
              host: '198.24.149.4',
              port: 80,
              path: '/API/pushsms.aspx?loginID=' 
              + encodeURIComponent('gauravgta') 
              + '&password=' + encodeURIComponent('Gaurav@123') 
              + '&mobile='+parseInt(user.personal_info.mobile)+'&text=' 
              + encodeURIComponent('Your One Time Password is ') +parseInt(user.otp.code)
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
                res.json({"try" : retry});
              });
            }).on("error", function(e){
              console.log("Got error: " + e.message);
            });    
            
          });
        }
        
        module.exports.updateUserRoles = function(req, res){
          var currRole = '';  // to check if rollback has to be implemented
          Users.findOne({"_id" : mongoose.Types.ObjectId(req.body.id)}, function(err, user){
            if(err){
              console.error(err);
              res.send(500);
              return;
            }
            if(user){
              _.each(user.txns, function(t){
                if(t.txn == req.body.appid){
                  currRole = t.role;
                  t.role = req.body.rolename;
                }
              })
              // check if the application is mapped to the user
              if(currRole == ''){                 
                res.status(400).json({"message" : "Invalid Request"})
                return;
              }
              
              if(currRole == 'HR' && req.body.rolename != 'HR'){
                Branch.findByIdAndUpdate(user.branch, { $pull : {hr : user._id}}, function(err, branch){
                  if(err){
                    console.log(err);
                    res.sendStatus(500);
                    return;
                  }
                  else{
                    user.save(function(err){
                      if(err){
                        console.log(err);
                        Branch.findByIdAndUpdate(user.branch, { $push : {hr : user._id}});
                        res.sendStatus(500);
                        return;
                      }
                      res.send(user)
                    })
                  }
                })
              }
              if(req.body.rolename == 'HR' && currRole != 'HR'){
                Branch.findByIdAndUpdate(user.branch, { $push : {hr : user._id}}, function(err, branch){
                  if(err){
                    console.log(err);
                    res.sendStatus(500);
                    return;
                  }
                  else{
                    user.save(function(err){
                      if(err){
                        console.log(err);
                        Branch.findByIdAndUpdate(user.branch, { $pull : {hr : user._id}});
                        res.sendStatus(500);
                        return;
                      }
                      res.send(user)
                    })
                  }
                })
              }
              else{
                user.save(function(err){
                  if(err){
                    console.log(err);
                    res.sendStatus(500);
                    return;
                  }
                  res.send(user)
                })
              }
              
            }
            else{
              res.sendStatus(400)
            }
          })
          
        }
        
        /*module.exports.updateUserRoles = function(req, res){
          
          Users.findOneAndUpdate({"_id" : mongoose.Types.ObjectId(req.body.id), 
          "txns.txn" :mongoose.Types.ObjectId(req.body.appid)},
          { $set : {"txns.$.role" : req.body.rolename}},{new : true}).exec(function(err, result){
            if(err)
            {
              res.sendStatus(500);
              console.error(err);
              return;
              
            }if(result)
            {
              res.status(200).send(result);
              
            }
            
          });
          
        }*/
        
        
        module.exports.getUsersDetails = function(req, res){
          
          Users.find({"_id" : mongoose.Types.ObjectId(req.query.id),"organization.id":req.query.org}).populate({'path':'branch','select':'name'}).exec(function(err, result){
            if(err)
            {
              res.sendStatus(500);
              console.error(err);
              return;
              
            }if(result)
            {
              res.status(200).send(result);
              
            }
            
            
            
            
          });
          
          
          
          
          
        }
        
        
        //server side sorting and pagination employees
        module.exports.getEmployees = function(req, res){
          
          
          var sortOrder = 1;
          var sort='name';
          //var query = {}
          var query = []
          //query['$and'].push({"organization.id" : req.query.org,'employee_code' : {$exists : true}})
          query.push(
            {'$match':{"organization.id" : req.query.org,'employee_code' : {$exists : true},'active':true,'mailVerified':'Y'}});
            
            query.push({'$lookup':
            {
              from: "jobtitles",
              localField: "job_title",
              foreignField: "_id",
              as: "job_names"
            }
          });
          query.push({"$unwind" : "$job_names"});
          /*----------  search regex  ----------*/
          
          if(req.query.search && req.query.search.trim() != ''){
            
          }
          
          console.log('check before query :'+ JSON.stringify(query));
          /*----------  sorts  ----------*/
          
          
          if(req.query.sort == 'name'){
            var sort = 'name'
          }
          if(req.query.sort == 'doj'){
            var sort = 'joining_date'
          }
          if(req.query.sort == 'jobtitle'){
            var sort = 'job_names.name'
          }
          if(req.query.sort==null || req.query.sort==undefined){
            var sort='name'
          }
          
          /*----------  sortOrder for sort field  ----------*/
          
          if(parseInt(req.query.sortOrder) == 1){
            sortOrder = 1
          }
          if(parseInt(req.query.sortOrder)==-1){
            sortOrder=-1
          }
          
          
          //query.push({$match:{'job_names' : {$exists : true}}});
          var sortObject = { [sort] : sortOrder}
          console.log('check sort:'+ sort,sortOrder,sortObject);
          query.push({ $sort : sortObject }); 
          if(req.query.perpage){
            var perPage = parseInt(req.query.perpage);
            query.push({$limit: perPage});
            
          }
          if(req.query.perpage && req.query.page){
            var perPage = parseInt(req.query.perpage);
            var  page = Math.max(0, parseInt(req.query.page)-1); 
            console.log('check page :'+page);
            query.push({$skip: perPage * page});
          }
          
          
          console.log('check query :'+JSON.stringify(query));
          Users.aggregate(query)
          .exec(function(err, results){
            if(err){   
              console.error(err)
              res.sendStatus(500)
              return;
            }
            res.send(results)
          })
          
        }
        
        //get Finance persons
        module.exports.getFinances= function(req, res) {
          
          Users.find(
            {'organization.id': req.query.org, 'employee_code' : {$exists : true},'active':true,'mailVerified':'Y',
            txns: { $elemMatch: { txn: req.query.appid , role:'Accountant'} }}
            
            
          )
          .exec(function(err, user)
          {
            if(err){
              return err;
            }
            if(user){
              console.log('userfound');
              res.status(200).send(user);
            }
            if(!user){
              console.log('user not found');
            }
          });
          
        }