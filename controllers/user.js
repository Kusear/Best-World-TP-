var Users = require("../models/user");
var mongoose = require("mongoose");
var passport = require("passport");

exports.userPage = function (req, res) {
  res.send("User page!");
};

exports.update = function (req, res) {
  var userToUpdate = req.session.passport.user;

  if (!userToUpdate) {
    return res
      .status(400)
      .json({ err: "field (usertoupdate) are required" })
      .end();
  }

  var newData = {
    username: req.body.newusername,
    password: req.body.newpassword,
    info: req.body.info
  };

  Users.User.findById(userToUpdate, function (err, user) {
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
