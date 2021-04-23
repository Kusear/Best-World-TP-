var mongoose = require("mongoose");
var User = require("./user");

var reqShema = new mongoose.Schema({
  name: String,
  countOfMembers: Number,
});

var ProjectSchema = new mongoose.Schema({
  IDcreator: {
    type: String,
    required: true,
  },
  IDmanager: {
    type: String,
  },
  needManager: {
    type: Boolean,
    default: false,
  },
  onPreModerate: {
    type: Boolean,
    default: true,
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
    type: Array,
  },
  picture: {
    type: String,
  },
  countOfMembers: {
    type: Number,
  },
  creationDate: {
    type: Date,
    required: true,
  },
  endTeamGathering: {
    type: Date,
    required: true,
  },
  endProjectDate: {
    type: Date,
    required: true,
  },
  requiredRoles: {
    type: [Object],
  },
  projectMembers: {
    type: [
      {
        type: String,
      },
    ],
  },
});

exports.projectCollection = "project";
exports.Project = mongoose.model("project", ProjectSchema);
