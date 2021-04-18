var passport = require("passport");
var LocalStrategy = require("passport-local").Strategy;
var ObjectID = require("mongodb").ObjectID;
var Users = require("../models/user");
var bcrypt = require("bcrypt");

var db = require("../db");

var collName = "users";

passport.serializeUser(function (user, done) {
  console.log("Serialize: ", user);
  done(null, user.id);
});

passport.deserializeUser(function (id, done) {
  Users.User.findById(id, function (err, user) {
    console.log("Deserialize: ", user);
    done(err, user);
  });
});

passport.use(
  new LocalStrategy(
    { usernameField: "email", passwordField: "password", passReqToCallback : true },
    function (email, password, done) {
      Users.User.findOne({ email: email }, function (err, user) {
        if (err) {
          console.log("Passpor ERR: ", err);
          return done(err);
        }
        if (!user) {
          return done(null, false, { message: "Incorrect email." });
        }
        if (!bcrypt.compare(password, user.password) || password !== user.password) {
          return done(null, false, { message: "Incorrect password." });
        }
        return done(null, user, { message: password });
      });
    }
  )
);
