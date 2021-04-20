var mongoose = require("mongoose");

var UserRoleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
  },
});

exports.userRoleCollection = "userRole";
exports.UserRole = mongoose.model("userRole", UserRoleSchema);
