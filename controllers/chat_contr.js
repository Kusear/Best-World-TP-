const Chat = require("../models/chats_model").Chat;
const slugify = require("slugify");

exports.createChat = async (req, res) => {
  try {
    var chat = await Chat.findOne({ chatName: req.body.chatName }, (err) => {
      if (err) {
        return res.status(520).json({ err: err.message }).end();
      }
    });
    if (chat) {
      return res
        .status(500)
        .json({ message: "Chat already exist", chatSlug: chat.chatRoom })
        .end();
    }
    var newChat = await Chat({
      chatRoom: req.body.chatRoom,
      chatName: req.body.chatName,
      chatMembers: req.body.chatMembers,
      privateChat: true,
    }).save();

    newChat.chatRoom =
      (await slugify(newChat.chatName, {
        replacement: "-",
        remove: undefined,
        lower: false,
        strict: false,
        locale: "ru",
      })) +
      "-" +
      newChat._id;
    newChat.save();
    return res.status(200).json({ chat: newChat }).end();
  } catch (err) {
    if (err.code === 11000) {
      return res.status(500).json({ message: "Chat already exist" }).end();
    } else {
      return res.status(520).json({ err: err.message }).end();
    }
  }
};

exports.getChats = async (req, res) => {
  // if (req.query.username === req.headers.username)
  var userChats = await Chat.find(
    { "chatMembers.username": req.body.username },
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
