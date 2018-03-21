var mongoose = require( 'mongoose' );
var Plans = require('../models/plans');
var Organizations = require('../models/organizations');
var _ = require('underscore');
var Branches = require('../models/branches');
var Users = require('../models/users')
var mongoose = require('mongoose')
var PaymentTransactions = require('../models/paymenttransactions')


module.exports.applyPromoCode = function(req, res){
  Plans.findOne({_id : req.body._p}, function(err, plan){
    if(err){
      console.error(err)
      res.sendStatus(500)
      return
    }
    if(plan){
      if(plan.promoCode[req.body._c]){
        var newAmt = plan.cost - (plan.cost * parseFloat(plan.promoCode[req.body._c]) / 100)
        res.send({
          "message" : "Code Successfully Applied",
          "amount" : newAmt,
          "dc" : req.body._c,
          "dp" : parseFloat(plan.promoCode[req.body._c]),
          "aa" : plan.cost
        })
      }
      else{
        res.status(400).send({
          "message" : "Invalid code",
          "amount" : plan.cost,

          "dc" : '',
          "dp" : 0,
          "aa" : plan.cost
        })
      }
    }
    else{
      res.status(400).send({"message" : "Invalid code"})
    }
  })
}


module.exports.getUpcomingSub = function(req, res){
  
  if (!(_t || req.body.txn)) {
    res.sendStatus(400);
    return;
  }
  var _t = new RegExp("^" + req.body._t + "$", "i")
  var appNameorIdQuery = req.body.txn ? { 'current_plan.txn': mongoose.Types.ObjectId(req.body.txn) } : { 'current_plan.app': { $regex: _t } }
  console.log(appNameorIdQuery)
  console.log(req.session.passport.user)
  Users.findOne({ '_id': req.session.passport.user }, function (err, user) {

    if (err) {
      console.error(err)
      res.sendStatus(500)
      return
    }
    if (user) {
      console.log(user.organization.id)
      console.log(req.body.txn)
      PaymentTransactions.aggregate(
        { $match: { 'status': 'success', 'organization': user.organization.id, 'end_at' : { $exists: true } } },
        {
          $lookup: {
            from: 'plans',
            localField: 'plan',
            foreignField: '_id',
            as: 'current_plan'
          }
        },
        { $match:  appNameorIdQuery },
    {$sort : {'end_at' : -1}},  
    {$limit : 1},
    {$unwind : '$current_plan'}
  ).exec(function(err, lastSub){
    console.log(lastSub)
    if(err){
      console.error(err)
      res.sendStatus(500)
      return;
    }
    if(lastSub.length > 0){
      lastSub = lastSub[0]
      var timeSinceLastSub = new Date() - new Date(lastSub.end_at)

      var timeToNextSub = ((lastSub.current_plan.months * 30 * 24 * 60 * 60 * 1000) - timeSinceLastSub) / (24 * 60 * 60 * 1000)

      var trialPlan = lastSub.current_plan.cost == 0 ? true : false
      var expireOn = new Date(new Date(lastSub.end_at).getTime() + new Date(lastSub.current_plan.months * 30 * 24 * 60 * 60 * 1000).getTime());
      if(timeToNextSub > 0){
        res.send({
          "expired" : false,
          "days" : timeToNextSub,
          "trialPlan": trialPlan,
          "expireOn": expireOn,
          "subOn" : lastSub.end_at
        })
      }
      else{
        res.send({
          "expired" : true,
          "days" : timeToNextSub,
          "trialPlan": trialPlan,
          "expireOn": expireOn,
          "subOn" : lastSub.end_at
        })
      } 
    }
    else{
      res.status(400).send({
        "expired" : true,
        "days" : 0,
        "trialPlan": false,
        "message" : "You haven't subscribed to any plan yet."
      })
    }
  })
    }
    else{
      console.log('no user found')
      res.sendStatus(400)
    }
  })

}


module.exports.registerModule = function(req, res){
  console.log(req.body)
  Plans.findOne({_id : req.body._p}, function(err, planToBuy){
    if(err){
      console.error(err)
      res.sendStatus(500)
      return
    }
    if(planToBuy){
      Organizations.update({_id : req.body._o}, { $push : { "plans" :  req.body._p}}, {},  function(err, numAffected){
        if(err){
          console.error(err)
          res.sendStatus(500)
          return
        }
        else{
          console.log(numAffected) 
          Users.findOne({_id : req.session.passport.user}, function(err, user){
            if(err){
              console.error(err)
              res.sendStatus(500)
              return
            }
            if(user){
              res.send(user.generateMJwt(req.body._r, req.body._a, req.body._imft, true))


              var emptyTransaction = new PaymentTransactions();
              emptyTransaction.start_at = new Date()
              emptyTransaction.amount = 0
              emptyTransaction.productinfo = 'FREETRIAL - ' + planToBuy.app
              emptyTransaction.firstname = user.first_name
              emptyTransaction.email = user.email
              emptyTransaction.plan = req.body._p
              emptyTransaction.organization = user.organization.id
              emptyTransaction.user = user._id
              emptyTransaction.end_at = new Date()
              emptyTransaction.status = 'success'
              emptyTransaction.udf9 = planToBuy.txn     //app for which the plan is being purchased
              emptyTransaction.save(function(err){
                if(err){
                  console.error(err)
                }else{
                  console.log('TRANSACTION FOR FREETRIAL SUCCESSFUL')
                }
              })


            }
            else{
              /*----------  rollback plan addition and counter measures for refund in case of billing  ----------*/
              
              res.sendStatus(400)
            }
          })
        }
      })
    }
    else{
      res.sendStatus(400)
    }
  })
}


/*=========================================================================================
=            returns all plans with information about currently assigned plan             =
=========================================================================================*/

module.exports.plans = function(req, res){
  Users.findOne({_id : req.session.passport.user})
    .populate({ path: 'organization.id', populate: { path: 'plans', populate: { path : 'plans.txn'}} })
  .exec(function(err, user){
    if(err){
      console.error(err)
      res.sendStatus(500)
      return
    }
    if(user){
      var currentPlan = _.find(user.organization.id.plans, function(p){
        return String(p.txn) === String(req.params.txn)
      })
      var currentPlanId = (currentPlan && currentPlan !== undefined) ? currentPlan._id : ''
      var txn = req.params.txn
      console.log('currentPlan ::, ', currentPlan)
      Plans.aggregate(
        {$facet : {
        "all" : [
                {$match : {txn : mongoose.Types.ObjectId(txn)}},
                { $project: { "promoCode": 0, "restrictions": 0 } },
                { $lookup : {
                  from: 'txns',
                  localField: 'txn',
                  foreignField: '_id',
                  as: 'app'
                }
                },
                { $unwind: '$app' }
            ],
        "this": [
                {$match : {_id : currentPlanId}},
                { $project: { "promoCode": 0, "restrictions": 0 } },
                { $lookup : {
                  from: 'txns',
                  localField: 'txn',
                  foreignField: '_id',
                  as: 'app'
                }
                },
                { $unwind: '$app' }
            ]
        }}
      ).exec(function(err, plansData){
        if(err){
          console.error(err)
          res.sendStatus(500)
          return
        }
        if(plansData.length > 0){
          /*----------  used $facet, so return value ~ [x], retrieve x   ----------*/
          plansData = plansData[0]
          if(plansData["this"].length == 0){
            plansData["this"].push({"rank" : -1})
          }
          plansData["token"] = user.generateJwt();
          res.send(plansData)
        }
      })
    }
    else{
      res.sendStatus(400)
    }
  })
}

/*=====  End of returns all plans with information about currently assigned plan   ======*/



module.exports.getOrgPlans = function(req, res){
  Organizations.findOne({"_id" : req.params.oid})
  .populate('plans')
  .exec(function(err, organization){
    if(err){
      console.erro(err);
      res.sendStatus(500);
    }
    if(organization){
      res.send(organization);
    }
    else res.sendStatus(400);
  });
}

module.exports.planPermit = function(req,res){
  Organizations.findOne({"_id" : req.body.org})
  .populate('plans')
  .exec(function(err, organization){
    if(err){
      console.erro(err);
      res.send(500);
    }
    if(organization){
      var thisPlan = _.filter(organization.plans, function(p){ return p.txn.toString() === req.body._a })[0];
      console.log("thisPlan :: ", thisPlan);
      console.log(organization.plans);
      if(thisPlan && parseInt(thisPlan.restrictions[Buffer.from(req.body._t, 'base64')]) > parseInt(req.body.count)){
        res.send(true);
      }
      else res.send(false);
    }
    else res.sendStatus(400);
  });
}

module.exports.setBranches = function(req, res){

  if(req.body.prefix) 
  {
    
    var prefix = req.body.prefix;
  }
  else {
   
    var prefix =  'br'+req.body.update.organization;
  }
  if(req.body.ucode==null)
  {
    
Organizations.findOneAndUpdate(
    {        
      "_id": req.body.update.organization
    }, 
    {
      $inc: { "branch_counter.seq": 1 },
      $set:{"branch_counter.prefix":prefix}
    },
    {
      upsert:true,
      new:true
    },
    function(err,count){

      var ucode = count.branch_counter.prefix + "-" + count.branch_counter.seq;
      console.log(ucode);
      Branches.update({ucode : ucode, organization : req.body.update.organization}, req.body.update, {upsert : true, passRawResult : true},  function(err, numAffected){
        if(err){
          console.log(err);
          res.send(500);
          return;
        }
        console.log(numAffected);
        if(numAffected.upserted){
          Organizations.findOne({_id : req.body.update.organization}, function(err, org){
            if(err){
              console.error(err);
              return;
            }
            if(org){
              org.branches.push(numAffected.upserted[0]._id);
              org.save(function(err){
                if(err){
                  console.error(err);
                  res.sendStatus(500);
                  Branches.find({ucode : ucode, organization : req.body.update.organization}).remove().exec();
                  return;
                }
                res.status(200).json({"message" : numAffected.upserted[0]._id});
              });
            }
          });
        }
        else
          res.sendStatus(200);
      });
  /*Branches.update({ucode : req.body.ucode, organization : req.body.update.organization}, req.body.update, {upsert : true, passRawResult : true},  function(err, numAffected){
    if(err){
      console.log(err);
      res.send(500);
      return;
    }
    console.log(numAffected);
    if(numAffected.upserted){
      Organizations.findOne({_id : req.body.update.organization}, function(err, org){
        if(err){
          console.error(err);
          return;
        }
        if(org){
          org.branches.push(numAffected.upserted[0]._id);
          org.save(function(err){
            if(err){
              console.error(err);
              res.sendStatus(500);
              Branches.find({ucode : req.body.update.ucode, organization : req.body.update.organization}).remove().exec();
              return;
            }
            res.status(200).json({"message" : numAffected.upserted[0]._id});
          });
        }
      });
    }
    else
      res.sendStatus(200);
  });*/
});
}
else
{
  console.log(req.body.ucode);
  Branches.update({ucode : req.body.ucode, organization : req.body.update.organization}, req.body.update, {upsert : true, passRawResult : true},  function(err, numAffected){
    if(err){
      console.log(err);
      res.send(500);
      return;
    }
    console.log(numAffected);
    if(numAffected.upserted){
      Organizations.findOne({_id : req.body.update.organization}, function(err, org){
        if(err){
          console.error(err);
          return;
        }
        if(org){
          org.branches.push(numAffected.upserted[0]._id);
          org.save(function(err){
            if(err){
              console.error(err);
              res.sendStatus(500);
              Branches.find({ucode : req.body.update.ucode, organization : req.body.update.organization}).remove().exec();
              return;
            }
            res.status(200).json({"message" : numAffected.upserted[0]._id});
          });
        }
      });
    }
    else
      res.sendStatus(200);
  });
}
}

module.exports.getBranchByOrganization = function(req, res) {
  Branches.find({'organization' : req.params.org})
.populate({path : 'hr',select : 'name email'})
  .exec(function(err, branches){
    if(err){
      console.error(err);
      res.sendStatus(500);
      return;
    }
    res.send(branches);
  });
}

module.exports.commitImft = function(req,res) {
  try{
    if(req.body._a){
      Users.update({ "_id" : req.body._i, "txns.txn" : req.body._a}, {"txns.$._imft" : false}, function(err, numAffected){
        if(err){
          console.error(err);
          res.sendStatus(500);
          return;
        }

          console.log(numAffected)
        if(numAffected.nModified == 1){
          res.sendStatus(200);
        }
        else {
          res.sendStatus(400);
        }
      });
    }
    else{
      Users.update({ _id : req.body._i}, {$set : {"_imft" : false}}, function(err, numAffected){
        if(err){
          console.error(err);
          res.sendStatus(500);
          return;
        }
        if(numAffected.nModified == 1){
          res.sendStatus(200);
        }
        else {
          res.sendStatus(400);
        }
      });
    }
  }
  catch(e){
    console.error(e);
  }
}


/*module.exports.setupOrg = function(req, res){

 if(req.body.leaves_config){
  if((req.body.leaves_config.names.length == req.body.leaves_config.description.length) && (req.body.leaves_config.max_leaves.length == req.body.leaves_config.carry_forward_percentage.length) && (req.body.leaves_config.credit_period.length == req.body.leaves_config.credit_amount.length) && (req.body.leaves_config.initial_quota.length == req.body.leaves_config.status.length) ){
    //let it pass
  }
  else{
    res.sendStatus(400);
    return;
  }
 }


  Organizations.findOneAndUpdate({"_id" : req.params.org}, req.body, function(err, oldObject){
    if(err){
      console.error(err);
      res.sendStatus(500);
      return;
    }
    if(!oldObject){
      res.sendStatus(400);
    }
    else {
      res.sendStatus(200);
      //here you compare if new object was inserted
    }
  });

  // Organizations.findOne({"_id" : req.params.org}, function(err, org){
  //   if(err){
  //     console.error(err);
  //     res.sendStatus(500);
  //     return;
  //   }
  //   if(org){
  //     if(org.logo && org.logo != "")  org.logo = req.body.logo;
  //     org.description = req.body.desc;
  //     org.customerDesgn= req.body.custDesgn;
  //     org.sector=req.body.sector;
  //     org.orgStrength=req.body.orgStr;
  //     org.save(function(err){
  //       if(err){
  //         console.error(err);
  //         res.sendStatus(500);
  //         return;
  //       }
  //       res.sendStatus(200);
  //     });
  //   }
  //   else {
  //     res.sendStatus(400);
  //   }
  // });
}*/


module.exports.deleteBranches = function(req, res){
  Branches.remove({_id : req.params.id}, function(err){
    if(err){
      console.log(err);
      res.send(500);
      return;
    }
    Organizations.update({_id : req.params.oid}, {$pull : {"branches" : req.params.id}}, function(err, numAffected){
      if(err){
        console.error(err);
        res.sendStatus(500);
        return;
      }
      if(numAffected.ok == 1 && numAffected.nModified == 1) {
        res.sendStatus(200);
      }
      else
        res.sendStatus(400);
    });
  });
}

//leave policy
module.exports.leavePolicy = function(req,res){

 Organizations.findOne({"_id" : req.body.org},function(err, organization){
 organization.leaves_config.names = req.body.leaves_config.name;
 organization.leaves_config.description = req.body.leaves_config.desc;
 organization.leaves_config.max_leaves = req.body.leaves_config.maxleaves;
 organization.leaves_config.carry_forward_percentage = req.body.leaves_config.cfp;
 organization.leaves_config.credit_period = req.body.leaves_config.cp;
 organization.leaves_config.credit_amount = req.body.leaves_config.ca;
 organization.leaves_config.initial_quota = req.body.leaves_config.iq;
 organization.leaves_config.status = req.body.leaves_config.status;
 if(req.body.leaves_config.cfd){
  organization.leaves_config.carry_forward_days=req.body.leaves_config.cfd;
 }

    console.log("check result :"+ JSON.stringify(organization));
      organization.save(function(err){
    if(err){
      console.log("task error :"+ err);
      return err;
          }
         res.status(200).send(organization);
      });


      });
}

module.exports.setupOrg = function(req, res){

 if(req.body.leaves_config){
  if((req.body.leaves_config.names.length == req.body.leaves_config.description.length) && (req.body.leaves_config.max_leaves.length == req.body.leaves_config.carry_forward_percentage.length) &&
  (req.body.leaves_config.credit_period.length == req.body.leaves_config.credit_amount.length) && (req.body.leaves_config.initial_quota.length == req.body.leaves_config.status.length) ){
    //let it pass
	 //added on may31st 2017 11:14am
    var compOffCounter = 0;
    var unpaidCounter = 0;
    var casualCounter = 0;
    var sickCounter = 0;
    for(var i = 0;i<req.body.leaves_config.names.length;i++){
          if(req.body.leaves_config.isCompOff[i] == true ){    
           compOffCounter++;
          }
          if(req.body.leaves_config.isUnpaid[i] == true){
            unpaidCounter++;
          }
		      if(req.body.leaves_config.isCasual[i] == true ){    
           casualCounter++;
          }
          if(req.body.leaves_config.isSick[i] == true ){    
            sickCounter++;
          }
    }
/*       if(compOffCounter == 1 && unpaidCounter == 1 && casualCounter == 1){
       var index_compOff = req.body.leaves_config.isCompOff.indexOf(true);
       var index_unpaid = req.body.leaves_config.isUnpaid.indexOf(true);
	   var index_casual = req.body.leaves_config.isCasual.indexOf(true);
       if(index_compOff == index_unpaid || index_compOff == index_casual || index_unpaid == index_casual){
        res.status(400).json({"message" : "something went wrong" });
        return;
       }
       else{
            //process should continue
       }
      } */
      if(compOffCounter > 1){
        res.status(400).json({"message" : "Cannot have "+compOffCounter+" CompOff Leaves" });
        return;
      }
      else if(unpaidCounter > 1){
        res.status(400).json({"message" : "Cannot have "+unpaidCounter+" UnPaid Leaves" });
        return;
      }
	    else if(casualCounter > 1){
        res.status(400).json({"message" : "Cannot have "+casualCounter+" Casual Leaves" });
        return;
      }else if(sickCounter > 1){
        res.status(400).json({"message" : "Cannot have "+sickCounter+" Sick Leaves" });
        return;
      }else{
         //process should continue
      }
    //
  }
  else{
    res.sendStatus(422);
    return;
  }
}

Organizations.findOneAndUpdate({"_id" : req.params.org}, req.body, function(err, oldObject){
  if(err){
    console.error("org error"+err.code);
    res.sendStatus(400);
    return;
  }
  if(!oldObject){
    res.sendStatus(400);
    return;
  }
  else {
    console.log('checking for differences in old/new leaves_config.name')
      //res.sendStatus(200);
      //here you compare if new object was inserted
	   if(req.body.leaves_config){
      var newfields = _.difference(req.body.leaves_config.names,oldObject.leaves_config.names);
       var newinitial_quota = _.difference(req.body.leaves_config.initial_quota,oldObject.leaves_config.initial_quota);
	    if(req.body.leaves_config.names.length > oldObject.leaves_config.names.length){
      if(newfields.length > 0){
        console.log('found new fields : ', newfields);
		console.log("new initial quota"+newinitial_quota);
        // considering our application UI, only one laeve type can be added per request
        var newfield = newfields[0];  



        var newfieldStr = 'leaves.' + newfield;        
        var newLeaveTypeObj = {};
		   if(newinitial_quota[0] == null){
          newLeaveTypeObj[newfieldStr] = 0;
        }
		else{
        newLeaveTypeObj[newfieldStr] = newinitial_quota[0];
		}

        Users.update({"organization.id" : req.params.org}, { $set :  newLeaveTypeObj}, {multi : true}, function(err, numAffected){
          if(err){
            console.error("inside user eror: ",err);
            //rollback new leave-type addition in organization
            Organizations.update({"_id" : req.params.org},{  'leaves_config': oldObject.leaves_config },function(err,updated){
              if(err){

                //should retry the rollback ehre if it fails
                console.error(err);
                res.sendStatus(500)
                return;
              }
              res.sendStatus(500)
            });
            //res.sendStatus(500)
            //return;
          }
          console.log('Users for ', req.params.org, ' new leave type sync completed with: ', numAffected);
          if(numAffected.ok == 1){
            res.sendStatus(200);
          }
        })
      }
	  else{
	  res.sendStatus(200);
	  }
		}
		 res.sendStatus(200)
	   }
      else res.sendStatus(200)
    }
});
}
