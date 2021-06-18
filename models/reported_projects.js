var mongoose = require("mongoose");

var ReportedProjectSchema = new mongoose.Schema({
  slug: {
    type: String,
    required: true,
    unique: true,
  },
  reportFromUser: {
    type: String,
    required: true,
  },
});

exports.reportedProjectCollection = "reportedProjects";
exports.ReportedProject = mongoose.model(
  "reportedProjects",
  ReportedProjectSchema
);
