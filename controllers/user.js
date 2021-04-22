var Users = require("../models/user").User;
var mongoose = require("mongoose");
var passport = require("passport");

exports.userData =  function (req, res, next) {
  var user =  Users.findById(rea.body.userID, function (err) {
    if (err) {
      next();
      return res.status(500).json({ err: err.message }).end();
    }
  });
  // do a multipart/form-data
  return res
    .status(200)
    .json({
      username: user.username,
      email: user.email,
      info: user.info,
      // picture
    })
    .end();
};

exports.updateUser =  function (req, res) {
  var userToUpdate = req.body.userID;

  if (!userToUpdate) {
    next();
    return res
      .status(400)
      .json({ err: "field (usertoupdate) are required" })
      .end();
  }

  var newData = {
    username: req.body.newusername,
    password: req.body.newpassword,
    info: req.body.info,
  };

   Users.findById(userToUpdate,  function (err, user) {
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

exports.deleteUser =  function (req, res, next) {
  var userToDelete = req.body.userID;
  if (!userToUpdate) {
    next();
    return res
      .status(400)
      .json({ err: "field (usertoupdate) are required" })
      .end();
  }
   Users.findById(userToDelete,  function (err, user) {
    if (err) {
      next();
      return res.status(500).json({ err: err.message }).end();
    }
    if (!user) {
      next();
      return res.status(400).json({ message: "User not found" }).end();
    }
     user.remove(function (err, doc) {
      if (err) {
        next();
        return res.status(500).json({ err: err.message }).end();
      }
      return res.status(200).json({ message: "deleted" }).end();
    });
  });
};
