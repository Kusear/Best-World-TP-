const Chat = require("../models/chats_model").Chat;
const Messages = require("../models/chats_model").ChatMessages;
const cookieParser = require("cookie-parser");
const passport = require("passport");
const aga = require("../midleware/midleware");

// status
const CONNECTED = 0;
const DISCONNECTED = 1;

/* TODO доделать чат
* подгрузка сообщений порциями 50
* функцию подгрузки сообщений
*/

module.exports = (io) => {
  var counter = 0;  //
  var cUser = {
    id: "",
    username: "",
    Room: ""
  };
  io.on("connection", (socket) => {
    console.log("socket io connected " + socket.id + " " + counter);

    cUser.id = socket.id;

    socket.on("joinRoom", async ({ username, token, room }) => {
      cUser.Room = room;
      cUser.username = username;
      await Chat.findOne({ chatRoom: cUser.Room }, (err, chat) => {
        if (err) {
          console.log("err: ", err);
          io.to(cUser.id).emit("err", {err: err.message});
          return socket.disconnect();
        }

        if (!chat) {
          console.log("chat not found");
          io.to(cUser.Room).emit("err", {
            err: "Chat not found",
          });
          return socket.disconnect();
        }

        socket.join(chat.chatRoom);
        console.log("Room: ", cUser.Room);

        io.to(chat.chatRoom).emit("message", {status: CONNECTED, user: cUser.username});
      });
    });

    socket.on("chatMessage", async (text, cb) => {
      await Chat.findOne({ chatRoom: cUser.Room }, async (err, chat) => {

        if (!chat) {
          console.log("chat not found");
          socket.emit("err", {
            err: "Chat not found",
          });
          return socket.disconnect();
        }

        var message = new Messages();
        message.username = text.username;
        message.text = text.text;
        await chat.messages.push(message);
        await chat.save();
        io.to(chat.chatRoom).emit("message", text);
        console.log("text: ", text);
      });
    });

    socket.on("getHistory", async ({username}) => {
      if (!username) {
        socket.emit("err", {
          err: "username are required",
        });
        return;
      }
      await Chat.findOne({ chatRoom: cUser.Room }, async (err, chat) => {
        socket.emit("history", chat.messages);
      });
    });

    socket.on("blockUser", async (userID) => {
      if (!userID) {
        socket.emit("err", {
          err: "userID are required",
        });
        return;
      }
      await Chat.findOne({ chatRoom: cUser.Room }, async (err, chat) => {
        var user = await chat.chatMembers.id(userID);
        await chat.blackList.create(user);
        //await chat.save();
        io.to(chat.chatRoom).emit("userBlocked", {
          text: "User " + user.username + " are blocked",
        });
      });
    });

    socket.on("unblockUser", async (userID) => {
      if (!userID) {
        socket.emit("err", {
          err: "userID are required",
        });
        return;
      }
      await Chat.findOne({ chatRoom: cUser.Room }, async (err, chat) => {
        var user = await chat.chatMembers.id(userID);
        await chat.blackList.pull(user);
        await chat.save();
        io.to(chat.chatRoom).emit("userUnblocked", {
          text: "User " + user.username + " are unblocked",
        });
      });
    });

    socket.on("leave", async (userID) => {
      if (!userID) {
        socket.emit("err", {
          err: "userID are required",
        });
        return;
      }
      await Chat.findOne({ chatRoom: cUser.Room }, async (err, chat) => {
        // var user = await chat.chatMembers.id(userID);
        await chat.chatMembers.pull({username: cUser.username});
        await chat.save();
        io.to(caht.chatRoom).emit("userLeave", {
          status: DISCONNECTED,
          username: cUser.username,
        });
        return socket.disconnect();
      });
    });
    counter++;  //
  });
};