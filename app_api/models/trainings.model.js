var mongoose = require( 'mongoose' );
var crypto = require('crypto');


/*var trainingSchema = new mongoose.Schema({
  title: {
    type: String,
  },
  code : {
	  type : String
  },
  task_list :[
  { 
    caption : String,
    duration : { value:Number , unit:String },
    content_type : String,
    content_link : String
  }
  ],

  overall_duration :{
     type: Number
  }
});
*/

var trainingSchema = new mongoose.Schema({
  category: {
    type: String,
  },
  organization : {type : String,required : true},
  course_name : {
    type : String , unique: true ,  index: true
  },
  course_description : {
     type : String
  },
  Prerequisites :[{type: String}],

  //active : Boolean,
  active : { type : Boolean},
  draft : { type : Boolean},
  //draft : Boolean,


  task_list :[

  { 
    module_name : {type:String,unique: false},
    module_summary : String,
    duration : { value:Number , unit:String },
     content_type : String,
    content_data : String
   /* content:[{
      content_type : String,
      content_data : String,
      content_name : String
    }]*/
    
  }
  ],

  overall_duration :{
     type: Number
  },
  total_enrolled : {
    type : Number, default : 0
  },
  total_completed : {
    type : Number, default : 0
  },
  total_views : {
    type : Number, default : 0
  },
  published_at:{
    type : Date
  }
});

//post hook
trainingSchema.post('findOneAndUpdate',function(doc,next){
  console.log("in post hook");
    if(doc){
      console.log("result hook :",JSON.stringify(doc));
    var total_value_hrs1 = 0;
       console.log("testing :"+doc.task_list.length);
      for(var i = 0;i<doc.task_list.length;i++){
     
      var curr_value1 = doc.task_list[i].duration.value;
      var curr_unit1 =  doc.task_list[i].duration.unit;
    
     if(curr_unit1.toLowerCase() == 'days'){               //checking hours or days
       total_value_hrs1 += parseFloat(curr_value1) *24;   //if days convert to hours
     }
     if(curr_unit1.toLowerCase() == 'weeks'){
       total_value_hrs1 += parseFloat(curr_value1) *24 * 7;
     }
      if(curr_unit1.toLowerCase() == 'hours'){
       total_value_hrs1 += parseFloat(curr_value1);
     }
      if(curr_unit1.toLowerCase() == 'hour'){
       total_value_hrs1 += parseFloat(curr_value1);
     }
    }
    doc.overall_duration = total_value_hrs1;
    doc.save(function(err){
        if(err) return err;
        console.log('sucess');
        next();
      });
  }
  else
    console.log('not found');
});


module.exports = mongoose.model('Training', trainingSchema, 'trainings');













    //console.log(req);
    /*try{
    

    trainingSchema.update({},{ $set :  {overall_duration: 8}  });
    //Report.update({}, { $set: { metrics: obj }}, function(err, data){
    next();
    }
    catch(e){
      console.log(e);
    }*/

