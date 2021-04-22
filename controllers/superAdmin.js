var Users = require("../models/user");
var mongoose = require("mongoose");
//var passport = require("passport");
var bcrypt = require("bcrypt");

exports.superAdminPage = function (req, res) {
  res.send("Sup page!");
};

exports.updateUsers = function (req, res) {
  var userToUpdate = req.body.userIdToUpdate;

  var newData = {
    username: req.body.newusername,
    email: req.body.newemail,
    onPreModerate: req.body.onPreModerate,
    role: req.body.newrole,
    info: req.body.newinfo,
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
    if (newData.email) {
      user.email = newData.email;
    }
    if (newData.role) {
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
