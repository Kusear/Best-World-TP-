const ToDoLists = require("../models/todoList_model").TODOList;
const Projects = require("../models/project").Project;
const Boards = require("../models/todoList_model").Boards;
const Tasks = require("../models/todoList_model").Tasks;
const Users = require("../models/user_model").User;
const nodemailer = require("../config/nodemailer");

/* TODO
 * делать запросы к frontу для получения изменений
 * - При удалении пользователя из member'ов очищать поле задачи 
 "кому назначена задача" в тасклистах, если она ранее принадлежала этому пользователю.
 * при изменении чего-то присылать сообщения на почту
 */

module.exports = (io) => {
  var counter = 0; //
  var user = {
    id: "",
    username: "",
    TaskList: "",
  };

  io.on("connection", (socket) => {
    console.log("socket io connected Task" + socket.id + " " + counter);
    user.id = socket.id;

    socket.on("get-TaskList", async ({ username, token, slug }) => {
      user.TaskList = slug;
      user.username = username;
      console.log("List: ", slug);
      await ToDoLists.findOne({ projectSlug: user.TaskList }, (err, list) => {
        if (err) {
          io.to(user.id).emit("err", { err: err.message });
          return;
        }

        if (!list) {
          console.log("list not found");
          socket.emit("err", {
            err: "list not found",
          });
          return socket.disconnect();
        }

        socket.join(list.projectSlug);
        // console.log("List: ", user.TaskList);
        io.to(user.id).emit("listData", { list });
      });
    });

    socket.on("create-board", async ({ crtBoard }) => {
      if (!crtBoard) {
        io.to(user.id).emit("err", { err: "Board are require" });
        return;
      }

      var limit = false;
      await ToDoLists.aggregate(
        [
          { $match: { projectSlug: user.TaskList } },
          { $unwind: "$boards" },
          { $group: { _id: null, count: { $sum: 1 } } },
        ],
        (err, countOfDocs) => {
          if (err) {
            console.log("err: ", err.message);
          }
          if (countOfDocs[0].count >= 10) {
            limit = true;
          }
        }
      );

      if (limit) {
        io.to(user.id).emit("err", { err: "Limit of boards" });
        return;
      }

      var project = await Projects.findOne(
        { slug: user.TaskList },
        async (err) => {
          if (err) {
            io.to(user.id).emit("err", { err: err.message });
            return;
          }
        }
      );
      var creatorUser = await Users.findOne(
        { username: project.creatorName },
        (err) => {
          if (err) {
            io.to(user.id).emit("err", { err: err.message });
            return;
          }
        }
      );

      await ToDoLists.findOne(
        { projectSlug: user.TaskList },
        async (err, list) => {
          if (err) {
            io.to(user.id).emit("err", { err: err.message });
            return;
          }
          console.log("todolist");
          var newBoard = new Boards();
          newBoard.name = crtBoard.name;
          newBoard.color = crtBoard.color;
          newBoard.items = crtBoard.items;
          list.boards.push(newBoard);
          list.save();
          if (user.username !== project.creatorName) {
            console.log("send");
            var info = {
              notificationID: -1,
              email: creatorUser.email,
              // title: project.title,
              subject: "Создание доски.",
              theme: "Создание доски.",
              text:
                "Пользователь " +
                user.username +
                " создал доску '" +
                newBoard.name +
                "'. В доске задач проекта '" +
                project.title +
                "'." +
                "<br>" +
                "Для перехода к доске задач проекта необходимо перейти в ваш " +
                "<div><a href =" +
                process.env.FRONT_URL +
                "profile/" +
                creatorUser.username +
                ">профиль</a>." +
                " Затем найти нужную карточку проекта и нажать на стрелочку, которая находится в правом нижнем углу карточки.</div>",
            };
            nodemailer.sendMessageEmail(info);
          }
          io.to(user.id).emit("created-board", {
            status: "success",
            board: newBoard,
          });
        }
      );
    });

    socket.on("update-board", async ({ updBoard }) => {
      if (!updBoard) {
        io.to(user.id).emit("err", { err: "updBoard are require" });
        return;
      }

      var project = await Projects.findOne(
        { slug: user.TaskList },
        async (err) => {
          if (err) {
            io.to(user.id).emit("err", { err: err.message });
            return;
          }
        }
      );
      var creatorUser = await Users.findOne(
        { username: project.creatorName },
        (err) => {
          if (err) {
            io.to(user.id).emit("err", { err: err.message });
            return;
          }
        }
      );

      await ToDoLists.findOne(
        { projectSlug: user.TaskList },
        async (err, list) => {
          if (err) {
            io.to(user.id).emit("err", { err: err.message });
            return;
          }

          var board = list.boards.id(updBoard._id);
          var boardname = board.name;
          var additionText = "";
          if (updBoard.name) {
            additionText =
              " изменил название доски с '" +
              board.name +
              "' на '" +
              updBoard.name +
              "'";
            board.name = updBoard.name;
          }
          if (updBoard.color) {
            additionText = " изменил доску '" + newBoard.name + "'";
            board.color = updBoard.color;
          }
          await list.save((err) => {
            if (err) {
              io.to(user.id).emit("err", { err: err.message });
              return;
            }
          });
          if (user.username !== project.creatorName) {
            console.log("send");
            var info = {
              notificationID: -1,
              email: creatorUser.email,
              // title: project.title,
              subject: "Создание доски.",
              theme: "Создание доски.",
              text:
                "Пользователь " +
                user.username +
                additionText +
                ". В доске задач проекта " +
                project.title +
                "<br>" +
                "Для перехода к доске задач проекта необходимо перейти в ваш " +
                "<div><a href =" +
                process.env.FRONT_URL +
                "profile/" +
                creatorUser.username +
                ">профиль</a>." +
                " Затем найти нужную карточку проекта и нажать на стрелочку, которая находится в правом нижнем углу карточки.</div>",
            };
            nodemailer.sendMessageEmail(info);
          }
          io.to(user.id).emit("updated-board", {
            status: success,
            board: board,
          });
        }
      );
    });

    socket.on("delete-board", async ({ delBoard }) => {
      if (!delBoard) {
        io.to(user.id).emit("err", {
          err: "delBoard are required",
        });
        return;
      }

      var project = await Projects.findOne(
        { slug: user.TaskList },
        async (err) => {
          if (err) {
            io.to(user.id).emit("err", { err: err.message });
            return;
          }
        }
      );
      var creatorUser = await Users.findOne(
        { username: project.creatorName },
        (err) => {
          if (err) {
            io.to(user.id).emit("err", { err: err.message });
            return;
          }
        }
      );

      await ToDoLists.findOne(
        { projectSlug: user.TaskList },
        async (err, list) => {
          if (err) {
            io.to(user.id).emit("err", { err: err.message });
            return;
          }
          var bord = list.boards.id(delBoard._id);
          list.boards.pull(delBoard._id);
          await list.save();
          if (user.username !== project.creatorName) {
            console.log("send");
            var info = {
              notificationID: -1,
              email: creatorUser.email,
              // title: project.title,
              subject: "Создание доски.",
              theme: "Создание доски.",
              text:
                "Пользователь " +
                user.username +
                " удалил доску '" +
                bord.name +
                "'. В доске задач проекта '" +
                project.title +
                "'." +
                "<br>" +
                "Для перехода к доске задач проекта необходимо перейти в ваш " +
                "<div><a href =" +
                process.env.FRONT_URL +
                "profile/" +
                creatorUser.username +
                ">профиль</a>." +
                " Затем найти нужную карточку проекта и нажать на стрелочку, которая находится в правом нижнем углу карточки.</div>",
            };
            nodemailer.sendMessageEmail(info);
          }
          io.to(user.id).emit("deleted-board", { status: "success" });
        }
      );
    });

    socket.on("create-task", async ({ board, crtTask }) => {
      if (!board) {
        io.to(user.id).emit("err", { err: "Board are require" });
        return;
      }
      if (!crtTask) {
        io.to(user.id).emit("err", { err: "crtTask are require" });
        return;
      }

      var limit = false;
      await ToDoLists.aggregate(
        [
          {
            $match: { projectSlug: projectSlug },
          },
          {
            $project: {
              boards: {
                $map: {
                  input: "$boards",
                  as: "boardss",
                  in: {
                    id: "$$boardss._id",
                    items: {
                      total: { $size: "$$boardss.items" },
                    },
                  },
                },
              },
            },
          },
        ],
        async (err, countOfDocs) => {
          if (err) {
            io.to(user.id).emit("err", { err: err.message });
            return;
          }
          await countOfDocs[0].boards.forEach((element) => {
            if (element.id === board._id && element.items.total >= 100) {
              limit = true;
            }
          });
        }
      );

      if (limit) {
        io.to(user.id).emit("err", { err: "Limit of tasks" });
        return;
      }

      var project = await Projects.findOne(
        { slug: user.TaskList },
        async (err) => {
          if (err) {
            io.to(user.id).emit("err", { err: err.message });
            return;
          }
        }
      );
      var performerUser = await Users.findOne(
        { username: crtTask.performer },
        (err) => {
          if (err) {
            io.to(user.id).emit("err", { err: err.message });
            return;
          }
        }
      );

      await ToDoLists.findOne(
        { projectSlug: user.TaskList },
        async (err, list) => {
          if (err) {
            io.to(user.id).emit("err", { err: err.message });
            return;
          }

          var newTask = new Tasks();
          newTask.text = crtTask.text;
          newTask.performer = crtTask.performer;
          newTask.description = crtTask.description;
          await list.boards.id(board._id).items.push(newTask);
          await list.save();
          if (newTask.performer) {
            console.log("send");
            var info = {
              notificationID: -1,
              email: performerUser.email,
              // title: project.title,
              subject: "Создание задачи.",
              theme: "Создание задачи.",
              text:
                "Пользователь " +
                user.username +
                " добавил вам задачу '" +
                crtTask.text +
                "'. В доске задач проекта '" +
                project.title +
                "'." +
                "<br>" +
                "Для перехода к доске задач проекта необходимо перейти в ваш " +
                "<div><a href =" +
                process.env.FRONT_URL +
                "profile/" +
                performerUser.username +
                ">профиль</a>." +
                " Затем найти нужную карточку проекта и нажать на стрелочку, которая находится в правом нижнем углу карточки.</div>",
            };
            nodemailer.sendMessageEmail(info);
          }
          io.to(user.id).emit("created-task", { status: "success" });
        }
      );
    });

    socket.on("update-task", async ({ board, updTask }) => {
      if (!board) {
        io.to(user.id).emit("err", { err: "Board are require" });
        return;
      }
      if (!updTask) {
        io.to(user.id).emit("err", { err: "updTask are require" });
        return;
      }

      var project = await Projects.findOne(
        { slug: user.TaskList },
        async (err) => {
          if (err) {
            io.to(user.id).emit("err", { err: err.message });
            return;
          }
        }
      );
      var creatorUser = await Users.findOne(
        { username: project.creatorName },
        (err) => {
          if (err) {
            io.to(user.id).emit("err", { err: err.message });
            return;
          }
        }
      );

      await ToDoLists.findOne(
        { projectSlug: user.TaskList },
        async (err, list) => {
          if (err) {
            io.to(user.id).emit("err", { err: err.message });
            return;
          }
          var additionText = "";
          var task = list.boards.id(board._id).items.id(updTask._id);
          if (updTask.text) {
            additionText =
              " изменил текст задачи с '" + task.text + "' на '" + updTask.text;
            task.text = updTask.text;
          } else {
            additionText = " изменил задачу '" + task.text;
          }
          if (updTask.performer) {
            task.performer = updTask.performer;
          }
          if (updTask.description) {
            task.description = updTask.description;
          }
          await list.save((err) => {
            if (err) {
              io.to(user.id).emit("err", { err: err.message });
              return;
            }
          });

          if (user.username !== project.creatorName) {
            console.log("send");
            var info = {
              notificationID: -1,
              email: creatorUser.email,
              // title: project.title,
              subject: "Изменение задачи.",
              theme: "Изменение задачи.",
              text:
                "Пользователь " +
                user.username +
                additionText +
                "'. В доске задач проекта '" +
                project.title +
                "'." +
                "<br>" +
                "Для перехода к доске задач проекта необходимо перейти в ваш " +
                "<div><a href =" +
                process.env.FRONT_URL +
                "profile/" +
                creatorUser.username +
                ">профиль</a>." +
                " Затем найти нужную карточку проекта и нажать на стрелочку, которая находится в правом нижнем углу карточки.</div>",
            };
            nodemailer.sendMessageEmail(info);
          }

          io.to(user.id).emit("updated-task", { status: "success" });
        }
      );
    });

    socket.on("move-task", async ({ oldBoard, newBoard, mvTask }) => {
      if (!oldBoard) {
        io.to(user.id).emit("err", { err: "oldBoard are require" });
        return;
      }
      if (!newBoard) {
        io.to(user.id).emit("err", { err: "newBoard are require" });
        return;
      }
      if (!mvTask) {
        io.to(user.id).emit("err", { err: "mvTask are require" });
        return;
      }

      var project = await Projects.findOne(
        { slug: user.TaskList },
        async (err) => {
          if (err) {
            io.to(user.id).emit("err", { err: err.message });
            return;
          }
        }
      );
      var creatorUser = await Users.findOne(
        { username: project.creatorName },
        (err) => {
          if (err) {
            io.to(user.id).emit("err", { err: err.message });
            return;
          }
        }
      );

      await ToDoLists.findOne(
        { projectSlug: user.TaskList },
        async (err, list) => {
          if (err) {
            io.to(user.id).emit("err", { err: err.message });
            return;
          }
          var task = await list.boards.id(oldBoard._id).items.id(mvTask._id);

          var obord = list.boards.id(oldBoard._id);
          var nbord = list.boards.id(newBoard._id);

          await list.boards.id(newBoard._id).items.push(task);
          await list.boards.id(oldBoard._id).items.pull(task);
          await list.save((err) => {
            if (err) {
              io.to(user.id).emit("err", { err: err.message });
              return;
            }
          });
          if (user.username !== project.creatorName) {
            console.log("send");
            var info = {
              notificationID: -1,
              email: creatorUser.email,
              // title: project.title,
              subject: "Перемещение задачи.",
              theme: "Перемещение задачи.",
              text:
                "Пользователь " +
                user.username +
                " переместил задачу '" +
                task.text +
                "' из '" +
                obord.name +
                "' в '" +
                nbord.name +
                "'. В доске задач проекта '" +
                project.title +
                "'." +
                "<br>" +
                "Для перехода к доске задач проекта необходимо перейти в ваш " +
                "<div><a href =" +
                process.env.FRONT_URL +
                "profile/" +
                creatorUser.username +
                ">профиль</a>." +
                " Затем найти нужную карточку проекта и нажать на стрелочку, которая находится в правом нижнем углу карточки.</div>",
            };
            nodemailer.sendMessageEmail(info);
          }
          io.to(user.id).emit("moved-task", { status: "success" });
        }
      );
    });

    socket.on("delete-task", async ({ board, delTask }) => {
      if (!board) {
        io.to(user.id).emit("err", { err: "Board are require" });
        return;
      }
      if (!delTask) {
        io.to(user.id).emit("err", { err: "delTask are require" });
        return;
      }

      var project = await Projects.findOne(
        { slug: user.TaskList },
        async (err) => {
          if (err) {
            io.to(user.id).emit("err", { err: err.message });
            return;
          }
        }
      );
      var creatorUser = await Users.findOne(
        { username: project.creatorName },
        (err) => {
          if (err) {
            io.to(user.id).emit("err", { err: err.message });
            return;
          }
        }
      );

      await ToDoLists.findOne(
        { projectSlug: user.TaskList },
        async (err, list) => {
          if (err) {
            io.to(user.id).emit("err", { err: err.message });
            return;
          }
          await list.boards.id(board._id).items.pull(delTask._id);
          await list.save();
          if (user.username !== project.creatorName) {
            console.log("send");
            var info = {
              notificationID: -1,
              email: creatorUser.email,
              // title: project.title,
              subject: "Удаление задачи.",
              theme: "Удаление задачи.",
              text:
                "Пользователь " +
                user.username +
                " удалил задачу '" +
                delTask.text +
                "'. В доске задач проекта '" +
                project.title +
                "'." +
                "<br>" +
                "Для перехода к доске задач проекта необходимо перейти в ваш " +
                "<div><a href =" +
                process.env.FRONT_URL +
                "profile/" +
                creatorUser.username +
                ">профиль</a>." +
                " Затем найти нужную карточку проекта и нажать на стрелочку, которая находится в правом нижнем углу карточки.</div>",
            };
            nodemailer.sendMessageEmail(info);
          }
          io.to(user.id).emit("deleted-task", { status: "success" });
        }
      );
    });

    counter++; //
  });
};
