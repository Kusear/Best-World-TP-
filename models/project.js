const mongoose = require("mongoose");
const User = require("./user_model");
const slugify = require("slugify");

const Requests = new mongoose.Schema({
  username: {
    type: String,
  },
  role: {
    type: String,
  },
});

const RequiredRoles = new mongoose.Schema({
  role: {
    type: String,
  },
  count: {
    type: Number,
  },
  alreadyEnter: {
    type: Number,
  },
});

const ProjectMembers = new mongoose.Schema({
  username: {
    type: String,
  },
  role: {
    type: String,
  },
});

const ProjectSchema = new mongoose.Schema({
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
  title: {
    type: String,
    required: true,
    trim: true,
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
    type: [RequiredRoles],
    default: [],
  },
  projectMembers: {
    type: [ProjectMembers],
    default: [],
  },
  requests: {
    type: [Requests],
    default: [],
  },
  needChanges: {
    type: Boolean,
    default: false,
  },
  slug: {
    type: String,
  },
});

ProjectSchema.pre("save", async function (next) {
  this.slug =
    (await slugify(this.title, {
      replacement: "-",
      remove: undefined,
      lower: false, 
      strict: false,
      locale: "ru", 
    })) +
    "-" +
    this._id;
  next();
});

exports.projectCollection = "project";
exports.Project = mongoose.model("project", ProjectSchema);
