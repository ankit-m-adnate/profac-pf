var mongoose = require( 'mongoose' );


var organizationSchema = new mongoose.Schema({
  _id: {
    type: String,
   unique: true,
  required: true
    },
  customer_id : {type: Number},
  branches:[{type: mongoose.Schema.Types.ObjectId, ref: 'branch'}],
  registered_office: String,
  registered_location: String,
  registeration_code: String,
  reminder_duration: Number,
  name : {type: String},
  createdOn : {type : Date},
  plans:[{type: mongoose.Schema.Types.ObjectId, ref: 'plans'}],
  company_email:{id:{type:String},
                 password:{type:String}
                 },
  recruitment_rating_keys:[{type:String}],
  logo:{type:String},
    contact : {
  code : Number,
  number : Number
},leaveReminderConfig:{
weekly:{type:Boolean,default:true},
day:{type:Number,default:5},
time:{type:String}
},
  designations:[{type: mongoose.Schema.Types.ObjectId, ref: 'jobtitle'}],
  shifts:[{type: mongoose.Schema.Types.ObjectId, ref: 'workinghours'}],
  workdays:[{type: mongoose.Schema.Types.ObjectId, ref: 'workingdays'}],
  departments:[{type: mongoose.Schema.Types.ObjectId, ref: 'department'}],
  attendancePolicy : {type : Number, default : 0},
attendanceConfiguration :{
   mobile : {type : Number,default : 0},
   web : {type : Number,default : 0},
   biometric : {type : Number,default : 0},
  },
 compofflapseAfter :{
   days : {type : Number,default : 60}
  },



  documents:[{type:String}],
  description : {type : String},
  customerDesgn : {type : String},
  orgStrength : {type : String},
  sector : {type : String},
  offer_terms:[{type:String}],
  leaves_config : {
      names : [{type : String}],
      description : [{type : String}],
      min_leaves:[{type:Number}],
      max_leaves : [{type : Number}],
      max_leaves_monthly:[{type:Number}],
      carry_forward_percentage : [{type : Number}],
      carry_forward_days:[{type:Number}],
      credit_period : [{type : Number}],
      credit_amount : [{type : Number}],
      initial_quota : [{type : Number}],
      status : [{type : Boolean}],
      isCompOff : [{type : Boolean}],
      isUnpaid : [{type : Boolean}],
      isCasual : [{type : Boolean}],
      isSick:[{type:Boolean}],
      isFlexi:[{type:Boolean}],
      enableHalfDay:[{type:Boolean}],
      docRequired:[{type:Boolean}],
      docRequiredMinDays:[{type:Number}],
      futureDatesAllowed:[{type:Boolean}],
      futureDatesAllowedDays:[{type:Number}],
      pastDatesAllowed:[{type:Boolean}],
      pastDatesAllowedDays:[{type:Number}],
      maxTimesLeaveApplied:[{type:Number}],
      considerDOJ:[{type:Boolean}],
      minDateLeaveApply:[{type:Number}],
      blocked_clubs:[{type:String}],
      encashed:[{type:Boolean}]
    //sandwich_rule_days_deduction:[{type:Number}]
  }, quotation_setting : {
     Approval_level :{type : Number,default : 0}
  },
  leaves_setting : {
    compoff_factor_weekend : {type : Number},
    compoff_factor_holiday : {type : Number},
    creditleave_expiration : {type : Number},
    yearly_cycle : {type : Number},
	  cycle_duration : {type : Number},
    Approval_level :{type : Number},
    Hr_engagement :{type : String},
	  sandwich_rule:{type:Boolean},
    self_approval:{type:Boolean,default : false},
    backdated_leave:{type:Boolean},
    self_approval_jobgrade:[{type: String}],
    self_approval_designation:[{type:String}],
    flexiLeaveAllocation:{type:Boolean}
  },
  expenses_setting : [{
    level_of_approval : {type : Number},
    expense_value : {startvalue : Number,endvalue : Number},
    self_approval_jobgrade : {type : String},
    self_approval_designation : {type : String}
  }],
  payroll_setting:{
    yearly_cycle : {
      type : Number,
    default:3
  },
    professionaltax_deduction:{
      type : Boolean,
      default:true
    },
    incometax_deduction:{
      type : Boolean,
      default:true
    },
    deduct_it_months: { 
      type : Array,
      default:[0,1,2,3,4,5,6,7,8,9,10,11]
    },
    run_inactive:{
      type : Boolean,
      default:true
    },
    incentiveperiod:{
      type : String,
      default:'Half Yearly'
    },
    lop_calculations:{
      type: String,
    default:"Monthly Salary"
    },
    financial_year:{type: String}
  },
  
  expenses_config:{
	  Accountant_Engagement:{type : String,default:"0"}
  },
  rms_purpose:{type : String,default : 'personal'},
  publishing_chanel:{email:{type:String},
	               facebookpageid:{type:String},
				   twitter:{type:Boolean},
				   linkedInn:{type:Boolean}},
jobpost_email:{id:{type:String},
	               hash:{type:String},
				   salt:{type:String}
                 },
                 branch_counter:{
                  prefix : {type:String},
                  seq :{type:Number,default:0}
                  
                },
                dept_counter:{
                  prefix : {type:String},
                  seq :{type:Number,default:0},
                  
                },
                designation_counter:{
                  prefix : {type:String},
                  seq :{type:Number,default:0},
                  
                },
                WD_counter:{
                  prefix : {type:String},
                  seq :{type:Number,default:0},
                  
                },
                WH_counter:{
                  prefix : {type:String},
                  seq :{type:Number,default:0},
                  
                },
                employee_counter:{
                  prefix : {type:String},
                  seq :{type:Number,default:0},
                  
                }
})
organizationSchema.post('save', function(doc,next) {
  console.log('test+--'+doc.payroll_setting);
  if(doc.payroll_setting.financial_year==undefined)
  {
  var d = new Date();
  var year = d.getFullYear();
  var month = d.getMonth();
  var day = d.getDate();
  if(month<3)
	{
		
		
		var FinancialYear=((new Date(year - 1, month, day).getFullYear())+'-'+year);
	}
	else
	{
		
		var FinancialYear=(year+'-'+(new Date(year + 1, month, day).getFullYear()));
	}
  doc.payroll_setting.financial_year=FinancialYear;
  doc.save(function(err){
    if(err) return err;
    console.log('sucess');
    next();
  });

}
else
{
  next();
}
})
module.exports = mongoose.model('organization', organizationSchema);
