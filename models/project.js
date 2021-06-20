const mongoose = require("mongoose");
const Chat = require("./chats_model").Chat;
const slugify = require("slugify");

const RequestsSchema = new mongoose.Schema({
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
  canChange: {
    type: Boolean,
    default: false,
  },
});

const Files = new mongoose.Schema({
  username: { type: String },
  filename: { type: String },
  fileType: { type: String },
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
  needHelp: {
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
    required: true,
  },
  projectHashTag: {
    type: [],
    required: true,
  },
  image: {
    type: String,
    default: "default",
  },
  countOfMembers: {
    type: Number,
  },
  freePlaces: {
    type: Number,
  },
  creationDate: {
    type: Date,
  },
  endTeamGathering: {
    type: Date,
  },
  endProjectDate: {
    type: Date,
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
    type: [RequestsSchema],
    default: [],
  },
  projectFiles: {
    type: [Files],
    default: [],
  },
  needChanges: {
    type: Boolean,
    default: false,
  },
  archive: {
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
exports.Members = mongoose.model("members", ProjectMembers);
exports.Requests = mongoose.model("requests", RequestsSchema);
exports.Files = mongoose.model("files", Files);
