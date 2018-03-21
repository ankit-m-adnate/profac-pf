var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var mongoose = require('mongoose');
var User = mongoose.model('User');

// used to serialize the user for the session
passport.serializeUser(function(user, done) {
    done(null, user.id);
});

// used to deserialize the user
passport.deserializeUser(function(id, done) {
    User.findById(id, function(err, user) {
        done(err, user);
    });
});

passport.use(new LocalStrategy({
    usernameField: 'email'
  },
  function(username, password, done) {
    User.findOne({ email: new RegExp('^'+username+'$', "i") }).populate('txns.txn').populate({path : 'organization.id', populate : {path : 'plans'}}).exec(function (err, user) {
      if (err) { return done(err); }
      // Return if user not found in database
      if (!user) {
        return done(null, false, {
          message: 'User not found'
        });
      }
      // Return if password is wrong
      if (!user.validPassword(password)) {
        return done(null, false, {
          message: 'Password is wrong'
        });
      }
      // Return if user is not verified
      if (user.mailVerified !== 'Y') {
        return done(null, false, {
          message: 'You are not verified yet'
        });
      }
      // Return if user is not active
      if (user.active === false) {
        return done(null, false, {
          message: 'Your account has been deactivated.'
        });
      }
      // If credentials are correct, return the user object
      return done(null, user);
    });
  }
));
