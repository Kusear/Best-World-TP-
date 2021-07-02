const ReportedUsers = require("../models/reported_users").ReportedUser;
const Users = require("../models/user_model").User;
const mongoose = require("mongoose");
const nodemailer = require("../config/nodemailer");

exports.createReportUser = async (req, res) => {
  if (!req.body.reportFrom) {
    return res.status(400).json({ message: "reportFrom are required" }).end();
  }
  var report = await ReportedUsers.findOne(
    { username: req.body.username },
    (err) => {
      if (err) {
        return res.status(400).json({ err: err.message }).end();
      }
    }
  );

  if (report) {
    return res.status(200).json({ message: "Report already exist" }).end();
  }

  var newReport = await new ReportedUsers({
    username: req.body.username,
    reportFromUser: req.body.reportFrom,
  }).save();
  return res.status(200).json({ message: "success" }).end();
};

exports.applyReport = async (req, res) => {
  if (!req.body.username) {
    return res.status(400).json({ message: "username are required" }).end();
  }
  if (!req.body.reportID) {
    return res.status(400).json({ message: "reportID are required" }).end();
  }
  await Users.findOne({ username: req.body.username }, async (err, user) => {
    if (err) {
      return res.status(400).json({ err: err.message }).end();
    }
    if (!user) {
      return res.status(400).json({ message: "User not found" }).end();
    }
    user.needChanges = true;
    await user.save();
    await ReportedUsers.findByIdAndRemove(
      mongoose.Types.ObjectId(req.body.reportID)
    );
    var info = {
      notificationID: -1,
      email: user.email,
      // title: project.title,
      subject: "Вам необходимо изменить личный профиль",
      theme: user.username + ", на вас была подана жалоба",
      text:
        "<div><br>Пожалуйста измените свой личный профиль." +
        "</div>" +
        "<div><br>Благодарим за внимание, Start-Up.</div>",
    };
    nodemailer.sendMessageEmail(info);

    return res.status(200).json({ message: "success" }).end();
  });
};

exports.getReportedUsers = async function (req, res) {
  await ReportedUsers.find({}, function (err, result) {
    if (err) {
      return res.status(400).json({ err: err.message }).end();
    }
    return res.status(200).json(result).end();
  });
};

exports.deleteUserReport = async function (req, res) {
  var reportToDelete = req.body.reportID;
  if (!reportToDelete) {
    return res.status(400).json({ err: "field (reportID) are required" }).end();
  }
  await ReportedUsers.findById(reportToDelete, async function (err, report) {
    if (err) {
      return res.status(400).json({ err: err.message }).end();
    }
    if (!report) {
      return res.status(400).json({ message: "Report not found" }).end();
    }
    await report.remove(function (err, doc) {
      if (err) {
        return res.status(400).json({ err: err.message }).end();
      }
      return res.status(200).json({ message: "deleted" }).end();
    });
  });
};
