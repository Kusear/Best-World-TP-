var passport = require("passport");
var LocalStrategy = require("passport-local").Strategy;
var ObjectID = require("mongodb").ObjectID;
var User = require("../models/User");
var bcrypt = require("bcrypt");

var db = require("../db");

var collName = "users";

passport.serializeUser(function (user, done) {
  console.log("Serialize: ", user);
  done(null, user.id);
});

passport.deserializeUser(function (id, done) {
  User.findById(id, function (err, user) {
    done(err, user);
  });
});

passport.use(
  new LocalStrategy(
    { usernameField: "email", passwordField: "password" },
    function (email, password, done) {
      User.findOne({ email: email }, function (err, user) {
        if (err) {
          return done(err);
        }
        if (!user) {
          return done(null, false, { message: "Incorrect username." });
        }
        if (!bcrypt.compare(password, user.password)) {
          return done(null, false, { message: "Incorrect password." });
        }
        return done(null, user);
      });
    }
  )
);
