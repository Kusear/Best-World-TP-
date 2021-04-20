var mongoose = require("mongoose");

var ProjectSubjectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
});

exports.projectSubjectCollection = "projectSubject";
exports.ProjectSubject = mongoose.model("projectSubject", ProjectSubjectSchema);
