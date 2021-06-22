var mongoose = require("mongoose");

var ReportedProjectSchema = new mongoose.Schema({
  slug: {
    type: String,
    required: true,
  },
  reportFromUser: {
    type: String,
    required: true,
  },
  title: { type: String },
});

exports.reportedProjectCollection = "reportedProjects";
exports.ReportedProject = mongoose.model(
  "reportedProjects",
  ReportedProjectSchema
);
