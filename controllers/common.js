var Users = require("../models/user").User;
var mongoose = require("mongoose");
var Grid = require("gridfs-stream");
// var nodemailer = require("../config/nodemailer");

exports.login = async function (req, res) {
  // validate
  await Users.findOne({ email: req.body.email }, function (err, user) {
    var isAuthenticated = user && user.verifyPassword(req.body.password);
    if (!isAuthenticated) {
      return res.status(400).json({ err: "no auth" }).end();
    }
    return res
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

exports.registration = async function (req, res, next) {
  // validate
  try {
    var newUser = await new Users({
      username: req.body.username,
      email: req.body.email,
      password: req.body.password,
      //image: req.files[0].fieldname,
    }).save();

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
  var gfs = Grid(mongoose.connection.db, mongoose.mongo);

  gfs
    .createReadStream({ filename: req.body.filename })
    .on("error", function (err) {
      res.send("No image found with that title");
    })
    .pipe(res);
};

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
