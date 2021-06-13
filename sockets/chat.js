const Chat = require("../models/chats_model").Chat;
const Project = require("../models/project").Project;
const Messages = require("../models/chats_model").ChatMessages;
const Users = require("../models/user_model").User;
const nodemailer = require("../config/nodemailer");

const mongodb = require("mongodb");
const mongoose = require("mongoose");

// status
const CONNECTED = 0;
const DISCONNECTED = 1;

var i = 0;

var emailMessage = async (room, socketArray) => {
  socketArray.forEach((element) => {
    var info = {
      notificationID: -1,
      email: element.data.email,
      // title: project.title,
      subject: "Новое сообщение в чате",
      theme: "Новое сообщение в чате " + element.data.chatName,
      text:
        "<div><br>У вас новое сообщение в чате '" +
        element.data.chatName +
        "'. </div>" +
        "<div><br>Благодарим за внимание, Start-Up.</div>",
    };
    if (!element.connected) {
      nodemailer.sendMessageEmail(info);
    }
  });
  i = 0;
};

module.exports = (io) => {
  var counter = 0; //
  var cUser = {
    id: "",
    username: "",
    Room: "",
  };

  io.on("connection", (socket) => {
    console.log("socket io connected " + socket.id + " " + counter);

    cUser.id = socket.id;

    socket.on("joinRoom", async ({ username, token, room }) => {
      var banned = false;
      await Users.findOne({ username: username }, (err, user) => {
        if (err) {
          io.to(cUser.id).emit("err", { err: err.message });
          return socket.disconnect();
        }
        if (!user) {
          io.to(cUser.id).emit("err", { err: "" });
          return socket.disconnect();
        }
        if (user.ban) {
          banned = true;
        } else {
          socket.data.username = user.username;
          socket.data.email = user.email;
        }
      });

      if (banned) {
        io.to(cUser.id).emit("err", {
          err: "Banned user",
          status: DISCONNECTED,
        });
        return socket.disconnect();
      }

      cUser.Room = room;
      cUser.username = username;
      await Chat.findOne({ chatRoom: cUser.Room }, async (err, chat) => {
        if (err) {
          console.log("err: ", err);
          io.to(cUser.id).emit("err", {
            err: err.message,
            status: DISCONNECTED,
          });
          return socket.disconnect();
        }

        if (!chat) {
          console.log("chat not found");
          io.to(cUser.id).emit("err", {
            err: "Chat not found",
            status: DISCONNECTED,
          });
          return socket.disconnect();
        }

        var s = false;
        var arrayChatMembers = chat.chatMembers;
        arrayChatMembers.forEach((element) => {
          if (element.username === username) {
            s = true;
          }
        });

        if (!s) {
          io.to(cUser.id).emit("err", {
            err: "User not a member",
            status: DISCONNECTED,
          });
          return socket.disconnect();
        }

        socket.data.chatName = chat.chatName;

        socket.join(chat.chatRoom);
        console.log("Room: ", cUser.Room);
      });
    });

    socket.on("chatMessage", async (text, cb) => {
      await Chat.findOne({ chatRoom: cUser.Room }, async (err, chat) => {
        if (err) {
          io.to(cUser.id).emit("err", { err: err.message });
          return;
        }

        if (!chat) {
          console.log("chat not found");
          io.to(cUser.id).emit("err", {
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

        if (i == 10) {
          var sok = await io.in(cUser.Room).fetchSockets();
          emailMessage(cUser.Room, sok);
        }
        i++;
      });
    });

    socket.on("disconnect", () => {
      return socket.disconnect();
    });

    socket.on("getUsersInChat", async ({ chat, project }) => {
      var gfs = new mongodb.GridFSBucket(
        mongoose.connection.db,
        mongoose.mongo
      );
      var users = [];
      if (chat) {
        await Chat.findOne({ chatRoom: cUser.Room }, async (err, chatBD) => {
          if (err) {
            io.to(cUser.id).emit("err", { err: err.message });
            return;
          }
          console.log(chatBD.chatMembers);
          await chatBD.chatMembers.forEach(async (element) => {
            await Users.findOne({ username: element.username }, (err, u) => {
              if (err) {
                console.log("err user", err.message);
              }
              console.log(u.username);
              users.push({ username: u.username, image: u.image });

              //
              var list = {
                count: 0,
                array: [],
              };
              users.forEach((element) => {
                var obj = {
                  username: "",
                  image: "",
                  base64: "",
                };
                gfs
                  .openDownloadStreamByName(element.image, { revision: -1 })
                  .on("data", (chunk) => {
                    obj.base64 += Buffer.from(chunk, "hex").toString("base64");
                    // console.log("CHUNK: ", chunk);
                  })
                  .on("error", function (err) {
                    console.log("err");
                    obj.chunks.push("No image found with that title");
                    //
                    obj.image = element.image;
                    obj.username = element.username;
                    list.count++;
                    list.array.push(obj);
                    console.log(element);
                    if (list.count == users.length) {
                      console.log("io");
                      io.to(cUser.id).emit("usersInChat", {
                        users: list.array,
                      });
                      return;
                    }
                    //
                  })
                  .on("close", () => {
                    obj.image = element.image;
                    obj.username = element.username;
                    list.count++;
                    list.array.push(obj);
                    console.log("a");
                    if (list.count == users.length) {
                      console.log("io");
                      io.to(cUser.id).emit("usersInChat", {
                        users: list.array,
                      });
                      return;
                    }
                  });
              });
              //
            });
          });
        });
      } else if (project) {
        await Project.findOne({ slug: cUser.Room }, (err, pr) => {
          if (err) {
            io.to(cUser.id).emit("err", { err: err.message });
            return;
          }

          pr.projectMembers.forEach((element) => {
            Users.findOne({ username: element.username }, (err, u) => {
              if (err) {
                console.log("err in project branch chat users");
              }
              users.push({
                username: u.username,
                image: u.image,
                role: element.role,
              });

              var list = {
                count: 0,
                array: [],
              };
              var c = 0;
              users.forEach((element) => {
                c++;
                var obj = {
                  username: "",
                  image: "",
                  role: "",
                  base64: "",
                };
                gfs
                  .openDownloadStreamByName(element.image, { revision: -1 })
                  .on("data", (chunk) => {
                    obj.base64 += Buffer.from(chunk, "hex").toString("base64");
                    // console.log("CHUNK: ", chunk);
                  })
                  .on("error", function (err) {
                    obj.chunks.push("No image found with that title");
                    obj.image = element.image;
                    obj.username = element.username;
                    obj.role = element.role;
                    list.count++;
                    list.array.push(obj);
                    if (list.count == c) {
                      io.to(cUser.id).emit("usersInChat", {
                        users: list.array,
                      });
                      return;
                    }
                  })
                  .on("close", () => {
                    obj.image = element.image;
                    obj.username = element.username;
                    obj.role = element.role;
                    list.count++;
                    list.array.push(obj);
                    if (list.count == c) {
                      io.to(cUser.id).emit("usersInChat", {
                        users: list.array,
                      });
                      return;
                    }
                  });
              });
            });
          });
        });
      }
    });

    socket.on("getHistory", async ({ username, page }) => {
      console.log(username, " : ", page);
      if (!username) {
        io.to(cUser.id).emit("err", {
          err: "username are required",
        });
        return;
      }
      var messagesHistory = await Chat.findOne(
        { chatRoom: cUser.Room },
        async (err) => {
          if (err) {
            io.to(cUser.id).emit("err", { err: err.message });
            return;
          }
        }
      );
      var messagesH = [];
      if (messagesHistory.messages.length >= 30) {
        for (
          i = messagesHistory.messages.length - 30 * page;
          i < messagesHistory.messages.length;
          i++
        ) {
          messagesH.push(messagesHistory.messages[i]);
        }
        io.to(cUser.id).emit("history", { history: messagesH });
      } else {
        io.to(cUser.id).emit("history", { history: messagesHistory.messages });
      }
    });

    socket.on("blockUser", async ({ userID }) => {
      if (!userID) {
        socket.emit("err", {
          err: "userID are required",
        });
        return;
      }
      await Chat.findOne({ chatRoom: cUser.Room }, async (err, chat) => {
        if (err) {
          io.to(cUser.id).emit("err", { err: err.message });
          return;
        }

        var user = await chat.chatMembers.id(userID);
        await chat.blackList.push(user);
        await chat.save();
        io.to(chat.chatRoom).emit("userBlocked", {
          text: "User " + user.username + " are blocked",
        });
      });
    });

    socket.on("unblockUser", async ({ userID }) => {
      if (!userID) {
        socket.emit("err", {
          err: "userID are required",
        });
        return;
      }
      await Chat.findOne({ chatRoom: cUser.Room }, async (err, chat) => {
        if (err) {
          io.to(cUser.id).emit("err", { err: err.message });
          return;
        }

        var user = await chat.chatMembers.id(userID);
        await chat.blackList.pull(user);
        await chat.save();
        io.to(chat.chatRoom).emit("userUnblocked", {
          text: "User " + user.username + " are unblocked",
        });
      });
    });

    socket.on("leave", async ({ userID }) => {
      if (!userID) {
        socket.emit("err", {
          err: "userID are required",
        });
        return;
      }
      await Chat.findOne({ chatRoom: cUser.Room }, async (err, chat) => {
        if (err) {
          io.to(cUser.id).emit("err", { err: err.message });
          return;
        }

        var user = await chat.chatMembers.id(userID);
        await chat.chatMembers.pull(user);
        await chat.save();
        socket.leave(cUser.Room);
        io.to(chat.chatRoom).emit("userLeave", {
          status: DISCONNECTED,
          username: cUser.username,
        });
        return socket.disconnect();
      });
    });
  });
};
