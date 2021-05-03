const Users = require("../models/user_model").User;
const mongoose = require("mongoose");
const Grid = require("gridfs-stream");
const bcrypt = require("bcrypt");
const nodemailer = require("../config/nodemailer");

/* TODO
 * доделать загрузку картинок в бд при регистрации и создание уникального имени файла
 * сделать валидацию полей в login, registration
 */

exports.login = async function (req, res) {
  await Users.findOne({ email: req.body.email }, async function (err, user) {
    var isAuthenticated =
      user &&
      ((await bcrypt.compare(req.body.password, user.password)) ||
        req.body.password === user.password);
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

exports.registration = async function (req, res) {
  try {
    var newUser = await new Users({
      username: req.body.username,
      email: req.body.email,
      password: req.body.password,
      //image: req.files[0].fieldname,
    }).save();

    // TODO изменить ссылку на front
    var mailAuthMessage = {
      to: newUser.email,
      subject: "Test message",
      html:
        "<h1>Test message</h1>" +
        "<br>Bruh</br>" +
        "<div><a href = 'https://svelteappp.herokuapp.com/emailconfirm/'" +
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
      return res.status(400).json({ err: "User already exist" }).end();
    }
    return res.status(400).json({ err: err.message }).end();
  }
};

exports.emailAuth = async function (req, res) {
  Users.findById(req.body.id, (err, user) => {
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
