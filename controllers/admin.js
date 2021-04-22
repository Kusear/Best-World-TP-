var Users = require("../models/user").User;
var mongoose = require("mongoose");
var Projects = require("../models/project").Project;
//var passport = require("passport");
// var bcrypt = require("bcrypt");

exports.adminPage = function (req, res) {
  res.send("admin page!");
};

exports.updateUser = async function (req, res) {
  var userToUpdate = req.body.userToUpdate;

  if (!userToUpdate) {
    return res
      .status(400)
      .json({ err: "field (usertoupdate) are required" })
      .end();
  }

  var newData = {
    username: req.body.username,
    email: req.body.email,
    onPreModerate: req.body.onPreModerate,
    info: req.body.info,
  };

  await Users.findOne({ username: userToUpdate }, async function (err, user) {
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
    if (newData.onPreModerate) {
      user.onPreModerate = newData.onPreModerate;
    }
    if (newData.info) {
      user.info = newData.info;
    }

    await user.update(function (err, doc) {
      if (err) {
        return res.status(400).json({ err: err.message }).end();
      }
      return res.status(200).json({ message: "updated" }).end();
    });
  });
};

exports.getProjectsOnPreModerate = async function (req, res) {
  await Projects.find({ onPreModerate: true }, function (err, result) {
    if (err) {
      return res.status(400).json({ err: err.message }).end();
    }
    return res.status(200).json(result).end();
  });
};

exports.getUsersOnPreModerate = async function (req, res) {
  await Users.find({ onPreModerate: true }, function (err, result) {
    if (err) {
      return res.status(400).json({ err: err.message }).end();
    }
    return res.status(200).json(result).end();
  });
};
