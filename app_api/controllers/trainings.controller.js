var ctrlAuth = require('../controllers/authentication');
var Users = require('../models/users')
var Trainings = require('../models/trainings.model')
var mongoose = require( 'mongoose' );
var _ = require('underscore')
module.exports.enrollTrainingCourse = function(req, res){
	try {
		if(req.body.course=='' || req.body.course==undefined || req.body.course==null){
			res.status(400).json({"message" : "Invalid Request"});
		}
		else{
			ctrlAuth.verifyJwtToken(req.body.token).then(function(resp){

				Trainings.updateOne(
					{ "_id" : mongoose.Types.ObjectId ( req.body.course ) },
					{ $inc: { total_enrolled : 1 } },
					function( err, enroll ){
						if(err){
							console.log("err:-");
							console.log(err);
							res.status(500).json({"error" : err});
							return err;
						}
						if(enroll.n==1 && enroll.nModified==1 && enroll.ok==1){
							console.log("enroll:-");
							console.log(enroll);	
							
							Users.findOne({"email" : resp.email}, function(err, user){
								if(err){
									Trainings.updateOne({"_id":mongoose.Types.ObjectId(req.body.course)},
										{$inc:{total_enrolled:-1}},
										function(err,rollback_enroll){
											if(err){
												/*Trainings.updateOne({"_id":mongoose.Types.ObjectId(req.body.course)},
													{$inc:{total_enrolled:-1}},
													function(err, rollback_enroll){
														if(err){
															res.status(400).json({"message" : "Service failed"});
														}
														else if(rollback_enroll.n==1 && rollback_enroll.nModified==1 && rollback_enroll.ok==1){
															res.status(200).json({"message" : "Invalid Request"});
														}
														else{
															res.status(400).json({"message" : "Invalid Request"});
														}
													})*/
													res.status(400).json({"message" : "Service failed"});
												
											}
											else if(rollback_enroll.n==1 && rollback_enroll.nModified==1 && rollback_enroll.ok==1){
												res.status(200).json({"message" : "Service failed/rollback"});
											}
											else{
												res.status(400).json({"message" : "Service failed"});
											}

										})
									
								}

								if(user){
									console.log("course:"+req.body.course);
									console.log(user.trainings);
									var alreadyEnrolled=false;
									//var obj=_.findWhere(user.trainings, {"course" : mongoose.Types.ObjectId(req.body.course)});
									for(var h=0;h<user.trainings.length;h++)
										if(user.trainings[h].course==req.body.course)
											alreadyEnrolled=true;
									console.log("------------------------");
									console.log(alreadyEnrolled);
						
									/*if(_.findWhere(user.trainings, {"course" : mongoose.Types.ObjectId(req.body.course)})){

										res.status(200).json({"message" : "already enrolled"});
									}*/
									if(alreadyEnrolled){
										res.status(200).json({"message" : "already enrolled"});
									}
									else{
										user.trainings.push({
											"course" : req.body.course,
											"enrollment_date" : new Date(req.body.enrollment_date)
										});
										user.save(function(err){
											if(err){
												console.error(err);
												return err;
											}
											res.status(200).json({"message" : "OK"});
										});
									}
								}
								else{	
									Trainings.updateOne({"_id":mongoose.Types.ObjectId(req.body.course)},
										{$inc:{total_enrolled:-1}},
										function(err, rollback_enroll){
											if(err){
												res.status(400).json({"message" : "Service failed"});
											}
											else if(rollback_enroll.n==1 && rollback_enroll.nModified==1 && rollback_enroll.ok==1){
												res.status(400).json({"message" : "Service failed/rollback"});
											}
											else{
												res.status(400).json({"message" : "Service failed"});
												}
										})
									
								}
							});
						}
						else{
							res.status(500).json({"message":"Service failed!"})
						}
						/*else{	//if not enrolled 
							Trainings.updateOne({"_id":mongoose.Types.ObjectId(req.body.course)},
										{$inc:{total_enrolled:-1}},
										function(err, rollback_enroll){
											if(err){
												res.status(400).json({"message" : "Service failed"});
											}
											else if(rollback_enroll.n==1 && rollback_enroll.nModified==1 && rollback_enroll.ok==1){
												res.status(400).json({"message" : "Service failed/rollback"});
											}
											else{
												res.status(400).json({"message" : "Service failed"});
												}
										})
						}*/
					}
				);
			}, function(err){
				console.error(err);
				res.status(500).json({"error" : err});
			});
		}
	} catch (e) {
		console.error(e);
	} finally {

	}
}

module.exports.userTrainings = function(req, res){
	try {
		ctrlAuth.verifyJwtToken(req.params.access_token).then(function(resp){
			Users.findOne({"email" : resp.email, "organization.id" : req.params.org}, {_id : 0, trainings : 1})
			.populate('trainings.course')
			.exec(function(err, user){
				if(err){
					console.error(err);
					res.status(500).json({"error" : err});
					return err;
				}
				if(user){
					console.error(user);
					res.status(200).send(user);
				}
			});
		}, function(err){
			console.error(err);
			res.status(500).json({"error" : err});
		});
	} catch (e) {
		console.error(e);
	} finally {

	}
}

module.exports.endLesson = function (req,res)
{
	try
	{
//created by Shrikrishna

/*Users.aggregate(
{$match : {"organization.id" : req.body.o,"email":req.body.e}},
{$lookup:{from: "trainings", localField:"trainings.course",foreignField:"id",as:"courses"}},
{ $project : 
	{
		_id : 1 , 
		"trainings":1,
	    "trainingcourses": {
	            $filter: {
	               input: "$courses",
	               as: "data",
	               cond: { $eq: [ "$$data._id", mongoose.Types.ObjectId(req.body.c) ] }
	            }
	    },
	    "usercourses": {
	            $filter: {
	               input: "$trainings",
	               as: "data",
	               cond: { $eq: [ "$$data.course",  mongoose.Types.ObjectId(req.body.c) ] }
	            }
	    }
    }
},
{ $unwind : "$trainingcourses"},
{ $unwind : "$usercourses"},
{ $project : 
	{
	    _id:0,
	    user:"$_id",
		course:"$trainingcourses",
		trainings:1,
		lessonsDone:{ $size: "$usercourses.tracker"},
		totalLessons:{ $size: "$trainingcourses.task_list"}
    }
},
{$project:
	{
	    _id:0,
	    user:1,
	     course:1,
	    trainings:1,
	    lessonsDone:1,
	    totalLessons:1,
	   // lastLessonFlag : {$subtract:["$totalLessons",1]},
	   lastLessonFlag : "$lessonsDone",
	    isCompleted:{$eq:[
	                         "$lessonsDone",
	                         "$totalLessons"
	    ]}
	}
},
{$project:
	{
	    _id:0,
	    user:1,
	    course:1,
	    trainings:1,
	    isCompleted:{$eq:[
	                         "$lessonsDone",
	                         "$totalLessons"
	    ]},
	    isLastLesson:{$eq:[
	                         "$lessonsDone",
	                         "$lastLessonFlag"
	   	]}
	}
}
)*/
Users.aggregate(
{$match : {"organization.id" : req.body.o,"email":req.body.e}},
{$lookup:{from: "trainings", localField:"trainings.course",foreignField:"id",as:"courses"}},
{ $project : 
	{
		_id : 1 , 
		"trainings":1,
	    "trainingcourses": {
	            $filter: {
	               input: "$courses",
	               as: "data",
	               cond: { $eq: [ "$$data._id", mongoose.Types.ObjectId(req.body.c) ] }
	            }
	    },
	    "usercourses": {
	            $filter: {
	               input: "$trainings",
	               as: "data",
	               cond: { $eq: [ "$$data.course",  mongoose.Types.ObjectId(req.body.c) ] }
	            }
	    }
    }
},
{ $unwind : "$trainingcourses"},
{ $unwind : "$usercourses"},
{ $project : 
	{
	    _id:0,
	    user:"$_id",
		course:"$trainingcourses",
		trainings:1,
		lessonsStartCount:{ $size: "$usercourses.tracker"},
              	totalLessons:{ $size: "$trainingcourses.task_list"},
                lessonsEnded: "$trainings.tracker.end_date"
    }
},
{$unwind:"$lessonsEnded"},
{$project:
	{
	    _id:0,
	    user:1,
	    course:"$course._id",
	    trainings:1,
	    lessonsStartCount:1,
	    totalLessons:1,
            lessonsCompleteCount:{$size:"$lessonsEnded"},
	    isCompleted:{$eq:[
	                         {$size:"$lessonsEnded"},
	                         "$totalLessons"
	    ]}
	}
},
{$project:
	{
	    _id:0,
	    user:1,
	    course:1,
	    trainings:1,
	 //   lessonsStartCount:1,
	 //   totalLessons:1,
         //   lessonsCompleteCount:1,
	    isCompleted:1,
	    isLastLesson:{
                $and:[
                    {$eq:[
	                         "$lessonsStartCount",
	                         "$totalLessons"
                    ]},
                     {$eq:["$isCompleted",false]}
                ]
            }
	}
}
)
.
exec(function(err,result){
	if(err)
	{
		console.log(result);
		res.status(500).json({"message":"service failed"});
	}	
	else{
		console.log('check result :'+JSON.stringify(result));
		console.log("abcd:"+result[0].isLastLesson);
		if(result[0].isLastLesson==false)
		{
			console.log("result:");
			var flag=false;
			for(i=0;i<result[0].trainings.length;i++)
			{
				console.log(result[0].trainings[i].course);
				if(result[0].trainings[i].course==req.body.c)
				{
					console.log(result[0].trainings[i].tracker);
					for(j=result[0].trainings[i].tracker.length-1;j>=0;j--)
					{
						if(result[0].trainings[i].tracker[j].lesson==req.body.l && !result[0].trainings[i].tracker[j].end_date)
						{
							result[0].trainings[i].tracker[j].end_date = new Date(req.body.d);
							//result[0].trainings[i].completion_date = new Date(req.body.d);
							var flag=true;
							var userTrainings=result[0].trainings;
							console.log("userTrainingJson: "+userTrainings);					
							break;
						}
					}
					break;
				}
			}
			if(flag)
			{
				Users.findOneAndUpdate({"organization.id" : req.body.o,"email":req.body.e},{"trainings":userTrainings},
					function(err, result1){
						if(err){
							console.log(err);
							res.status(500).json({"message" : "service failed"});
						}
						else{
							console.log(result1);
							res.status(200).json({"message":"ended successfully"});
						}

					}
				)
			}
			else
				res.status(400).json({"message":"Invalid course/lesson"});
		}
		else if(result[0].isLastLesson){
			console.log("result:");
			var flag1=false;
			var flag2=false;
			for(i=0;i<result[0].trainings.length;i++)
			{
				console.log(result[0].trainings[i].course);
				console.log(req.body.c);
				if(result[0].trainings[i].course==req.body.c)
				{
					console.log("true");
					for(j=result[0].trainings[i].tracker.length-1;j>=0;j--)
					{
						console.log(result[0].trainings[i].tracker[j]);
						console.log(req.body.l);
						if(result[0].trainings[i].tracker[j].lesson==req.body.l)
						{
							if(!result[0].trainings[i].tracker[j].end_date)
							{	console.log("1234:");
							result[0].trainings[i].tracker[j].end_date = new Date(req.body.d);
							result[0].trainings[i].completion_date = new Date(req.body.d);
							flag1=true;
							var userTrainings=result[0].trainings;
							console.log("userTrainingJson: "+userTrainings);					
							break;
							}
							else{
								flag2=true;
								break;
							}
						}
					}
					break;
				}
			}
			if(flag2){
				res.status(400).json({"message":"lesson already completed"});
			}
			else if(flag1)
			{
				Trainings.updateOne({ "_id" : mongoose.Types.ObjectId ( req.body.c ) },
						{ $inc: { total_completed : 1 } },
						function( err, complete1 ){
							if(err){
								console.log("err:-");
								res.status(500).json({"message" : "service failed"});
							}
							if(complete1.n==1 && complete1.nModified==1 && complete1.ok==1){
								console.log("complete1:-");
								console.log(complete1);
								Users.findOneAndUpdate({"organization.id" : req.body.o,"email":req.body.e},{"trainings":userTrainings},
									function(err, result2){
										if(err){
											console.log("err:-");
											Trainings.updateOne({ "_id" : mongoose.Types.ObjectId ( req.body.c ) },
											{ $inc: { total_completed : -1 } },
											function( err, complete2 ){
												if(err){
													console.log("err:-");
													res.status(500).json({"message" : "service failed|rollback failed"});
												}
												if(complete2.n==1 && complete2.nModified==1 && complete2.ok==1){
													res.status(500).json({"message" : "service failed|rollback successful"});
												}	
												else{
													res.status(500).json({"message": "service failed|rollback failed"});
												}
											});
										}
										else{
											console.log(result2);
											res.status(200).json({"message":"ended successfully"});
										}

									}
								)
							}
							else{
								res.status(400).json({"message" : "Invalid course"});
							}
						}
				);
			}
			else{
				res.status(400).json({"message":"Invalid course/lesson"});
			}
		}
		else{
			res.status(400).json({"message":"Invalid course/lesson"});
		}
	}
})

	} catch (e) {
		console.error(e);
	} finally {

	}
}

module.exports.startLesson = function (req,res)
{
	Users.findOne({"email" : req.body.e, "organization.id" : req.body.o, "trainings.course" : req.body.c},{trainings : 1}//,
	//	{ $addToSet : { "trainings.$.tracker" : {"lesson": req.body.l, "start_date":new Date(req.body.d) }}},
	//	{ projection : {trainings : 1} 
	)
		.populate({path : 'trainings.course', select : '_id task_list'})
	.exec(function(err, training){
		if(err){
			console.log("err:-");
			console.error(err);
			res.status(500).json({
				"message" : "Service failed"
			});
		}
		else
		{
			//console.log("training:-");
			//console.log(training.trainings);
			var index=undefined;
			for(var k=0;k<training.trainings.length;k++)
			{	//index=undefined;
				//console.log("ttl"+training.trainings.length);
				if(String(training.trainings[k].course._id)==String(req.body.c))
				{	//console.log("helloold"+k);
					for(var l=0;l<training.trainings[k].course.task_list.length;l++)
					{
						//console.log("helloold");
						//console.log(training.trainings[k].course.task_list[l]._id);
				//console.log("lesson:"+training.trainings[k].course.task_list[l]._id);
				//console.log("req lessson:"+req.body.l);
						if(String(training.trainings[k].course.task_list[l]._id)==String(req.body.l))
						{
							//console.log("hello");
							index=l;
							//console.log("ind:-"+index);
							break;		
						}
						//console.log("l:"+l);
					}
					if(index)
						break;
					//console.log("k:"+k);
				}
			}
			//console.log("index:"+index);
            var currentLesson=parseInt(index);
			var indexfromui=parseInt(index)-parseInt(1);
			//console.log("currentLesson: "+currentLesson);
			//console.log("indexfromui: "+indexfromui);
			for(var i=0;i<training.trainings.length;i++)
			{
				var course=true;
				var status=true;
				if(String(training.trainings[i].course._id)==String(req.body.c) )
				{
					console.log("matched"+training.trainings[i].tracker.length);
					var flag = true;
				
					if(training.trainings[i].tracker.length>0 && flag)
					{
						console.log("matched"+parseInt(index));
						if(parseInt(index)>0)
						{
							console.log("matchedasdfsfd"+parseInt(index));
							var tracker_length=parseInt(training.trainings[i].tracker.length);
							console.log(tracker_length);
							console.log("338"+currentLesson);
							if(tracker_length==currentLesson && indexfromui!=-1)
							{
								console.log(training.trainings[i].tracker[indexfromui].end_date);
								if(training.trainings[i].tracker[indexfromui] && training.trainings[i].tracker[indexfromui].end_date)
								{
									if( training.trainings[i].tracker[currentLesson]==undefined)
									{
                        				training.trainings[i].tracker.push({"lesson":req.body.l,"start_date":new Date(req.body.d)});
										training.save(function(err){
										    if(err){
										     	res.status(500).json({
													"message" : "Service failed"
												});
										    }
										    else{
												res.status(200).json({"message" : "lesson started"});
										    }
										});
										return;
									}
									else
									{
										if(training.trainings[i].tracker[currentLesson].end_date)
										{
											res.status(200).json({"message" : "lesson already completed"});
											return;
										}
										else
										{
											res.status(200).json({"message" : "lesson already started!"});
											return;
										}
									
									}
								}
								else
								{
                      				res.status(200).json({"message" : "first complete started lesson"});
									return;
								}
							}
							else
							{
								if(tracker_length>currentLesson)
								{
									if(training.trainings[i].tracker[currentLesson].start_date && !training.trainings[i].tracker[currentLesson].end_date)
									{
										res.status(200).json({"message" : "Lesson Already started"});
									}
									else
									{
										res.status(200).json({"message" : "Lesson Already completed"});
									}
								}
								else
								{
									  res.status(200).json({"message" : "Start by Sequence"});
								}
							}
						}
						console.log('inside if if if'+training.trainings[i].tracker);
					}
					if(index==0)
					{
						if(training.trainings[i].tracker.length==0)
						{
							training.trainings[i].tracker.push({"lesson":req.body.l,"start_date":new Date(req.body.d)});
							training.save(function(err){
							    if(err){
							     	res.status(500).json({
										"message" : "Service failed"
									});
					    		}
							    else{
									res.status(200).json({"message" : "lesson started"});
							    }
							});
							console.log("tracker length 0");
							return;
						}
						else{
							res.status(200).json({"message" : "lesson already completed"});
						}
					}
					else{
						console.log("tracker length 0 line no 270");
						res.status(200).json({"message" : "lesson not started"});
						return;
					}
				}	
				else{
					console.log("course not enrolled");
					var course=false;
				}				
			}
		}
		if(!course){}
		//	res.status(200).json({"message" : "course not matched!"});
		//else if(!flag)
		//	res.status(200).json({"message" : "lesson already started!"});
		//else if(!status)
		//	res.status(200).json({"message" : "first complete started lesson!"});
		else{
			// training.save(function(err){
			//     if(err){
			//      	res.status(500).json({
			// 			"message" : "Service failed"
			// 		});
			//     }
			//     else{
			// 		res.status(200).json({"message" : "lesson started"});
			//     }
			// });
		}
	});	
}
