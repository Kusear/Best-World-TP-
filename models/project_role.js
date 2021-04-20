var mongoose = require("mongoose");

var ProjectRoleSchema = new mongoose.Schema({
  name: {
    type: String
  },
  description: {
    type: String,
  },
});

exports.projectRolesCollection = "project_roles";
exports.projectRole = mongoose.model("project_roles", ProjectRoleSchema);
