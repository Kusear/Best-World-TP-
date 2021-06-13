var mongoose = require("mongoose");

const ChatMessages = new mongoose.Schema({
  date: { type: Date, default: new Date() },
  text: { type: String },
  username: { type: String },
});

const BlackList = new mongoose.Schema({
  username: {
    type: String,
  },
  role: {
    type: String,
  },
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
  chatRoom: {
    type: String,
  },
  chatName: {
    type: String,
  },
  chatMembers: [ChatMembers],
  messages: { type: [ChatMessages], default: [] },
  privateChat: {
    type: Boolean,
  },
  blackList: {
    type: [BlackList],
    default: [],
  },
});

exports.Chat = mongoose.model("Chat", Chat);
exports.ChatMembers = mongoose.model("ChatMembers", ChatMembers);
exports.ChatMessages = mongoose.model("ChatMessages", ChatMessages);
exports.ChatBlackList = mongoose.model("ChatBlackList", BlackList);
