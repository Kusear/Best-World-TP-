const MessageModel = require("../models/chats_model").ChatMessages;
const Chat = require("../models/chats_model").Chat;
const cookieParser = require("cookie-parser");
const passport = require("passport");

function auth(socket, next) {
  // Parse cookie
  cookieParser()(socket.request, socket.request.res, () => {});

  // JWT authenticate
  passport.authenticate(
    "jwt",
    { session: false },
    (error, decryptToken, jwtError) => {
      if (!error && !jwtError && decryptToken) {
        next(false, { username: decryptToken.username, id: decryptToken.id });
      } else {
        next("guest");
      }
    }
  )(socket.request, socket.request.res);
}

module.exports = io => {
  io.on("connection", function(socket) {
    auth(socket, (guest, user) => {
      if (!guest) {
        socket.join();
        socket.username = user.username;
        socket.emit(
          "connected",
          `you are connected to chat as ${user.username}`
        );
      }
    });

    socket.on("msg", content => {
      if (!socket.username) {
        return;
      }

      const obj = {
        date: new Date(),
        content: content,
        username: socket.username
      };

      MessageModel.create(obj, err => {
        if (err) {
          return console.error("MessageModel", err);
        }
        socket.emit("message", obj);
        socket.to("all").emit("message", obj);
      });
    });

    socket.on("receiveHistory", () => {
      if (!socket.username) {
        return;
      }

      MessageModel.find({})
        .sort({ date: -1 })
        .limit(50)
        .sort({ date: 1 })
        .lean()
        .exec((err, messages) => {
          if (!err) {
            socket.emit("history", messages);
          }
        });
    });
  });
};