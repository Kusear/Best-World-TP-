const ReportedProjects = require("../models/reported_projects").ReportedProject;
const Projects = require("../models/project").Project;
const Users = require("../models/user_model").User;
const mongoose = require("mongoose");
const nodemailer = require("../config/nodemailer");

exports.createRoportProject = async (req, res) => {
  if (!req.body.reportFrom) {
    return res.status(500).json({ message: "reportFrom are required" }).end();
  }
  var report = await ReportedProjects.findOne(
    { slug: req.body.slug },
    (err) => {
      if (err) {
        return res.status(500).json({ err: err.message }).end();
      }
    }
  );

  if (report) {
    return res.status(500).json({ message: "Report already exist" }).end();
  }

  var newReport = await new ReportedProjects({
    slug: req.body.slug,
    reportFromUser: req.body.reportFrom,
    title: req.body.title,
  }).save();
  return res.status(200).json({ message: "success" }).end();
};

exports.applyReport = async (req, res) => {

  if (!req.body.projectSlug) {
    return res.status(500).json({ message: "projectSlug are required" }).end();
  }
  if (!req.body.reportID) {
    return res.status(500).json({ message: "reportID are required" }).end();
  }
  await Projects.findOne(
    { slug: req.body.projectSlug },
    async (err, project) => {
      if (err) {
        return res.status(500).json({ err: err.message }).end();
      }
      if (!project) {
        return res.status(500).json({ message: "Project not exist" }).end();
      }
      project.needChanges = true;
      await project.save();
      await ReportedProjects.findByIdAndRemove(
        mongoose.Types.ObjectId(req.body.reportID)
      );
      await Users.findOne({ username: project.creatorName }, (err, user) => {
        if (err) {
          return res.status(500).json({ err: err.message }).end();
        }
        if (!user) {
          return res.status(500).json({ message: "User not found" }).end();
        }

        var info = {
          notificationID: -1,
          email: user.email,
          // title: project.title,
          subject: "Вам необходимо изменить информацию вашего проекта",
          theme:
            user.username +
            ", на ваш проект'" +
            project.title +
            "' была подана жалоба",
          text:
            "<div><br>Пожалуйста измените информацию вашего проекта '" +
            project.title +
            "'." +
            "</div>" +
            "<div><br>Благодарим за внимание, Start-Up.</div>",
        };
        nodemailer.sendMessageEmail(info);
        return res.status(200).json({ message: "success" }).end();
      });
    }
  );
};

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
