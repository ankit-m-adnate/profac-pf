var express = require('express');
var router = express.Router();
var Txns = require('../models/txns');
var Users = require('../models/users');
var multer = require('multer');
var Utilities = require('../controllers/utilities.controller');
require('../config/passport');
var _ = require('underscore');
var mongoose = require( 'mongoose' );
var passport = require('passport');
var fs = require('fs');
var path = require('path');
var http = require('http');
//var ctrlProfile = require('../controllers/profile');
var ctrlAuth = require('../controllers/authentication');
var ctrlMail = require('../controllers/mailer');
var ctrlPlan = require('../controllers/plan');
var ctrlsession=require('../controllers/session.controller');
var ctrlorg=require('../controllers/organization.controller');
// profile
//router.get('/profile', auth, ctrlProfile.profileRead);

// authentication
router.get('/setFps/:_i/:_f/:_dI', ctrlorg.updateFpsId);
router.post('/register', ctrlAuth.register);
router.post('/login', ctrlAuth.login);
router.get('/logout', ctrlsession.validSession, ctrlAuth.logout);
router.post('/mlogin',  ctrlAuth.mlogin);
router.post('/planPermit', ctrlsession.validSession, ctrlPlan.planPermit);
router.get('/plans/:txn', ctrlsession.validSession, ctrlPlan.plans);
router.post('/regMod', ctrlsession.validSession, ctrlPlan.registerModule);
router.post('/nextSub', ctrlsession.validSession, ctrlPlan.getUpcomingSub)
router.post('/applypromo', ctrlsession.validSession, ctrlPlan.applyPromoCode)

//organization metadata
router.post('/setBranches', ctrlsession.validSession, ctrlPlan.setBranches);
router.delete('/deleteBranch/:id/:oid', ctrlsession.validSession, ctrlPlan.deleteBranches);
router.get('/orgBranch/:org', ctrlsession.validSession, ctrlPlan.getBranchByOrganization);
router.post('/setupOrg/:org', ctrlsession.validSession, ctrlPlan.setupOrg);
router.post('/commitImft', ctrlsession.validSession, ctrlPlan.commitImft);
router.get('/getOrgPlans/:oid', ctrlsession.validSession, ctrlPlan.getOrgPlans);
router.post('/leavePolicy', ctrlsession.validSession, ctrlPlan.leavePolicy);
router.get('/getOrg', ctrlsession.validSession, ctrlorg.getOrg);
router.get('/getConfig', ctrlsession.validSession,ctrlorg.getConfig);
router.post('/leaveAllotment', ctrlsession.validSession, ctrlorg.leaveAllotment);
router.get('/getleaveAllotment', ctrlsession.validSession, ctrlorg.getleaveAllotment);
router.post('/resetUnpaid', ctrlsession.validSession, ctrlorg.resetUnpaid);
//multer


var storage =   multer.diskStorage({
	  destination: function (req, file, callback) {
	    callback(null, '/ProcessFactory/uploads/');
	  },
	  filename: function (req, file, callback) {
	    callback(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
	  }
	});
	var upload = multer({ storage : storage}).single('file');
	//var upload = multer({ storage : storage }).array('userPhoto',2);
 //GET home page.
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});


router.get('/abcd', function(req,res){
	res.sendStatus(200);
});


router.post('/contactform', function(req, res){
	if(!req.body.name || !req.body.email || !req.body.phone || !req.body.comment){
		res.sendStatus(400);
		return;
	}

	var mailOptions = {
		to: "pavitra.rastogi@adnatesolutions.com",
		from: 'contactForm@pFactory.com',
		subject: 'Customer Contact',
		text: 'Name : ' + req.body.name + '\n\n' +
			  'Email : ' + req.body.email + '\n\n' +
			  'Phone : ' + req.body.phone + '\n\n' +
			  'Concern : \n' + 
			  req.body.comment + '\n\n' 
		  	
	  };
	ctrlMail.sendMail(mailOptions);
	res.send(200);

})


router.post('/reset/:token', function(req,res){
	console.log(req.params.token);
	Users.findOne({'resetToken.item' : req.params.token, 'resetToken.expires' : { $gt: Date.now() }}, function(err,user){
		if(err){
			return err;
		}
		if(!user){
			res.status(400).send('Password reset link is invalid or has expired.');
		}
		if(user){
			user.setPassword(req.body.password);
			user.resetToken = undefined;
			user.save(function(err){
				if(err){
					res.status(400).send(err);
					return err;
				}
				if(req.query._rd){
					res.redirect(Buffer.from(req.query._rd, 'base64'));
				}
				else
					res.redirect('/');
			});
		}

	});
});

router.get('/reset/:token', function(req,res){
	Users.findOne({'resetToken.item' : req.params.token, 'resetToken.expires' : { $gt: Date.now() }}, function(err,user){
		if(err){
			return err;
		}
		if(!user){
			res.status(400).send('Password reset link is invalid or has expired.');
		}
		if(user){
			res.render('reset' , {
				user: user
			});
		}

	});
});

router.post('/forgot', function(req,res){
	Users.findOne({ email: new RegExp('^'+req.body.email.trim()+'$', "i") }, function(err,user){
		if(err){
			return err;
		}
		if(!user){
			res.status(400).send('This email is not registered with us.');
		}
		if(user){
			var resetToken = ctrlMail.generateToken();
			user.resetToken = resetToken;
			user.save(function(err){
				if(err){
					return err;
				}
				var _rd
				if(req.body._rd){
					_rd = '?_rd=' + req.body._rd
				}
				else{
					_rd = ''
				}

				var mailOptions = {
			        to: user.email,
			        from: 'passwordReset@pFactory.com',
			        subject: 'ProcessFactory Password Reset',
			        text: 'You are receiving this because you (or someone else) has requested to reset of the password for your account.\n\n' +
			          'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
			          'http://' + req.headers.host + '/pFactory/reset/' + resetToken.item +  _rd + '\n\n' +
			          'If you did not request this, please ignore this email and your password will remain unchanged.\n'
			      };
				ctrlMail.sendMail(mailOptions);
				res.status(200).send('Password reset link has been sent to ' + user.email+'.');
			});
		}
	});
});

router.get('/verifyMail/:emailToken', function(req,res){
	Users.findOne({'token.item' : req.params.emailToken}, function(err,user){
		if(err){
			console.error(err);
			return err;
		}
		if(user){
			if(user.mailVerified === 'Y')
				{res.status(200).send('User '+user.email+' is already verified');}
			else if(user.token.expires < new Date())
				{res.status(400).send('Verification link has expired. Please generate new link.');}
			else {
				user.mailVerified = 'Y';
				user.save(function(err){
					if(err){
						return err;
					}
					else
						{	
							if(req.query._rd && req.query._rd != '')
								res.redirect(Buffer.from(req.query._rd, 'base64'));
							else
								res.redirect('https://www.procfactory.com/');
						}
				});
			}
		}
		else{
			res.status(400).send('Invalid verification link');
		}
	});
});

router.get('/activate/:emailToken', function(req,res){
	/*checking link expiration has been removed*/
	Users.findOne({'token.item' : req.params.emailToken}, function(err,user){
		if(err){
			return err;
		}
		if(!user){
			res.status(400).send('Activation link is invalid.');
		}
		if(user){
			res.render('activate' , {
				user: user
			});
		}

	});
});

//make separate controller for this
function makeCall (hostname, port, path, method, body) {
    var request = new http.ClientRequest({
    hostname: hostname,
    port: port,
    path: path,
    method: method,
/*    headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(body)
    }*/
    });
    if(body) request.end(body);
    else request.end();
    //callback();
}


router.post('/activate/:emailToken', function(req,res){
	/*checking link expiration has been removed -->>  'token.expires' : { $gt: Date.now() } */
	Users.findOne({'token.item' : req.params.emailToken})
	.populate({path : 'organization.id',select:'name'})
	.exec(function(err,user){
		if(err){
			return err;
		}
		if(!user){
			res.status(400).send('Activation link is invalid.');
		}
		if(user){
			console.log('In activate--------------'+user.organization.id.name+'---------------------');
			user.setPassword(req.body.password);
			//user.joining_date = Date.now();
			user.mailVerified = 'Y';
			user.verfied = 'Y';
			//user.resetToken = undefined;
			user.save(function(err){
				if(err){
					res.status(400).send(err);
					return err;
				}
				Txns.findOne({"name" : "WMS"}, function(err, transaction){
					if(err){
						console.error(err);
						return false;
					}
					if(transaction){
						if(_.filter(user.txns, function(t){ return t.txn.toString() === transaction._id.toString() }).length > 0){		//send activation call to WMS if mapping is found
							console.log("Activating user for app", transaction.name, "appid", transaction._id, "....");
							console.log(new Buffer(user.email).toString('base64'));
							//makeCall("192.168.100.14", "9090", "WarehouseMgmt/contractor/contractorEmail/" + new Buffer(user.email).toString('base64'), "GET", null);
							var options = {
							  host: '192.168.100.14',
							  path: "/WarehouseMgmt/contractor/contractorEmail/" + new Buffer(user.email).toString('base64'),
							  port: "9090"
							};

							callback = function(response) {
							  var str = '';

							  //another chunk of data has been recieved, so append it to `str`
							  response.on('data', function (chunk) {
							    str += chunk;
							  });

							  //the whole response has been recieved, so we just print it out here
							  response.on('end', function () {
							    console.log("response recieved::",str, str.length);
							  });
							}

							http.request(options, callback).end();
							console.log("Activation call sent");
						}
					}
				});
				Txns.findOne({"name" : "HRMS"}, function(err, transaction){
					if(err){
						console.error(err);
						return false;
					}
					if(transaction){
						if(_.filter(user.txns, function(t){ return t.txn.toString() === transaction._id.toString() }).length > 0){		//send activation call to WMS if mapping is found
							console.log("Activating user for app", transaction.name, "appid", transaction._id, "....");
										Users.find(
            {'organization.id': user.organization.id,
             txns: { $elemMatch: { txn: mongoose.Types.ObjectId(transaction._id)} }}


            )
 .exec(function(err, user1)
 {
  if(err){
   return err;
 }
 if(user1.length>0){
	 var userdata=[];
	 for(var i=0;i<user1.length;i++)
	 {
		 userdata.push(user1[i]._id.toString());
	 }
	var newarr = userdata.filter(function(a){return a !== user._id.toString()})
   Utilities.sendNotification(user.organization.id,transaction._id,newarr,'hrms.employeedetails',null,true,'<b>'+user.first_name.charAt(0).toUpperCase() + user.first_name.slice(1).trim() + " " + user.last_name.charAt(0).toUpperCase() + user.last_name.slice(1).trim()+'</b>'+' joined <b>'+user.organization.id.name+'</b>',user.email)
   
 }
 
});
							
						}
					}
				});
				res.redirect('/');
			});
		}

	});
});


router.post('/upload', ctrlsession.validSession, function(req, res) {
	console.log('in upload');
	upload(req,res,function(err) {
        if(err) {
        	console.log("error :::",err);
            return res.end("Error");
        }
        //res.end("File is uploaded");
        console.log(JSON.stringify(req.file));
        res.send(req.file);
    });
	});

router.get('/auth/google', passport.authenticate('google', { scope : ['profile', 'email'] }));
//the callback after google has authenticated the user
router.get('/auth/google/callback',
        passport.authenticate('google', {
                successRedirect : '/profile',
                failureRedirect : '/'
        }));

router.post('/userCheck', ctrlsession.validSession, function(req,res){					//redundant as we'll be mapping against txns when a user is invited to that module; he cannot access it otherwise
	Users.findOne({'email' : req.body.email}, {hash : 0, salt : 0, mailVerified : 0, token :0})
	.populate('txns.txn')
	.populate({path : "organization.id", populate: {path: 'plans'}})
	.exec(function(err, user){
		//console.log(user);
		if(err){
			return err;
		}
		if(user){
			user = user.toObject();
			//console.log('userCheck :: found');
			_.each(user.organization.id.plans, function(p){
				 _.each(user.txns, function(t, index){
				 	if(t.txn._id.toString() == p.txn.toString()){
				 		console.log('p.identifier ::', p.identifier)
				 		//user.txns[index].plan = p.identifier
				 		t['plan'] = p.identifier
				 	}
				 })
			})
			console.log(user.txns)
			res.status(200).send(user);
		}
		if(!user){
			//console.log('userCheck ::  not found');
			res.status(400).send('User NoT found.');
			/*Txns.find({}, function(err,txns){
				if(err){
					return err;
				}
				if(txns.length > 0){

					var newUser = new Users();
					newUser.name = req.body.userId;
					_.each(txns, function(txn){
						newUser.txns.push({
							'txn' :  txn._id,
							'c_x' : 0,
							'c_y' : 0,
							's_x' : 0,
							's_y' : 0,
							'noOfHits' : 0,
							'favor' : false
						});
					});
					newUser.save(function(err){
						if(err){
							return err;
						}
						res.status(200).send(newUser);
					});
				}
				else{
					res.status(400).send('New User & No Apps found. Cant map without data.');
				}
			});*/
		}
	});
});

router.post('/noOfHits', ctrlsession.validSession,  function(req,res){
	console.log(req.body.userId , req.body.txnId);
	Users.update(
			{'_id' : req.body.userId, 'txns.txn' : req.body.txnId},
			{$inc : {'txns.$.noOfHits' : 1}},
			function(err,result){
				if(err){
					return err;
				}
				res.status(200).send(result);
			});
});


router.post('/saveUserConfig' , ctrlsession.validSession, function(req,res){
	console.log(req.session);
	Users.findOne({'name' : req.body.name}).populate('txns.txn').exec(function(err,user){
		if(err){
			return err;
		}
		if(user){
			user.txns = req.body.txns;



			/*=============================================
			=            to be implemented            =
			=============================================*/
			
			/*_.each(req.body.txns, function(reqt){
				_.each(user.txns, function(dbt){
					if(reqt.txn._id.toString() == dbt.txn.toString()){

					}
				})
			})*/
			
			/*=====  End of Section comment block  ======*/
			
			
			

			user.userConfig = req.body.userConfig;
			user.save(function(err){
				if(err){
					return err;
				}
				res.status(200).send('Success');
			});
		}
		else
			res.status(403).send('No User found for :' + req.body.name);
	});
});

router.get('/appTxns', ctrlsession.validSession, function(req,res){
	Txns.find({}, function(err, result){
		if(err){
			return err;
		}
		if(result.length > 0){
			res.status(200).send(result);
		}
		else
			res.status(400).send('No apps in DB');
	});
});

router.post('/updateAppTxns', ctrlsession.validSession, function(req,res){
	if((req.body.action).toLowerCase() == 'add'){
		var txn = new Txns(req.body.txn);
		txn.save(function(err){
			if(err){
				return err;
			}
			Users.find({}, function(err,users){
				_.each(users,function(u){
					u.txns.push({
						"txn" : txn._id,
			            "c_x" : 0,
			            "c_y" : 0,
			            "s_x" : 3,
			            "s_y" : 1,
			            "noOfHits" : 0,
			            "favor" : false
					});
					u.save(function(err){
						if(err){
							return err;
						}
					});
				});
			res.status(200).send('Txn added with id : ' + txn._id);
			});
		});
	}
	else if((req.body.action).toLowerCase() == 'update'){
		Txns.find({'_id' : req.body.txn._id}, function(err, txn){
			if(err){
				return err;
			}
			if(txn.length > 0){
				txn = txn[0];
				txn.name = req.body.txn.name;
				txn.desc = req.body.txn.desc;
				txn.category = req.body.txn.category;
				txn.url = req.body.txn.url;
				txn.imagePath = req.body.txn.imagePath;
				txn.save(function(err){
					if(err){
						return err;
					}
					res.status(200).send('Changes Saved!');
				});
			}
		});
	}
	else if((req.body.action).toLowerCase() == 'delete'){
		_.each(req.body.txn, function(t){
			//Txns.find({'_id' : t}).remove().exec();
			Txns.findOneAndRemove({'_id': t}, function(err, txn) {
    txn.remove();
});
		});
		res.status(200).send('Deleted!');
	}
});


module.exports = router;

	/*var express = require('express');
	var app = express.Router();
module.exports = function(app, passport) {
    // route for home page
    app.get('/', function(req, res) {
        res.render('index.ejs'); // load the index.ejs file
    });

    // route for login form
    // route for processing the login form
    // route for signup form
    // route for processing the signup form

    // route for showing the profile page
    app.get('/profile', isLoggedIn, function(req, res) {
        res.render('profile.ejs', {
            user : req.user // get the user out of session and pass to template
        });
    });

    // route for logging out
    app.get('/logout', function(req, res) {
        req.logout();
        res.redire{ct('/');
    });

    // facebook routes
    // twitter routes

    // =====================================
    // GOOGLE ROUTES =======================
    // =====================================
    // send to google to do the authentication
    // profile gets us their basic information including their name
    // email gets their emails
    app.get('/auth/google', passport.authenticate('google', { scope : ['profile', 'email'] }));

    // the callback after google has authenticated the user
    app.get('/auth/google/callback',
            passport.authenticate('google', {
                    successRedirect : '/profile',
                    failureRedirect : '/'
            }));

};

// route middleware to make sure a user is logged in
function isLoggedIn(req, res, next) {

    // if user is authenticated in the session, carry on
    if (req.isAuthenticated())
        return next();

    // if they aren't redirect them to the home page
    res.redirect('/');
}*/
