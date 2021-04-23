var ReportedUsers = require("../models/reported_users").ReportedUser;

// сделать создание

exports.getReortedUsers = async function (req, res) {
  ReportedUsers.find({}, function (err, result) {
    if (err) {
      return res.status(400).json({ err: err.message }).end();
    }
    return res.status(200).json(result).end();
  });
};

// спросить как будем редачить репорченых пользователей

exports.deleteUserReport = async function (req, res) {
  var reportToDelete = req.body.reportID;
  if (!reportToDelete) {
    return res.status(400).json({ err: "field (reportID) are required" }).end();
  }
  await ReportedUsers.findById(reportToDelete, async function (err, report) {
    if (err) {
      return res.status(500).json({ err: err.message }).end();
    }
    if (!report) {
      return res.status(400).json({ message: "Report not found" }).end();
    }
    await report.remove(function (err, doc) {
      if (err) {
        return res.status(500).json({ err: err.message }).end();
      }
      return res.status(200).json({ message: "deleted" }).end();
    });
  });
};
