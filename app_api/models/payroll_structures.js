var mongoose = require( 'mongoose' );


var payroll_structureSchema = new mongoose.Schema({
	
details : [{
    group : String,
    component : String,
    calctype : String,
    value : Number,
	valuenum :Number,
    name : String,
	annual : Number,
	monthly : Number
   }],
ctc_annual:Number,
Monthlysalary:Number,   
name:String,
organization : {type : String , ref : 'organization'},
creation_date:Date,
active:{
	type : Boolean,
    default : true
},
salary_template : {type: mongoose.Schema.Types.ObjectId, ref: 'payroll_template'},
employee : { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
})
  
module.exports = mongoose.model('payroll_structure', payroll_structureSchema);
