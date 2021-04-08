var Users = require("../models/user");
var mongoose = require("mongoose");
//var passport = require("passport");
var bcrypt = require("bcrypt");

exports.create = function (req, res) {
  var user = {
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    info: req.body.info,
    role: req.body.role,
  };

  if (!user.email || !user.password) {
    return res.status(400).json({ err: "All fields must be sent!" }).end();
  }

  bcrypt.hash(user.password, saltRounds, function (err, hash) {
    if (err) {
      console.log("crypt err: ", err);
      return res.status(500).json({ err: err.message }).end();
    }
    user.password = hash;
    Users.insertMany(user, function (err, result) {
      if (err) {
        console.log(err);
        return res.status(500).json({ err: err.message }).end();
      }
      res.send(user);
    });
  });
};

exports.superAdminPage = function (req, res) {
  res.send("Sup page!");
};

exports.updateUsers = function (req, res) {
  var userToUpdate = req.body.usertoupdate;

  var newData = {
    username: req.body.newusername,
    email: req.body.newemail,
    password: req.body.newpassword,
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
    if (newData.password) {
      user.password = newData.password;
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
