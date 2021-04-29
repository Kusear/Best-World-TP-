var mongoose = require("mongoose");
var User = require("./user_model");
var slugify = require("slugify");

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
  title: {
    type: String,
    required: true,
    unique: true,
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
    type: Array,
    default: [],
  },
  projectMembers: {
    type: Array,
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
    slugify(this.title, {
      replacement: "-", // replace spaces with replacement character, defaults to `-`
      remove: undefined, // remove characters that match regex, defaults to `undefined`
      lower: false, // convert to lower case, defaults to `false`
      strict: false, // strip special characters except replacement, defaults to `false`
      locale: "ru", // language code of the locale to use
    }) +
    "-" +
    this._id;
  next();
});

exports.projectCollection = "project";
exports.Project = mongoose.model("project", ProjectSchema);
