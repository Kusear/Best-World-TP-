var Users = require("../models/user");
var mongoose = require("mongoose");
//var passport = require("passport");
var bcrypt = require("bcrypt");

exports.adminPage = function (req, res) {
  res.send("admin page!");
};

exports.adminUpdateUsers = function (req, res) {
  var userToUpdate = req.body.usertoupdate;
  //var userName = req.body.username;
  var password = req.body.password;
  //var newRole = req.body.newrole;

  var newData = {
    username: req.body.username,
    password: req.body.password,
    info: req.body.info,
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
      user.role = newData.role;
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
