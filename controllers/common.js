// var passport = require("passport");
var Users = require("../models/user").User;
var mongoose = require("mongoose");
var Grid = require("gridfs-stream");
var { GridFsBucket, ObjectId } = require("mongodb");
var store = require("../config/multer").storage;
// var nodemailer = require("../config/nodemailer");

exports.login = function (req, res, next) {
  // validate
  Users.findOne({ email: req.body.email }, function (err, user) {
    var isAuthenticated = user && user.verifyPassword(req.body.password);
    if (!isAuthenticated) {
      next({
        status: 400,
        message: "Wrong data",
      });
      return;
    }
    res
      .status(200)
      .json({
        _id: user._id,
        username: user.username,
        role: user.role,
        token: user.getToken(),
      })
      .end();
  });
};

exports.logout = function (req, res) {
  req.logOut();
  res.status(200).json("logout completed").end();
};

exports.registration = function (req, res, next) {
  // validate
  try {
    var newUser = new Users({
      username: req.body.username,
      email: req.body.email,
      password: req.body.password,
      image: req.files[0].fieldname,
    }).save();

    var gfs = Grid(mongoose.connection.db, mongoose.mongo);

    req.pipe(
      gfs
        .createWriteStream({
          filename: req.files[0].fieldname,
        })
        .on("close", function (savedFile) {
          console.log("file saved", savedFile);
          return res.json({ file: savedFile });
        })
    );

    res
      .status(200)
      .json({
        _id: newUser._id,
        username: newUser.username,
        role: newUser.role,
        token: newUser.getToken(),
      })
      .end();
  } catch (err) {
    if (err.code === 11000) {
      next({
        status: 400,
        message: "User already exist",
      });
    }
    next();
  }
};

exports.deleteUser = function (req, res) {
  var userToDelete = req.body.id;

  if (!userToDelete) {
    return res
      .status(400)
      .json({ err: "field (usertoupdate) are required" })
      .end();
  }

  Users.findById(userToDelete, function (err, user) {
    if (err) {
      return res.status(500).json({ err: err.message }).end();
    }

    if (!user) {
      return res.status(400).json({ err: "User not found" }).end();
    }

    user.remove(function (err, doc) {
      if (err) {
        return res.status(400).json({ err: err.message }).end();
      }
      return res.status(200).json({ message: "updated" }).end();
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
  // install multer-gridfs-storage
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
  var bucket = new GridFsBucket(store);
  var stream = bucket.openDownloadStream(new ObjectId(req.body.id));

  stream.on("error", function (err) {
    if (err) {
      return res.status(404).send("File not found");
    }
    res.status(500).send(err.message);
  });
  stream.pipe(res);
  // var gfs = Grid(mongoose.connection.db, mongoose.mongo);

  // gfs
  //   .createReadStream({ filename: req.body.filename })
  //   .on("error", function (err) {
  //     res.send("No image found with that title");
  //   })
  //   .pipe(res);
};

//  Users.findOne({ email: req.body.email }, function (err, user) {
//   if (err) {
//     return done(err);
//   }
//   if (user) {
//     return res.status(400).json("User already exist").end();
//   }
// });

// var newUser = {
//   username: req.body.username,
//   email: req.body.email,
//   password: req.body.password,
//   info: req.body.info,
//   role: "user",
// };

// if (!newUser.email || !newUser.password || !newUser.username) {
//   next({
//     status: 400,
//     message: "All fields (email, password, username) must be sent!",
//   });
//   return;
// }

//  nodemailer.mailAuthMessage.to = newUser.email;
// nodemailer.transport.sendMail(
//   nodemailer.mailAuthMessage,
//   function (err, info) {
//     if (err) {
//       return console.log("ERROR send email: ", err.message);
//     }
//     console.log("Message send: ", info.messageId);
//     console.log("Preview URL: ", nodemailer.getTestMessageUrl(info));
//   }
// );

// bcrypt.hash(newUser.password, saltRounds, function (err, hash) {
//   if (err) {
//     console.log("crypt err: ", err);
//     next({
//       status: 400,
//       message: err.message,
//     });
//     return;
//   }
//   newUser.password = hash;
//   Users.insertMany(newUser, function (err, result) {
//     if (err) {
//       console.log(err);
//       return res.status(500).json({ err: err.message }).end();
//     }
//     return res.status(200).json("success").end();
//   });
// });
