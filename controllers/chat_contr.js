const Chat = require("../models/chats_model").Chat;
const Users = require("../models/user_model").User;
const slugify = require("slugify");

const mongodb = require("mongodb");
const mongoose = require("mongoose");

// TODO сделать проверку на созданный чат двух пользователей
// TODO проверить везде на пустые списки (подобные chatMembers в New-Test-project-name-60ccd4c4b467640015d9abb4)

exports.createChat = async (req, res) => {
  try {
    var checkChatName = req.body.chatName;
    var spaceIndex = checkChatName.indexOf(" ");
    var str = [];
    str.push(checkChatName.substring(0, spaceIndex));
    str.push(checkChatName.substring(spaceIndex + 1, checkChatName.length));

    var chat;
    var checkSTR = str[0] + " " + str[1];
    chat = await Chat.findOne({ chatName: checkSTR }, (err) => {
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

    checkSTR = str[1] + " " + str[0];
    chat = await Chat.findOne({ chatName: checkSTR }, (err) => {
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

    // console.log(str.lastIndexOf("_"));
    // console.log(str.substring(0, 6));

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

exports.getUsersInChat = async (req, res) => {
  if (!req.body.chatRoom) {
    return res.status(500).json({ message: "chatRoom are requiared" }).end();
  }

  var chat = await Chat.findOne({ chatRoom: req.body.chatRoom }, (err) => {
    if (err) {
      return res.status(520).json({ err: err.message }).end();
    }
  });

  if (!chat) {
    return res.status(500).json({ err: "Chat not found" }).end();
  }

  var gfs = new mongodb.GridFSBucket(mongoose.connection.db, mongoose.mongo);

  var chatUsers = [];
  var i = 0;
  if (chat.chatMembers.length != 0) {
    chat.chatMembers.forEach(async (element) => {
      var endSTR2 = "";
      var user = {
        username: "",
        image: "",
        role: "",
      };
      user.role = element.role;
      await Users.findOne({ username: element.username }, (err, userBD) => {
        user.username = userBD.username;
        gfs
          .openDownloadStreamByName(userBD.image, { revision: -1 })
          .on("data", (chunk) => {
            console.log("CHUNK: ", chunk);
            endSTR2 += Buffer.from(chunk, "hex").toString("base64");
          })
          .on("error", function (err) {
            console.log("ERR: ", err);
            user.image = "default";
            chatUsers.push(user);
            if (i == chat.chatMembers.length - 1) {
              return res
                .status(200)
                .json({
                  members: chatUsers,
                })
                .end();
            }
            i++;
          })
          .on("close", () => {
            if (userBD.image !== "default") {
              user.image = endSTR2;
            } else {
              user.image = "default";
            }
            chatUsers.push(user);
            if (i == chat.chatMembers.length - 1) {
              return res
                .status(200)
                .json({
                  members: chatUsers,
                })
                .end();
            }
            i++;
          });
      });
    });
  } else {
    return res
      .status(200)
      .json({
        members: chatUsers,
      })
      .end();
  }
};
