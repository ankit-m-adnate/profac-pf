var mongoose = require( 'mongoose' );
var crypto = require('crypto');
var jwt = require('jsonwebtoken');

var userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique : true
  },
  active : {
    type : Boolean,
    default : true
  },
  attendanceBiometricDeviceConfig:[{
    fpsid : {type : Number},
    deviceId:{type: String}
  }],
  account_balance:{
    type : Number,
	default : 0
  },attendanceConfigurationUser :{
   mobile : {type : Number,default : 0},
   web : {type : Number,default : 0},
   biometric : {type : Number,default : 0},
  },

  name: {
    type: String,
    required: true
  },
  employee_code: {
    type : String
  },
  _imft : {
    type : Boolean,
    default : false
  },
  department : {
    type : mongoose.Schema.Types.ObjectId , ref : 'department'
  },
  organization: {
    id : {
      type : String, ref : 'organization'
    }
  },
  hash: String,
  salt: String,
  userId : {
    type : String
  },
  pFacRole : String,
  mailVerified: {
    type: String,
    default: 'N'
  },
  branch : {type : mongoose.Schema.Types.ObjectId, ref : 'branch'},
  token: {
    item: String,
    expires: Date
  },
  mobileVerified : {
    type : String,
    default : 'N'
  },
  otp : {
    code : Number,
    expires : Date,
    retries : Number
  },
  loginOTP : {
    code : Number,
    expires : Date,
    retries : Number
  },
  resetToken : {
    item: String,
    expires: Date
  },
  google : {
    id : String,
    token: String,
    name: String,
    email: String
  },
    first_name: {
    type: String,
    required: true
  },
   last_name: {
    type: String,
    required: true
  },
   job_title: {
    type: mongoose.Schema.Types.ObjectId,ref : 'jobtitle'
  },
  joining_date : {
    type : Date
  },
  employee_type : {
    type: String
  },
  employee_status : {
    type: String
  },
  reporting_to : {
    type : mongoose.Schema.Types.ObjectId, ref : 'User'
  }, crm_reporting_to : {
    type : mongoose.Schema.Types.ObjectId, ref : 'User'
  },
  hr_manager : {
    type : mongoose.Schema.Types.ObjectId, ref : 'User'
  },
  job_grade : {
    type : mongoose.Schema.Types.ObjectId, ref : 'grade'
  },
salary_structure : {
    type : mongoose.Schema.Types.ObjectId, ref : 'payroll_structure'
  },
  bio  : {
    type : String
  },
  leaving_reason:{
    type:String
  },
  resignation : {
    type : Date
  },
  notice_period:{
    type : Number
  },
  tentative_date:{
    type : Date
  },
  remarks:{
    type:String
  },
  manager_remarks:{
    type:String
  },
  final_date:{
    type : Date
  },
  skill_set : [{ type : String }],
  projects : [{
    title : String,
    start_date : Date,
    end_date : Date,
    members : [],
    description : String,
    responsibilities : String,
    technologies : [{type : String}]
   }],
   employment_history : [{
    company_name : String,
    start_date : Date,
    end_date : Date,
   location:String,
   designation:String,
   docPath : String
   }],
  txns : [{
    txn :  {type : mongoose.Schema.Types.ObjectId, ref: 'txns'},
    c_x : Number,
    c_y : Number,
    s_x : Number,
    s_y : Number,
    noOfHits : Number,
    favor : Boolean,
    role : String,
    active : { type : Boolean, default : true},
    _imft : {
      type : Boolean,
      default : false
    }
  }],
  userConfig : {type : Boolean, default : false},
  workingHours : {
    type : mongoose.Schema.Types.ObjectId, 
    ref : 'workinghours'
  },
  workingDays : {
    type : mongoose.Schema.Types.ObjectId , 
    ref : 'workingdays'
  },
  personal_info : {
    dob : Date,
    marital_status : String,
    mobile : Number,
    landline : String,
    gender : String,
    address : String,
    city : String,
    state : String,
    postal_code : Number,
    country : String,
    educational_details:[{
      college_name : String,
      degree : String,
      passout_year:Date,
      collegeaddress:String,
      docPath:String
    }]
  },
  documents : [{
    docType : String,
    docPath : String
  }],
  emergency_info : {
    first_name : String,
    last_name : String,
    relationship : String,
    contact : Number
  },
  bank_info : {
    bank_name : String,
    account_type : String,
    account_number : String,
    IFSC : String,
	pan_number: String,
	pf_covered : Boolean,
	pf_uan : Number,
	pf_number : String,
	pf_enrollment : Date,
	epf_number :String,
  relationship : String,
  relativename:String,
  service_period:String,
	eps_entitled : Boolean,
	esi_covered : Boolean,
	esi_number : String
  },
   trainings : [{
    _id : false,
    course : {type : mongoose.Schema.Types.ObjectId, ref : 'Training'},
    enrollment_date : Date,
    completion_date : Date,
    tracker : [{_id:false, lesson : String, start_date : Date, end_date : Date}]
  }],
  leaves : {
    type : mongoose.Schema.Types.Mixed
  },
   profile_pic:{thumbnail:String,original:String,uncropped:String}
});

userSchema.index({"email" : 1, "organization.id" : 1, "employee_code" : 1});

userSchema.methods.setPassword = function(password){
  this.salt = crypto.randomBytes(16).toString('hex');
  this.hash = crypto.pbkdf2Sync(password, this.salt, 1000, 64).toString('hex');
};

userSchema.methods.validPassword = function(password) {
  var hash = crypto.pbkdf2Sync(password, this.salt, 1000, 64).toString('hex');
  return this.hash === hash;
};

userSchema.methods.generateJwt = function() {
  var expiry = new Date();
  expiry.setDate(expiry.getDate() + 7);

  return jwt.sign({
    _id: this._id,
    email: this.email,
    name: this.name,
    _orgName : this.organization.id.name,
    _orgId : this.organization.id._id,
    pf_imft : this._imft,
    fn : this.first_name,
    ln : this.last_name,
    _pfr : this.pFacRole,
    exp: parseInt(expiry.getTime() / 1000),
  }, "MY_SECRET"); // DO NOT KEEP YOUR SECRET IN THE CODE!
};


userSchema.methods.generateMJwt = function(role, app, _imft, isModReg,expireAt) {
	//console.log('mjwt');
  var expiry = new Date();
  var jobTitleName = (this.job_title == null ) ? '' : this.job_title.name; 
  expiry.setDate(expiry.getDate() + 7);
  //console.log("Generating MJWT for app", app, "and role", role, " userid: ", this._id, " name:: ", this.name);
  return jwt.sign({
    _id: this._id,
    email: this.email,
    name: this.name,
    fn : this.first_name,
    ln : this.last_name,
    _orgName : this.organization.id.name,
    _orgId : this.organization.id._id,
    _orgLogo : this.organization.id.logo,
    _r : role,
    _a : app,
	_profilepic:this.profile_pic,
    _imft : _imft,
    _b : this.branch,
    _dsgn : jobTitleName,
    _imr: isModReg,
    _expireAt: expireAt,
    exp: parseInt(expiry.getTime() / 1000),
  }, "MY_SECRET"); // DO NOT KEEP YOUR SECRET IN THE CODE!
};



module.exports = mongoose.model('User', userSchema);
