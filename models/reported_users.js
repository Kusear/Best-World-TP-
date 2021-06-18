var mongoose = require("mongoose");

var ReportedUserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
  },
  reportFromUser: {
    type: String,
    required: true,
  },
});

exports.ReportedUser = mongoose.model("reportedUsers", ReportedUserSchema);
