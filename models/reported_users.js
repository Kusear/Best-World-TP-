var mongoose = require("mongoose");

var ReportedUserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  reportDescription: {
    type: String,
  },
});

exports.ReportedUser = mongoose.model("reportedUsers", ReportedUserSchema);
