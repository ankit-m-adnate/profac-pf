// @ts-check --checkJs
'use strict';
const FREEUSERLIMIT = '10'
const DEFAULTUSERROLE = 'ADM'
const DEFAULTUSERPASSWORD = 'QWRtaW5AMTIz'
var mongoose = require('mongoose');
var crypto = require('crypto');
var moment = require('moment');
var licGen = require('node-jen')
var hdl = new licGen(false);
var fs = require('fs');
var express = require('express');
var http = require('http');
var path = require('path');
var router = express.Router();
var http = require('http');
var Licenses = require('../models/license')
var FreeTrials = require('../models/freeofflinetrails')



module.exports.getLicenses = function(req, res){
    var query = []
    var filter_query = {} , keyword_query = {};
    var skip_query = {} , limit_query = {}
    filter_query['$match'] = {}

    var searchString, consumed_filter, app_filter, mode_filter
    
    if(req.body.used == true || req.body.used == false){
        filter_query['$match']['used'] = req.body.used
    }

    if(req.body.app){
        filter_query['$match']['app'] = req.body.app
    }

    if(req.body.mode){
        filter_query['$match']['mode'] = req.body.mode
    }
    
    
    if(req.body.query){
        searchString = {'$regex' : req.body.query, '$options' : 'i'}
        keyword_query['$match'] = {}
        keyword_query['$match']['$or'] = new Array()

        keyword_query['$match']['$or'].push({'first_name' : searchString})
        keyword_query['$match']['$or'].push({'last_name' : searchString})
        keyword_query['$match']['$or'].push({'orgname' : searchString})
        keyword_query['$match']['$or'].push({'macAsSalt' : searchString})
        keyword_query['$match']['$or'].push({'email' : searchString})
        keyword_query['$match']['$or'].push({'_id' : searchString})
    }
    

    if(req.body.used || req.body.app || req.body.mode) query.push(filter_query);
    if(req.body.query) query.push(keyword_query);
    
    if(req.body.perPage) {
        if(req.body.page == 0 || req.body.page){
            console.log(req.body.perPage, req.body.page)
            var skipVal = (parseInt(req.body.page)) * parseInt(req.body.perPage)
            
            query.push({'$skip' : skipVal})
            query.push({'$limit' : parseInt(req.body.perPage)})
        }
    }

    
    Licenses.aggregate(query)
            .exec(function(err, result){
                if(err){
                    console.error(err)
                    res.sendStatus(500)
                    return
                }
                res.send(result)
            })

}



var generateLicensesUtil = function(lic_num, user_num, expiry, partnerName, partnerCode, app){
    return new Promise(function(resolve, reject){
        if(app){
            app = app.toUpperCase();
        }
        var outArray = []
        for(var i = 0; i < parseInt(lic_num); i++){
            
            var key = hdl.password(25, 25).toUpperCase()
            var keyArr = key.match(/.{5}/g)
            var licObj = {
                _id : keyArr[0] + '-' +
                        keyArr[1] + '-' +
                        keyArr[2] + '-' +
                        keyArr[3] + '-' +
                        keyArr[4],
                userLimit : parseInt(user_num),
                mode : 'OFFLINE',
                app : app,
                validity : parseInt(expiry),
                partnerName : partnerName || null,
                partnerCode : partnerCode || null,
                createdAt : new Date()
                
            }
            outArray.push(licObj)
        }
        var nativeMongo_License = Licenses.collection
        nativeMongo_License.insert(outArray,{ ordered : false}, function(error, docs) {
            console.log('logging err and docs ', error, docs)
            if(error){
                //reject(error)
                //return;
            }
            
                resolve(docs)
            
        })
    })
}

module.exports.generateLicense = function(req, res){
    generateLicensesUtil(req.body.lic_num, req.body.user_num, req.body.expiry, req.body.partnerName, req.body.partnerCode, req.body.app)
    .then(function(docs){
        res.send({"ok" : docs.result.ok, "inserted" : docs.insertedCount});
    }, function(error){
        res.send(error)
    })
    
}

var sendConfirmationSMS = function(fn, email, pass, phone){
	phone = phone.toString();
	console.log(phone)
	phone = parseInt(phone.substring((phone.length -10), phone.length))
	
	var options = {
        host: '198.24.149.4',
        port: 80,
        path: '/API/pushsms.aspx?loginID=' 
        + encodeURIComponent('gauravgta') 
        + '&password=' + encodeURIComponent('Gaurav@123') 
        + '&mobile='+phone+'&text=' 
        + encodeURIComponent('Hi ')
		+ fn
		+ encodeURIComponent('! Thank you for installing ProcessBooks Offline. Your login credentials are as follows : \n') 
		+ encodeURIComponent('Username : ') + email + encodeURIComponent('\n')
		+ encodeURIComponent('Password : Admin@123 \n')
		+ encodeURIComponent('Please feel free to contact us on +919823079430 for any further queries.')
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
        });
      }).on("error", function(e){
        console.log("Got error: " + e.message);
      });
}

module.exports.validateBooksLicense = function(req, res){
    /**postString should be in the following format
     * appName |||| serial |||| firstname |||| lastname |||| email |||| phone |||| organizationname |||| windows id |||| appVersion ||||
     * HDD serial |||| source
     */
    
    
    try{req.body = Object.keys(req.body)[0]}catch(err){
        console.error(err)    
        req.body = req.body
    
    }
    var postString = req.body;
    console.log("poststring : ",  postString)
    var postStringParams = postString.split('||||')
    var clientApp = postStringParams[0],
        serial = postStringParams[1], 
        firstname = postStringParams[2], 
        lastname = postStringParams[3], 
        email = postStringParams[4],
        phone = postStringParams[5],
        orgname = postStringParams[6],
        macString = postStringParams[7],
        appVersion = postStringParams[8],
        HDDId = postStringParams[9],
        reqSource = postStringParams[10];
        console.log("APPVERSION : " +   appVersion)
        console.log("HDDID : " +   HDDId)

       // macArray = []
        


   
    var clientMac = macString + '||' + HDDId;
    var orgid = orgname.toLowerCase().replace(/ /gi, '');
    var nowDate = new Date()

    if(!serial || serial == '' || serial === undefined){
        FreeTrials.findOne({macAsSalt : macString, app : clientApp, hddId : HDDId}, function(err, freetrial){
            if(err){
                console.error(err)
                res.status(500).send('Please try after some time.');
                return;
            }
            
            if(freetrial){
                var response;
                


                if(reqSource == 'setup'){

                    var cipher = crypto.createCipher('aes-128-ecb',clientMac)
                    
                    var hash = 'FREE'
            
                    /**no_of_licensed_users */
                    var enc_user_num = cipher.update(FREEUSERLIMIT,'utf-8','hex')
                    enc_user_num += cipher.final('hex')
            
                    /**expiry_date */
                    cipher = crypto.createCipher('aes-128-ecb',clientMac)
                    var exp_date = freetrial.expires.toISOString() 
                    var enc_exp_date = cipher.update(exp_date,'utf-8','hex')
                    enc_exp_date += cipher.final('hex')
            
                    /**organizationid */
                    cipher = crypto.createCipher('aes-128-ecb',clientMac)
                    var enc_organization_id = cipher.update(freetrial.orgid.toString(),'utf-8','hex')
                    enc_organization_id += cipher.final('hex')


                    var reuseData = {
                        "orgname" : orgname,
                        "orgid" : orgid,
                        "usedAt" : new Date(),
                        "first_name" : firstname.charAt(0).toUpperCase() + firstname.slice(1),
                        "last_name" : lastname.charAt(0).toUpperCase() + lastname.slice(1),
                        "email" : email,
                        "phone" : phone,
                        "macAsSalt" : macString,
                        "hddId" : HDDId,
                        "appVersion" : appVersion
                    }
                    freetrial.reuseData.push(reuseData)
                    freetrial.markModified('reuseData')
                    response =  hash + '||||'
                                + enc_user_num + '||||'
                                + enc_exp_date + '||||'
                                + enc_organization_id + '||||'
                                + freetrial.orgname + '||||'
                                + freetrial.first_name + '||||'
                                + freetrial.last_name + '||||'
                                + freetrial.email + '||||'
                                + DEFAULTUSERROLE + '||||'
                                + DEFAULTUSERPASSWORD + '||||'
                                + phone + '||||'
                                + freetrial.orgid
                }
                else if(reqSource == 'application'){

                    var cipher = crypto.createCipher('aes-128-ecb',clientMac)
                    
                    var hash = 'FREE'
            
                    /**no_of_licensed_users */
                    var enc_user_num = cipher.update(FREEUSERLIMIT,'utf-8','hex')
                    enc_user_num += cipher.final('hex')
            
                    /**expiry_date */
                    cipher = crypto.createCipher('aes-128-ecb',clientMac)
                    var exp_date = freetrial.expires.toISOString() 
                    var enc_exp_date = cipher.update(exp_date,'utf-8','hex')
                    enc_exp_date += cipher.final('hex')
            
                    /**organizationid */
                    cipher = crypto.createCipher('aes-128-ecb',clientMac)
                    var enc_organization_id = cipher.update(orgid.toString(),'utf-8','hex')
                    enc_organization_id += cipher.final('hex')


                    var newOrgData = {
                        "orgname" : orgname,
                        "orgid" : orgid,
                        "usedAt" : new Date(),
                        "first_name" : firstname.charAt(0).toUpperCase() + firstname.slice(1),
                        "last_name" : lastname.charAt(0).toUpperCase() + lastname.slice(1),
                        "email" : email,
                        "phone" : phone,
                        "macAsSalt" : macString,
                        "hddId" : HDDId,
                        "appVersion" : appVersion
                    }
                    freetrial.organizations.push(newOrgData)
                    freetrial.markModified('organizations')
                    response =  hash + '||||'
                    + enc_user_num + '||||'
                    + enc_exp_date + '||||'
                    + enc_organization_id + '||||'
                    + orgname + '||||'
                    + firstname + '||||'
                    + lastname + '||||'
                    + email + '||||'
                    + DEFAULTUSERROLE + '||||'
                    + DEFAULTUSERPASSWORD + '||||'
                    + phone + '||||'
                    + orgid
                }

                freetrial.save(function(err){
                    if(err){
                        console.error(err)
                        res.sendStatus(500)
                        return;
                    }
                    console.log(response)
                    
                    res.status(200).send(response)
                    if(reqSource == 'setup') sendConfirmationSMS(freetrial.first_name, freetrial.email, 'Admin@123', phone)
                    
                    return;
                })
                
				
				

            }
            else{
                var usedAtDate = nowDate
                var newTrial = new FreeTrials();
                newTrial.orgid = orgid
                newTrial.orgname = orgname
                newTrial.userLimit = parseInt(FREEUSERLIMIT)
                newTrial.usedAt = new Date()
                newTrial.first_name = firstname.charAt(0).toUpperCase() + firstname.slice(1)
                newTrial.last_name = lastname.charAt(0).toUpperCase() + lastname.slice(1)
                newTrial.email = email
                newTrial.phone = phone
                newTrial.macAsSalt = macString
                newTrial.app = clientApp
                newTrial.expires = new Date(nowDate.setMonth(nowDate.getMonth() + 1)).toISOString()
                newTrial.appVersion = appVersion
                newTrial.hddId = HDDId

                var cipher = crypto.createCipher('aes-128-ecb',clientMac)
                
                var hash = 'FREE'
        
                /**no_of_licensed_users */
                cipher = crypto.createCipher('aes-128-ecb',clientMac)
                var enc_user_num = cipher.update(FREEUSERLIMIT,'utf-8','hex')
                enc_user_num += cipher.final('hex')
        
                /**expiry_date */
                cipher = crypto.createCipher('aes-128-ecb',clientMac)
                var exp_date = newTrial.expires.toISOString() 
                var enc_exp_date = cipher.update(exp_date,'utf-8','hex')
                enc_exp_date += cipher.final('hex')
        
                /**organizationid */
                cipher = crypto.createCipher('aes-128-ecb',clientMac)
                var enc_organization_id = cipher.update(orgid.toString(),'utf-8','hex')
                enc_organization_id += cipher.final('hex')

                newTrial.save(function(err){
                    if(err){
                        console.error(err)
                        res.status(500).send('Please try after some time.');
                        return;
                    }
                    else{
                        console.log(hash + '||||'
                        + enc_user_num + '||||'
                        + enc_exp_date + '||||'
                        + enc_organization_id + '||||'
                        + orgname + '||||'
                        + newTrial.first_name + '||||'
                        + newTrial.last_name + '||||'
                        + newTrial.email + '||||'
                        + DEFAULTUSERROLE + '||||'
                        + DEFAULTUSERPASSWORD + '||||'
                        + newTrial.phone + '||||'
					+ newTrial.orgid)

                        res.status(200).send(
                            hash + '||||'
                            + enc_user_num + '||||'
                            + enc_exp_date + '||||'
                            + enc_organization_id + '||||'
                            + orgname + '||||'
                            + newTrial.first_name + '||||'
                            + newTrial.last_name + '||||'
                            + newTrial.email + '||||'
                            + DEFAULTUSERROLE + '||||'
                            + DEFAULTUSERPASSWORD + '||||'
                            + newTrial.phone + '||||'
					+ newTrial.orgid
                        )
						if(reqSource == 'setup') sendConfirmationSMS(newTrial.first_name, newTrial.email, 'Admin@123', newTrial.phone)
                        return;
                    }
                })
            }
        })
    }


    else{
        Licenses.findOne({_id : serial}, function(err, lic){
            if(err){
                console.error(err)
                res.status(500).send('Please try after some time.');
                return;
            }
            if(lic){
                    if(lic.app == clientApp){
                                    /**
                     * check if this serial has been used earlier on the same windows id and hdd serial 
                     */
                    
                    if(!lic.macAsSalt && !lic.hddId){
                        /** serial key unused */
                        
                        
                        lic.orgname = orgname
                        lic.orgid = orgid
                        lic.used = true
                        lic.usedAt = new Date()
                        lic.first_name = firstname.charAt(0).toUpperCase() + firstname.slice(1)
                        lic.last_name = lastname.charAt(0).toUpperCase() + lastname.slice(1)
                        lic.email = email
                        lic.phone = phone
                        lic.macAsSalt = clientMac
                        lic.appVersion = appVersion
                        lic.hddId = HDDId
                        /**
                         * create hash for serial & mac and add to lic object
                         */
                        var hashString = serial + '||' + clientMac
                        var hash = crypto.createHash('sha512').update(hashString).digest('hex').toUpperCase();
                        lic.hash = hash
    
    
                        /**
                         * encypt aes-128-ebc for |||| separated params except hash and organization name
                         * 
                         *  hash||||no_of_licensed_users||||expiry_date||||organizationid||||organizationName
                         */
    
                        var cipher = crypto.createCipher('aes-128-ecb',clientMac)
    
                        /**no_of_licensed_users */
                        var enc_user_num = cipher.update(lic.userLimit.toString(),'utf-8','hex')
                        enc_user_num += cipher.final('hex')
    
                        /**expiry_date */
                        cipher = crypto.createCipher('aes-128-ecb',clientMac)
                        console.log(nowDate.getTime() , (lic.validity * 1000))
                        lic.expires = new Date(nowDate.getTime() + (lic.validity * 1000))
                        console.log(lic.expires)
                        var exp_date = lic.expires.toISOString() 
                        var enc_exp_date = cipher.update(exp_date,'utf-8','hex')
                        enc_exp_date += cipher.final('hex')
    
                        /**organizationid */
                        cipher = crypto.createCipher('aes-128-ecb',clientMac)
                        var enc_organization_id = cipher.update(orgid.toString(),'utf-8','hex')
                        enc_organization_id += cipher.final('hex')
    
                        lic.save(function(err){
                            if(err){
                                console.log(err)
                                res.status(500).send('Please try after some time.');
                                return;
                            }
                            else{
                                console.log(
                                    hash + '||||'
                                    + enc_user_num + '||||'
                                    + enc_exp_date + '||||'
                                    + enc_organization_id + '||||'
                                    + orgname + '||||'
                                    + lic.first_name + '||||'
                                    + lic.last_name + '||||'
                                    + lic.email + '||||'
                                    + DEFAULTUSERROLE + '||||'
                                    + DEFAULTUSERPASSWORD + '||||'
                                    + lic.phone + '||||'
									+ lic.orgid
                                )
                                res.status(200).send(
                                    hash + '||||'
                                    + enc_user_num + '||||'
                                    + enc_exp_date + '||||'
                                    + enc_organization_id + '||||'
                                    + orgname + '||||'
                                    + lic.first_name + '||||'
                                    + lic.last_name + '||||'
                                    + lic.email + '||||'
                                    + DEFAULTUSERROLE + '||||'
                                    + DEFAULTUSERPASSWORD + '||||'
                                    + lic.phone + '||||'
									+ lic.orgid
                                )
								if(reqSource == 'setup') sendConfirmationSMS(lic.first_name, lic.email, 'Admin@123', lic.phone)
                            }
                        })
                    }
    
                    else if(lic.hddId == HDDId && lic.macAsSalt == macString){
                        /**
                         * serial key has already been used for this client
                         */
                        var response;
                        if(reqSource == 'setup'){

                            /**
                         * encypt aes-128-ebc for |||| separated params except hash and organization name
                         * 
                         *  hash||||no_of_licensed_users||||expiry_date||||organizationid||||organizationName
                         */
    
                        var cipher = crypto.createCipher('aes-128-ecb',clientMac)
                        
                        /**no_of_licensed_users */
                        var enc_user_num = cipher.update(lic.userLimit.toString(),'utf-8','hex')
                        enc_user_num += cipher.final('hex')
    
                        /**expiry_date */
                        cipher = crypto.createCipher('aes-128-ecb',clientMac)
                         
                        var enc_exp_date = cipher.update(lic.expires.toISOString(),'utf-8','hex')
                        enc_exp_date += cipher.final('hex')
    
                        /**organizationid */
                        cipher = crypto.createCipher('aes-128-ecb',clientMac)
                        var enc_organization_id = cipher.update(lic.orgid.toString(),'utf-8','hex')
                        enc_organization_id += cipher.final('hex')

                            var reuseData = {
                                "orgname" : orgname,
                                "orgid" : orgid,
                                "used" : true,
                                "usedAt" : new Date(),
                                "first_name" : firstname.charAt(0).toUpperCase() + firstname.slice(1),
                                "last_name" : lastname.charAt(0).toUpperCase() + lastname.slice(1),
                                "email" : email,
                                "phone" : phone,
                                "macAsSalt" : macString,
                                "hddId" : HDDId,
                                "appVersion" : appVersion,
                                "reusedAt" : nowDate
                            }
                            lic.reuseData.push(reuseData)
                            lic.markModified('reuseData')
                            response = lic.hash + '||||'
                                        + enc_user_num + '||||'
                                        + enc_exp_date + '||||'
                                        + enc_organization_id + '||||'
                                        + lic.orgname + '||||'
                                        + lic.first_name + '||||'
                                        + lic.last_name + '||||'
                                        + lic.email + '||||'
                                        + DEFAULTUSERROLE + '||||'
                                        + DEFAULTUSERPASSWORD + '||||'
                                        + phone + '||||'
                                        + lic.orgid
                        }
                        else if(reqSource == 'application'){


                            /**
                         * encypt aes-128-ebc for |||| separated params except hash and organization name
                         * 
                         *  hash||||no_of_licensed_users||||expiry_date||||organizationid||||organizationName
                         */
    
                        var cipher = crypto.createCipher('aes-128-ecb',clientMac)
                        
                        /**no_of_licensed_users */
                        var enc_user_num = cipher.update(lic.userLimit.toString(),'utf-8','hex')
                        enc_user_num += cipher.final('hex')
    
                        /**expiry_date */
                        cipher = crypto.createCipher('aes-128-ecb',clientMac)
                         
                        var enc_exp_date = cipher.update(lic.expires.toISOString(),'utf-8','hex')
                        enc_exp_date += cipher.final('hex')
    
                        /**organizationid */
                        cipher = crypto.createCipher('aes-128-ecb',clientMac)
                        var enc_organization_id = cipher.update(orgid.toString(),'utf-8','hex')
                        enc_organization_id += cipher.final('hex')


                            var newOrgData = {
                                "orgname" : orgname,
                                "orgid" : orgid,
                                "used" : true,
                                "usedAt" : new Date(),
                                "first_name" : firstname.charAt(0).toUpperCase() + firstname.slice(1),
                                "last_name" : lastname.charAt(0).toUpperCase() + lastname.slice(1),
                                "email" : email,
                                "phone" : phone,
                                "macAsSalt" : macString,
                                "hddId" : HDDId,
                                "appVersion" : appVersion,
                                "reusedAt" : nowDate
                            }
                            lic.organizations.push(reuseData)
                            lic.markModified('organizations')
                            response = lic.hash + '||||'
                                        + enc_user_num + '||||'
                                        + enc_exp_date + '||||'
                                        + enc_organization_id + '||||'
                                        + orgname + '||||'
                                        + firstname + '||||'
                                        + lastname + '||||'
                                        + email + '||||'
                                        + DEFAULTUSERROLE + '||||'
                                        + DEFAULTUSERPASSWORD + '||||'
                                        + phone + '||||'
                                        + orgid

                        }


                        
    
                        
    
                        
                        lic.save(function(err){
                            if(err){
                                console.log(err)
                                res.status(500).send('Please try after some time.');
                                return;
                            }
                            else{
                                console.log(response)
                                res.status(200).send(response)
								if(reqSource == 'setup') sendConfirmationSMS(lic.first_name, lic.email, 'Admin@123', phone)
                            }
                        })
                    }
                    else{
                        res.status(400).send('Invalid Serial Key. Please leave empty to obtain a free trial.')
                    }
                }
                else{
                    /**Invalid serial key
                     * 
                     */
                    res.status(400).send('Invalid Serial Key. Please leave empty to obtain a free trial.')
                }
            }
            else{
                res.status(400).send('Invalid Serial Key. Please leave empty to obtain a free trial.')
            }
        })
    }


}


