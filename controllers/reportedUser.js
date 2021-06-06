const ReportedUsers = require("../models/reported_users").ReportedUser;

exports.createRoportUser = async (req, res) => {
  if (!req.body.reportFrom) {
    return res.status(500).json({ message: "reportFrom are required" }).end();
  }
  var report = await ReportedUsers.findOne(
    { reportFromUser: req.body.reportFrom },
    (err) => {
      if (err) {
        return res.status(500).json({ err: err.message }).end();
      }
    }
  );

  if (report) {
    return res.status(500).json({ message: "Report already exist" }).end();
  }
  var newReport = await new ReportedUsers({
    username: req.body.username,
    reportFromUser: req.body.reportFrom,
  }).save();
  return res.status(200).json({ message: "success" }).end();
};

exports.getReportedUsers = async function (req, res) {
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
