var Users = require("../models/user");
var mongoose = require("mongoose");
var passport = require("passport");
var bcrypt = require("bcrypt");

exports.create = function (req, res) {
  var user = {
    username: req.body.name,
    email: req.body.email,
    password: req.body.password,
    info: req.body.info,
    role: "user",
  };

  if (!user.email || !user.password || !user.username) {
    return res.status(400).json({ err: "All fields (email, password, username) must be sent!" }).end();
  }

  bcrypt.hash(user.password, saltRounds, function (err, hash) {
    if (err) {
      console.log("crypt err: ", err);
      return res.status(500).json({ err: err.message }).end();
    }
    user.password = hash;
    Users.User.insertMany(user, function (err, result) {
      if (err) {
        console.log(err);
        return res.status(500).json({ err: err.message }).end();
      }
      res.send(user);
    });
  });
};

exports.userPage = function (req, res) {
  res.send("User page!");
};

exports.update = function (req, res) {
  var userToUpdate = req.body.usertoupdate;

  var newData = {
    username: req.body.newusername,
    password: req.body.newpassword,
    info: req.body.info
  };

  if (!userToUpdate) {
    return res
      .status(400)
      .json({ err: "field (usertoupdate) are required" })
      .end();
  }
  Users.User.findOne({ username: userToUpdate }, function (err, user) {
    if (err) {
      return res.status(500).json({ err: err.message }).end();
    }

    if (!user) {
      return res.status(400).json({ err: "User not found" }).end();
    }

    if (newData.username) {
      user.username = newData.username;
    }
    if (newData.password) {
      user.password = newData.password;
    }
    if (newData.info) {
      user.info = newData.info;
    }

    user.save(function (err, doc) {
      if (err) {
        return res.status(400).json({ err: err.message }).end();
      }
      return res.status(200).json({ message: "updated" }).end();
    });
  });
};
