var ReportedProjects = require("../models/reported_projects").ReportedProject;

exports.getReortedProjects = async function (req, res) {
  await ReportedProjects.find({}, function (err, result) {
    if (err) {
      return res.status(400).json({ err: err.message }).end();
    }
    return res.status(200).json(result).end();
  });
};

exports.deleteReportProject = async function (req, res) {
  var reportProject = req.body.reportID;
  if (!reportProject) {
    return res.status(400).json({ err: "field (reportID) are required" }).end();
  }
  await ReportedProjects.findById(reportProject, async function (err, report) {
    if (err) {
      return res.status(500).json({ err: err.message }).end();
    }
    if (!report) {
      return res.status(400).json({ message: "report not found" }).end();
    }
    await report.remove(function (err, doc) {
      if (err) {
        return res.status(500).json({ err: err.message }).end();
      }
      return res.status(200).json({ message: "deleted" }).end();
    });
  });
};
