const Users = require("../models/user_model").User;
const Links = require("../models/links_model").Link;
const mongoose = require("mongoose");
const Grid = require("gridfs-stream");
const mongodb = require("mongodb");
const bcrypt = require("bcrypt");
const nodemailer = require("../config/nodemailer");
const slugify = require("slugify");

exports.login = async (req, res) => {
  await Users.findOne({ email: req.body.email }, async function (err, user) {
    if (!user) {
      return res
        .status(500)
        .json({ err: "Такого профиля не существует" })
        .end();
    }

    var isAuthenticated =
      user &&
      ((await bcrypt.compare(req.body.password, user.password)) ||
        req.body.password === user.password);
    if (!isAuthenticated) {
      return res
        .status(510)
        .json({
          err: "Неверный адрес электронной почты или пароль",
        })
        .end();
    }
    if (user.emailConfirm) {
      var endSTR = "";
      var gfs = new mongodb.GridFSBucket(
        mongoose.connection.db,
        mongoose.mongo
      );
      var file = gfs.find({ filename: user.image });

      gfs
        .openDownloadStreamByName(file.filename, { revision: -1 })
        .on("data", (chunk) => {
          console.log("CHUNK: ", chunk);
          endSTR += Buffer.from(chunk, "hex").toString("base64");
        })
        .on("error", function (err) {
          user.image = "default";
          return res
            .status(200)
            .json({
              _id: user._id,
              username: user.username,
              role: user.role,
              emailConfirm: user.emailConfirm,
              image: user.image,
              token: user.getToken(),
            })
            .end();
        })
        .on("close", () => {
          if (user.image !== "default") {
            user.image = endSTR;
          }
          return res
            .status(200)
            .json({
              _id: user._id,
              username: user.username,
              role: user.role,
              emailConfirm: user.emailConfirm,
              image: user.image,
              imageType: file.contentType,
              token: user.getToken(),
            })
            .end();
        });
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
    var saltR = await bcrypt.genSalt(10);
    var hash = await bcrypt.hash(req.body.password, saltR);

    var newUser = await new Users({
      username: req.body.username,
      email: req.body.email,
      password: hash,
      image: req.body.filename,
    }).save();

    console.log("registration body: ", req.body);

    var mailAuthMessage = {
      to: newUser.email,
      subject: "Подтверждение электронной почты",
      html:
        "<div>Поздравляем! Вы успешно зарегистрированы на сайте Start-Up!</div>" +
        "<div><br>Для активации всех возможностей сайта требуется подтвердить Ваш электронный адрес. Сделать это можно, перейдя по следующей ссылке:</div>" +
        "<div><br><a href =" +
        process.env.CONFIRM_URL +
        newUser.id +
        ">Подтвердить электронную почту</a></div>" +
        "<div><br>Полный функционал сайта, включающий возможности создавать свои проекты, общаться с другими людьми, а также участвовать в разработке других проектов, доступен только для аккаунтов с подтвержденным e-mail.</div>" +
        "<div><br>С уважением, команда разработчиков Start-Up!</div>",
    };
    nodemailer.transport.sendMail(mailAuthMessage, function (error, resp) {
      if (error) {
        console.log(error);
      } else {
        console.log(resp);
      }
      nodemailer.transport.close();
    });

    return res
      .status(200)
      .json({
        _id: newUser._id,
        username: newUser.username,
        email: newUser.email,
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
  await Users.findById(mongoose.Types.ObjectId(req.body.id), (err, user) => {
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

exports.sendRecoveryEmail = async (req, res) => {
  var user = await Users.findById(req.body.userID, (err) => {
    if (err) {
      return res.status(500).json({ err: err.message }).end();
    }
  });
  var url = process.env.FRONT_URL + "passwordrecovery/" + req.body.userID;
  var info = {
    notificationID: -1,
    email: user.email,
    subject: "Смена пароля",
    theme: "Смена пароля",
    text:
      "Поступил запрос на смену пароля. Если вы не делали этого, не переходите по ссылке." +
      "<br>" +
      " Для смены пароля, перейдите по ссылке ниже." +
      "<br>" +
      "<div><a href =" +
      url +
      ">СМЕНИТЬ ПАРОЛЬ</a>." +
      "</div>",
  };
  await new Links({
    userID: user._id,
    link: url,
  }).save();
  nodemailer.sendMessageEmail(info);
  return res.status(200).json({ message: "success" }).end();
};

exports.recoveryPassword = async (req, res) => {
  await Links.findOneAndDelete(
    { userID: req.body.userID },
    async (error, link) => {
      if (error) {
        return res.status(500).json({ err: error.message }).end();
      }
      if (!link) {
        return res.status(500).json({ err: "Link has expired" }).end();
      }
      link.remove();

      var saltR = await bcrypt.genSalt(10);

      await Users.findByIdAndUpdate(
        req.body.userID,
        { password: await bcrypt.hash(req.body.newPassword, saltR) },
        { new: true },
        (err, result) => {
          if (err) {
            return res.status(500).json({ err: err.message }).end();
          }
          return res.status(200).json({ message: "success" }).end();
        }
      );
    }
  );
};

exports.getFiles = async function (req, res) {
  var gfs = new mongodb.GridFSBucket(mongoose.connection.db, mongoose.mongo);
  var endSTR = "";

  // var files = await gfs.find({}, (err) => {});
  // console.log(files);

  gfs
    .openDownloadStreamByName(req.body.filename, { revision: -1 })
    .on("data", (chunk) => {
      console.log("CHUNK: ", chunk);
      endSTR += Buffer.from(chunk, "hex").toString("base64");
    })
    .on("error", function (err) {
      console.log("ERR: ", err);
      return res
        .status(500)
        .json({ base64Image: "No image found with that title" })
        .end();
    })
    .on("close", () => {
      return res.status(200).json({ base64Image: endSTR }).end();
    });
};
