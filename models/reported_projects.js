var mongoose = require("mongoose");

var ReportedProjectSchema = new mongoose.Schema({
  IDcreator: {
    type: String,
    required: true,
  },
  creatorName: {
    type: String,
  },
  IDmanager: {
    type: String,
  },
  managerName: {
    type: String,
  },
  title: {
    type: String,
    required: true,
    unique: true,
  },
  description: {
    type: String,
  },
  projectSubject: {
    type: String,
    default: "no subject",
  },
  picture: {
    type: String,
  },
  reportDescription: {
    type: String,
  },
});

exports.reportedProjectCollection = "reportedProjects";
exports.ReportedProject = mongoose.model(
  "reportedProjects",
  ReportedProjectSchema
);
