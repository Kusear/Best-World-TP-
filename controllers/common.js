var Users = require("../models/user_model").User;
var mongoose = require("mongoose");
var Grid = require("gridfs-stream");
var bcrypt = require("bcrypt");
var nodemailer = require("../config/nodemailer");
// var sendgrid = require("../config/sendgrid");

const sgMail = require("@sendgrid/mail");

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const msg = {
  to: "kusear7@gmail.com", // Change to your recipient
  from: "momis28378@hype68.com", // Change to your verified sender
  subject: "Sending with SendGrid is Fun",
  text: "and easy to do anywhere, even with Node.js",
  html: "<strong>and easy to do anywhere, even with Node.js</strong>",
};

/* TODO
 * доделать подтверждение по email
 * доделать загрузку картинок в бд при регистрации и создание уникального имени файла
 * сделать валидацию полей в login, registration
 * уничтожение json token при logout
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

exports.emailAuth = function (req, res) {
  sgMail
    .send(msg)
    .then(() => {
      console.log("Email sent");
    })
    .catch((error) => {
      console.error(error);
    });
  //  var mailAuthMessage = {
  //     from: "kusear7@gmail.com",
  //     to: "dan-smile@mail.ru",
  //     subject: "Test message",
  //     html:
  //       "<h1>Test message</h1>" +
  //       "<br>Bruh</br>" +
  //       "<a href = 'http://localhost:3000/api/emailAuth'>Go to site</a>",
  //   };
  //   nodemailer.transport.sendMail(mailAuthMessage, function (error, resp) {
  //     if(error) {
  //       console.log(error);
  //     }
  //     else {console.log(resp);}
  //     nodemailer.transport.close();
  //   });
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
