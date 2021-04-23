var mongoose = require("mongoose");
var User = require("./user");

var ProjectSchema = new mongoose.Schema({
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
    type: String,
    default: "no subject"
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
    type: Array,
    default: [],
  },
  projectMembers: {
    type: Array,
    default: [],
  },
});

exports.projectCollection = "project";
exports.Project = mongoose.model("project", ProjectSchema);
