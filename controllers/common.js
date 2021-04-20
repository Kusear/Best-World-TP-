var passport = require("passport");
var bcrypt = require("bcrypt");
var Users = require("../models/user");
var mongoose = require("mongoose");
var Grid = require("gridfs-stream");
var nodemailer = require("../config/nodemailer");

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

      console.log("is authenticated?: " + req.isAuthenticated());

      if (user.role === "superadmin") {
        return res.redirect("/api/superAdmin");
      }
      if (user.role === "admin") {
        return res.redirect("/api/admin");
      }
      return res.redirect("/api/user");
    });
  })(req, res, next);
};

exports.logout = function (req, res) {
  req.logOut();
  res.status(200).json("logout completed").end();
};

exports.registration = function (req, res) {
  Users.User.findOne({ email: req.body.email }, function (err, user) {
    if (err) {
      return done(err);
    }
    if (user) {
      return res.status(400).json("User already exist").end();
    }
  });

  /*
    возможно добавить проверку на уникальность username
  */

  var newUser = {
    username: req.body.username,
    email: req.body.email,
    password: req.body.password,
    info: req.body.info,
    role: "user",
  };

  if (!newUser.email || !newUser.password || !newUser.username) {
    return res
      .status(400)
      .json({ err: "All fields (email, password, username) must be sent!" })
      .end();
  }

  /* nodemailer.mailAuthMessage.to = newUser.email;
  nodemailer.transport.sendMail(
    nodemailer.mailAuthMessage,
    function (err, info) {
      if (err) {
        return console.log("ERROR send email: ", err.message);
      }
      console.log("Message send: ", info.messageId);
      console.log("Preview URL: ", nodemailer.getTestMessageUrl(info));
    }
  );*/

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
      return res.status(200).json("success").end();
    });
  });
};

exports.emailAuth = function (req, res) {
  res.send("<h1>Completed</h1>");
};

exports.saveFiles = function (req, res) {
  var gfs = Grid(mongoose.connection.db, mongoose.mongo);

  console.log("req.body: ", req.body);
  console.log("req.params: ", req.query);

  req.pipe(
    gfs
      .createWriteStream({
        filename: req.query.filename,
      })
      .on("close", function (savedFile) {
        console.log("file saved", savedFile);
        return res.json({ file: savedFile });
      })
  );
};

exports.getFiles = function (req, res) {
  var gfs = Grid(mongoose.connection.db, mongoose.mongo);

  gfs
    .createReadStream({ filename: req.body.filename })
    .on("error", function (err) {
      res.send("No image found with that title");
    })
    .pipe(res);
};
