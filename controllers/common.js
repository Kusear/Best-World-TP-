var passport = require("passport");
var bcrypt = require("bcrypt");
var Users = require("../models/user");

var saltRounds = 5;

exports.login = function (req, res, next) {
  passport.authenticate("local", function (err, user, info) {
    if (err) {
      // произошла ошибка
      return res
        .status(500)
        .json({ err: err.message + " ||bruh" })
        .end();
    }
    if (!user) {
      //пользователь не найден
      return res.status(400).json({ err: "User not found!" }).end();
    }
    req.logIn(user, function (err) {
      // пользователь найден
      if (err) {
        return next(err);
      }
      if (user.role === "admin") {
        return res.redirect("/admin");
      }
      if (user.role === "moder") {
        return res.redirect("/moder");
      }
      return res.redirect("/user");
    });
  })(req, res, next);
};

exports.logout = function (req, res) {
  req.logOut();
  res.status(200).json("logout completed").end();
};

exports.registration = function (req, res) {
  Users.User.findOne({ email: email }, function (err, user) {
    if (err) {
      return done(err);
    }
    if (user) {
      return res.status(400).json("User already exist");
    }
  });

  var newUser = {
    username: req.body.username,
    email: req.body.email,
    password: req.body.password,
    info: req.body.info,
    role: "user",
  };

  if (!newUser.email || !newUser.password || !newUser.username) {
    return res.status(400).json({ err: "All fields (email, password, username) must be sent!" }).end();
  }

  bcrypt.hash(newUser.password, saltRounds, function (err, hash) {
    if (err) {
      console.log("crypt err: ", err);
      return res.status(500).json({ err: err.message }).end();
    }
    newUser.password = hash;
    Users.User.insertMany(newUser, function (err, result) {
      if (err) {
        console.log(err);
        return res.status(500).json({ err: err.message }).end();
      }
      res.status(200).json("success").end();
    });
  });
};
