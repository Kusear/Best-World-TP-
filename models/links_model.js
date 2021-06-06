const mongoose = require("mongoose");

const LinksSchema = new mongoose.Schema({
  userID: {
    type: String,
    required: true,
  },
  link: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    expires: 3600,
    default: new Date(),
  },
});

exports.Link = mongoose.model("links", LinksSchema);
