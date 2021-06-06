const Chat = require("../models/chats_model").Chat;

exports.createChat = async (req, res) => {
  try {
    var chat = await Chat.findOne({ chatRoom: req.body.chatRoom }, (err) => {
      if (err) {
        return res.status(520).json({ err: err.message }).end();
      }
    });
    if (chat) {
      return res.status(500).json({ err: "Chat already exist" }).end();
    }
    var newChat = await Chat({
      chatRoom: req.body.chatRoom,
      chatMembers: req.body.chatMembers,
      privateChat: true,
    }).save();
    return res.status(200).json({ chat: newChat }).end();
  } catch (err) {
    if (err.code === 11000) {
      return res.status(500).json({ err: "Chat already exist" }).end();
    } else {
      return res.status(520).json({ err: err.message }).end();
    }
  }
};

exports.getChats = async (req, res) => { // TODO подумать как защитить от получения чатов других пользователей (мб как-то достать из токена username)
  // if (req.query.username === req.headers.username)
  var userChats = await Chat.find(
    { "chatMembers.username": req.query.username },
    (err) => {
      if (err) {
        return res.status(520).json({ err: err.message }).end();
      }
    }
  );
  if (!userChats) {
    return res.status(500).json({ err: "No chat with this user" }).end();
  } else {
    return res.status(200).json({ chats: userChats }).end();
  }
};

exports.deleteChat = async (req, res) => {
  var userChat = await Chat.findOne({ chatRoom: req.body.chatRoom }, (err) => {
    if (err) {
      return res.status(520).json({ err: err.message }).end();
    }
  });
  if (!userChat) {
    return res.status(500).json({ err: "Chat not found" }).end();
  }
  await userChat.remove();
  return res.status(200).json({ message: "success" }).end();
};
