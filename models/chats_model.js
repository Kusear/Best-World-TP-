var mongoose = require("mongoose");

const ChatMessages = new mongoose.Schema({
  date: { type: Date },
  content: { type: String },
  username: { type: String },
});

const ChatMembers = new mongoose.Schema({
  username: {
    type: String,
  },
  role: {
    type: String,
  },
});

const Chat = new mongoose.Schema({
  projectID: {
    type: String,
    required: true,
  },
  chatMembers: [ChatMembers],
  message: [ChatMessages],
});

exports.Chat = mongoose.model("Chat", Chat);
exports.ChatMembers = mongoose.model("ChatMembers", ChatMembers);
exports.ChatMessages = mongoose.model("ChatMessages", ChatMessages);
