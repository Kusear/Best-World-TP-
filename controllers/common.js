const Users = require("../models/user_model").User;
const mongoose = require("mongoose");
const Grid = require("gridfs-stream");
const mongodb = require("mongodb");
const bcrypt = require("bcrypt");
const nodemailer = require("../config/nodemailer");
const slugify = require("slugify");

exports.login = async function (req, res) {
  // req.body.email
  // req.body.password

  await Users.findOne({ email: req.body.email }, async function (err, user) {
    var isAuthenticated =
      user &&
      (bcrypt.compare(req.body.password, user.password) ||
        req.body.password === user.password);
    if (!isAuthenticated) {
      return res.status(510).json({ err: "Не авторизован" }).end();
    }
    if (user.emailConfirm) {
      return res
        .status(200)
        .json({
          _id: user._id,
          username: user.username,
          role: user.role,
          emailConfirm: user.emailConfirm,
          token: user.getToken(),
        })
        .end();
    } else {
      return res.status(500).json({ emailConfirm: user.emailConfirm }).end();
    }
  });
};

exports.logout = function (req, res) {
  req.logOut();
  res.status(200).json("logout completed").end();
};

exports.registration = async function (req, res) {
  try {
    var newUser = await new Users({
      username: req.body.username,
      email: req.body.email,
      password: req.body.password,
      image: req.body.filename,
    }).save();

    var mailAuthMessage = {
      to: newUser.email,
      subject: "Test message",
      html:
        "<h1>Test message</h1>" +
        "<br>Bruh</br>" +
        "<div><a href =" +
        process.env.CONFIRM_URL +
        newUser.id +
        ">Verify email</a></div>",
    };
    nodemailer.transport.sendMail(mailAuthMessage, function (error, resp) {
      if (error) {
        console.log(error);
      } else {
        console.log(resp);
      }
      nodemailer.transport.close();
    });

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
      return res
        .status(500)
        .json({ err: "Пользователь уже зарегистрирован" })
        .end();
    }
    return res.status(520).json({ err: err.message }).end();
  }
};

exports.emailAuth = async function (req, res) {
  Users.findById(mongoose.Types.ObjectId(req.body.id), (err, user) => {
    if (err) {
      return res.status(520).json({ err: err.message }).end();
    }
    if (!user) {
      return res.status(500).json("User not found").end();
    }
    user.emailConfirm = true;
    user.save((err) => {
      if (err) {
        return res.status(520).json({ err: err.message }).end();
      }
      return res.status(200).json("Email confirmed").end();
    });
  });
};

exports.saveFiles = async function (req, res) {
  var gfs = new mongodb.GridFSBucket(mongoose.connection.db, mongoose.mongo);

  var filenameSlug =
    (await slugify(req.query.filename, {
      replacement: "-",
      remove: undefined,
      lower: false,
      strict: false,
      locale: "ru",
    })) +
    "-" +
    req.query.userID;

  var image = {
    image: filenameSlug,
  };

  var user = await Users.findById(req.query.userID, (err) => {
    if (err) {
      return res.status(500).json({ err: err.message }).end();
    }
  });

  var file = gfs.find(
    { filename: user.image },
    { contentType: req.query.contentType }
  );

  if (file) {
    file.forEach((element) => {
      gfs.delete(element._id);
      console.log(element.filename);
    });
  }

  await Users.findByIdAndUpdate(
    req.query.userID,
    image,
    { new: true },
    (err) => {
      if (err) {
        return res.status(500).json({ err: err.message }).end();
      }
    }
  );

  req.pipe(
    gfs
      .openUploadStream(filenameSlug, { contentType: req.query.contentType })
      .on("close", function (savedFile) {
        console.log("file saved", savedFile);
        return res.json({ file: savedFile, status: "saved" });
      })
  );
};

exports.getFiles = async function (req, res) {
  var gfs = new mongodb.GridFSBucket(mongoose.connection.db, mongoose.mongo);

  gfs
    .openDownloadStreamByName(req.body.filename)
    .on("error", function (err) {
      res.send("No image found with that title");
    })
    .pipe(res);
};
