const Users = require("../models/user_model").User;
const nodemailer = require("../config/nodemailer");

const STATUS_DBOBJECT_NOT_FOUND = 32685;
const INTERNAL_ERROR = 23568;
const SUCCESS = 22222;

exports.getBannedUsers = async (req, res) => {
  await Users.find({ ban: true }, function (err, result) {
    if (err) {
      return res
        .status(400)
        .json({ err: err.message, status: INTERNAL_ERROR })
        .end();
    }
    return res.status(200).json({ result, status: SUCCESS }).end();
  });
};

exports.banUser = async (req, res) => {
  if (!req.body.banUser) {
    return res.status(400).json({ err: "banser field are required!" }).end();
  }

  await Users.findOneAndUpdate(
    { username: req.body.banUser },
    { ban: true },
    { new: true },
    function (err, user) {
      if (err) {
        return res.status(400).json({ err: err.message }).end();
      }
      if (!user) {
        return res.status(400).json({ err: "User not found" }).end();
      }

      var info = {
        notificationID: -1,
        email: user.email,
        // title: project.title,
        subject: "Блокировка в системе.",
        theme: "Блокировка в системе.",
        text: "Вы были забокированы в системе.",
      };
      nodemailer.sendMessageEmail(info);

      return res
        .status(200)
        .json({ user: req.body.banUser, state: "banned" })
        .end();
    }
  );
};

exports.unbanUser = async (req, res) => {
  if (!req.body.banUser) {
    return res.status(400).json({ err: "banser field are required!" }).end();
  }

  await Users.findOneAndUpdate(
    { username: req.body.banUser },
    { ban: false },
    { new: true },
    function (err, user) {
      if (err) {
        return res.status(400).json({ err: err.message }).end();
      }
      if (!user) {
        return res.status(400).json({ err: "User not found" }).end();
      }

      var info = {
        notificationID: -1,
        email: user.email,
        // title: project.title,
        subject: "Разблокировка в системе.",
        theme: "Разблокировка в системе.",
        text: "Вы были разбокированы в системе.",
      };
      nodemailer.sendMessageEmail(info);

      return res
        .status(200)
        .json({ user: req.body.banUser, state: "unbanned" })
        .end();
    }
  );
};
