var mongoose = require( 'mongoose' );
var crypto = require('crypto');
var Users = require('../models/users');
var _ = require('underscore');
var Schema = mongoose.Schema;
var txnSchema = new mongoose.Schema({
  name: {
    type: String
  },
  url : {
	  type : String
  },
  imagePath: {
	  type : String
  },
  desc : {
	  type: String
  },
  category : {
	  type: String
  },
  displayName : {
    type : String
  }
});
module.exports = mongoose.model('txns', txnSchema, 'txns');


txnSchema.pre('remove', function(doc, next) {
  console.log('pre(remove');
  var _this = this;
    // Remove all the assignment docs that reference the removed person.
    //this.model('User').remove({ person: this._id }, next);
    Users.find({}, function(err, users){
      if(err){
        return err;
      }
      if(users.length > 0){
        _.each(users, function(u){
          _.each(u.txns, function(t, index){
            if((t.txn).toString() == (_this._id).toString()){
              console.log(t.txn);
              console.log(_this._id);
              console.log('========================');
              u.txns[index].remove();
              //delete t;
            }
          });
          /*u.txns = _.without(u.txns, _.findWhere(u.txns, {
            txn : mongoose.Types.ObjectId(this._id)
          }));*/
          console.log('b4 u.save');
          u.save(function(err){
            if(err){
              console.log(err);
            }
          });
          console.log('after u.save');
        });
      }
    });
});