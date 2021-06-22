const ToDoLists = require("../models/todoList_model").TODOList;
const Projects = require("../models/project").Project;
const Boards = require("../models/todoList_model").Boards;
const Tasks = require("../models/todoList_model").Tasks;
const Users = require("../models/user_model").User;
const nodemailer = require("../config/nodemailer");

const mongodb = require("mongodb");
const mongoose = require("mongoose");

module.exports = (io) => {
  var counter = 0; //

  io.on("connection", (socket) => {
    console.log("socket io connected Task" + socket.id + " " + counter);

    socket.on("get-TaskList", async ({ username, token, slug }) => {
      socket.data.TaskList = slug;
      socket.data.username = username;

      await Users.findOne({ username: socket.data.username }, (err, user) => {
        socket.data.taskListNotify = user.todoListNotify;
      });

      console.log("List: ", slug);
      await ToDoLists.findOne(
        { projectSlug: socket.data.TaskList },
        async (err, list) => {
          if (err) {
            io.to(socket.id).emit("err", { err: err.message });
            return;
          }

          if (!list) {
            console.log("list not found");
            socket.emit("err", {
              err: "list not found",
            });
            return socket.disconnect();
          }

          await Projects.findOne(
            { slug: socket.data.TaskList },
            (err, project) => {
              var isMember = false;
              project.projectMembers.forEach((element) => {
                if (element.username === socket.data.username) {
                  if (element.role === "Менеджер") {
                    socket.data.canChange = true;
                  }
                  isMember = true;
                  console.log("true in cycle");
                }
              });

              if (!isMember) {
                console.log("Not allowed");
                io.to(socket.id).emit("err", { status: -1 });
                return socket.disconnect();
              }

              if (
                username === project.creatorName ||
                username === project.managerName
              ) {
                socket.data.canChange = true;
                console.log("Creator: ", socket.data.canChange);
              }

              var gfs = new mongodb.GridFSBucket(
                mongoose.connection.db,
                mongoose.mongo
              );
              var membersList = [];
              var i = 0;
              project.projectMembers.forEach(async (element) => {
                await Users.findOne(
                  { username: element.username },
                  (err, userBD) => {
                    var endSTR = "";
                    var user = {
                      username: element.username,
                      role: element.role,
                      image: "",
                      canChange: false,
                    };

                    if (
                      element.username === project.creatorName ||
                      element.username === project.managerName
                    ) {
                      user.canChange = true;
                    }

                    gfs
                      .openDownloadStreamByName(userBD.image, {
                        revision: -1,
                      })
                      .on("data", (chunk) => {
                        console.log("CHUNK: ", chunk);
                        endSTR += Buffer.from(chunk, "hex").toString("base64");
                      })
                      .on("error", function (err) {
                        console.log("ERR: ", err);
                        user.image = "default";
                        membersList.push(user);
                        if (i == project.projectMembers.length - 1) {
                          socket.join(list.projectSlug);
                          io.to(socket.id).emit("listData", {
                            list: list,
                            title: project.title,
                            projectid: project._id,
                            files: project.project.projectFiles,
                            members: membersList,
                          });
                          return;
                        }
                        i++;
                      })
                      .on("close", () => {
                        if (userBD.image !== "default") {
                          user.image = endSTR;
                        }
                        membersList.push(user);
                        if (i == project.projectMembers.length - 1) {
                          socket.join(list.projectSlug);
                          io.to(socket.id).emit("listData", {
                            list: list,
                            title: project.title,
                            projectid: project._id,
                            files: project.projectFiles,
                            members: membersList,
                          });
                          return;
                        }
                        i++;
                      });
                  }
                );
              });
            }
          );
        }
      );
    });

    socket.on("create-board", async ({ crtBoard }) => {
      if (!crtBoard) {
        io.to(socket.id).emit("err", { err: "Board are require" });
        return;
      }

      if (socket.data.canChange == false) {
        io.to(socket.id).emit("err", { err: "Not allowed" });
        return;
      }

      var limit = false;
      await ToDoLists.aggregate(
        [
          { $match: { projectSlug: socket.data.TaskList } },
          { $unwind: "$boards" },
          { $group: { _id: null, count: { $sum: 1 } } },
        ],
        (err, countOfDocs) => {
          if (err) {
            console.log("err: ", err.message);
          }
          if (countOfDocs[0]) {
            console.log("parasha: ", countOfDocs[0].count);
            if (countOfDocs[0].count >= 10) {
              limit = true;
            }
          }
        }
      );

      await ToDoLists.findOne(
        { projectSlug: socket.data.TaskList },
        (err, taskList) => {
          if (err) {
            io.to(socket.id).emit("err", { err: err.message });
            return;
          }
          if (taskList.boards.length >= 10) {
            limit = true;
          }
        }
      );

      if (limit) {
        io.to(socket.id).emit("err", { err: "Limit of boards" });
        return;
      }

      var project = await Projects.findOne(
        { slug: socket.data.TaskList },
        async (err) => {
          if (err) {
            io.to(socket.id).emit("err", { err: err.message });
            return;
          }
        }
      );

      var creatorUser = await Users.findOne(
        { username: project.creatorName },
        (err) => {
          if (err) {
            io.to(socket.id).emit("err", { err: err.message });
            return;
          }
        }
      );

      await ToDoLists.findOne(
        { projectSlug: socket.data.TaskList },
        async (err, list) => {
          if (err) {
            io.to(socket.id).emit("err", { err: err.message });
            return;
          }
          console.log("todolist");
          var newBoard = new Boards();
          newBoard.name = crtBoard.name;
          newBoard.color = crtBoard.color;
          newBoard.items = crtBoard.items;
          list.boards.push(newBoard);
          list.save();
          if (
            socket.data.username !== project.creatorName &&
            socket.data.taskListNotify
          ) {
            console.log("send");
            var info = {
              notificationID: -1,
              email: creatorUser.email,
              // title: project.title,
              subject: "Создание доски.",
              theme: "Создание доски.",
              text:
                "Пользователь " +
                socket.data.username +
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
          io.to(socket.data.TaskList).emit("created-board", {
            status: "success",
            board: newBoard,
          });
        }
      );
    });

    socket.on("update-board", async ({ updBoard }) => {
      if (!updBoard) {
        io.to(socket.id).emit("err", { err: "updBoard are require" });
        return;
      }

      if (socket.data.canChange == false) {
        io.to(socket.id).emit("err", { err: "Not allowed" });
        return;
      }

      if (!updBoard.name || updBoard.name === "") {
        io.to(socket.id).emit("err", {
          err: "Название столбца не должно быть пустое",
        });
        return;
      }

      var project = await Projects.findOne(
        { slug: socket.data.TaskList },
        async (err) => {
          if (err) {
            io.to(socket.id).emit("err", { err: err.message });
            return;
          }
        }
      );

      var creatorUser = await Users.findOne(
        { username: project.creatorName },
        (err) => {
          if (err) {
            io.to(socket.id).emit("err", { err: err.message });
            return;
          }
        }
      );

      await ToDoLists.findOne(
        { projectSlug: socket.data.TaskList },
        async (err, list) => {
          if (err) {
            io.to(socket.id).emit("err", { err: err.message });
            return;
          }

          var board = await list.boards.id(updBoard._id);
          var boardname = board.name;
          var additionText = "";
          if (updBoard.name) {
            additionText =
              " изменил название доски с '" +
              board.name +
              "' на '" +
              updBoard.name +
              "' и произвел некоторые изменения";
            board.name = updBoard.name;
          }
          if (updBoard.color) {
            board.color = updBoard.color;
          }
          await list.save((err) => {
            if (err) {
              io.to(socket.id).emit("err", { err: err.message });
              return;
            }
          });
          if (
            socket.data.username !== project.creatorName &&
            socket.data.taskListNotify
          ) {
            console.log("send");
            var info = {
              notificationID: -1,
              email: creatorUser.email,
              // title: project.title,
              subject: "Создание доски.",
              theme: "Создание доски.",
              text:
                "Пользователь " +
                socket.data.username +
                additionText +
                ". В доске задач проекта " +
                project.title +
                "<br>" +
                "Для просмотра доски задач проекта необходимо перейти в ваш " +
                "<div><a href =" +
                process.env.FRONT_URL +
                "profile/" +
                creatorUser.username +
                ">профиль</a>." +
                " Затем найти нужную карточку проекта и нажать на стрелочку, которая находится в правом нижнем углу карточки.</div>",
            };
            nodemailer.sendMessageEmail(info);
          }
          io.to(socket.data.TaskList).emit("updated-board", {
            status: "success",
            board: board,
          });
        }
      );
    });

    socket.on("delete-board", async ({ delBoard }) => {
      if (!delBoard) {
        io.to(socket.id).emit("err", {
          err: "delBoard are required",
        });
        return;
      }

      if (socket.data.canChange == false) {
        io.to(socket.id).emit("err", { err: "Not allowed" });
        return;
      }

      var project = await Projects.findOne(
        { slug: socket.data.TaskList },
        (err) => {
          if (err) {
            io.to(socket.id).emit("err", { err: err.message });
            return;
          }
        }
      );

      var creatorUser = await Users.findOne(
        { username: project.creatorName },
        (err) => {
          if (err) {
            io.to(socket.id).emit("err", { err: err.message });
            return;
          }
        }
      );

      var bordItem;
      await ToDoLists.findOne(
        { projectSlug: socket.data.TaskList },
        async (err, list) => {
          if (err) {
            io.to(socket.id).emit("err", { err: err.message });
            return;
          }
          bordItem = await list.boards.id(
            mongoose.Types.ObjectId(delBoard._id)
          );
          list.boards.pull(mongoose.Types.ObjectId(delBoard._id));
          await list.save();
          if (
            socket.data.username !== project.creatorName &&
            socket.data.taskListNotify
          ) {
            console.log("send");
            var info = {
              notificationID: -1,
              email: creatorUser.email,
              // title: project.title,
              subject: "Создание доски.",
              theme: "Создание доски.",
              text:
                "Пользователь " +
                socket.data.username +
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
          io.to(socket.data.TaskList).emit("deleted-board", {
            board: bordItem,
          });
        }
      );
    });

    socket.on("create-task", async ({ board, crtTask }) => {
      if (!board) {
        io.to(socket.id).emit("err", { err: "Board are require" });
        return;
      }
      if (!crtTask) {
        io.to(socket.id).emit("err", { err: "crtTask are require" });
        return;
      }

      if (!crtTask.text || crtTask.text === "") {
        io.to(socket.id).emit("err", {
          err: "Название задачи не должно быть пустым",
        });
        return;
      }

      var limit = false;
      await ToDoLists.aggregate(
        [
          {
            $match: { projectSlug: socket.data.TaskList },
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
            io.to(socket.id).emit("err", { err: err.message });
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
        io.to(socket.id).emit("err", { err: "Limit of tasks" });
        return;
      }

      var project = await Projects.findOne(
        { slug: socket.data.TaskList },
        async (err) => {
          if (err) {
            io.to(socket.id).emit("err", { err: err.message });
            return;
          }
        }
      );
      var performerUser = await Users.findOne(
        { username: crtTask.performer },
        (err) => {
          if (err) {
            io.to(socket.id).emit("err", { err: err.message });
            return;
          }
        }
      );

      await ToDoLists.findOne(
        { projectSlug: socket.data.TaskList },
        async (err, list) => {
          if (err) {
            io.to(socket.id).emit("err", { err: err.message });
            return;
          }
          var taskExist = false;
          list.boards.forEach((element) => {
            element.items.forEach((arrayTask) => {
              if (
                arrayTask.text === crtTask.text &&
                arrayTask.performer === crtTask.performer &&
                arrayTask.description === crtTask.description &&
                arrayTask.timeStartWork === crtTask.timeStartWork &&
                arrayTask.timeEndWork === crtTask.timeEndWork
              ) {
                taskExist = true;
              }
            });
          });

          if (taskExist) {
            io.to(socket.id).emit("err", { err: "Задача уже существует" });
            return;
          }

          var newTask = new Tasks();
          newTask.text = crtTask.text;
          newTask.performer = crtTask.performer;
          newTask.description = crtTask.description;
          newTask.timeStartWork = crtTask.timeStartWork;
          newTask.timeEndWork = crtTask.timeEndWork;
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
                socket.data.username +
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
          io.to(socket.data.TaskList).emit("created-task", {
            task: newTask,
            board: board,
          });
        }
      );
    });

    socket.on("update-task", async ({ board, updTask }) => {
      // TODO в board приходит id нового борда рпи перемещении
      if (!board) {
        io.to(socket.id).emit("err", { err: "Board are require" });
        return;
      }
      if (!updTask) {
        io.to(socket.id).emit("err", { err: "updTask are require" });
        return;
      }

      if (!updTask.text || updTask.text === "") {
        io.to(socket.id).emit("err", {
          err: "Название задачи не должно быть пустым",
        });
        return;
      }

      var project = await Projects.findOne(
        { slug: socket.data.TaskList },
        async (err) => {
          if (err) {
            io.to(socket.id).emit("err", { err: err.message });
            return;
          }
        }
      );
      var creatorUser = await Users.findOne(
        { username: project.creatorName },
        (err) => {
          if (err) {
            io.to(socket.id).emit("err", { err: err.message });
            return;
          }
        }
      );

      await ToDoLists.findOne(
        { projectSlug: socket.data.TaskList },
        async (err, list) => {
          if (err) {
            io.to(socket.id).emit("err", { err: err.message });
            return;
          }
          var additionText = "";
          var task = await list.boards
            .id(mongoose.Types.ObjectId(board._id))
            .items.id(mongoose.Types.ObjectId(updTask._id));
          if (updTask.text) {
            additionText =
              " изменил текст задачи с '" + task.text + "' на '" + updTask.text;
            task.text = updTask.text;
          } else {
            additionText = " изменил задачу '" + task.text;
          }
          task.performer = updTask.performer;
          task.description = updTask.description;
          task.timeEndWork = updTask.timeEndWork;
          task.timeStartWork = updTask.timeStartWork;

          await list.save((err) => {
            if (err) {
              io.to(socket.id).emit("err", { err: err.message });
              return;
            }
          });

          if (
            socket.data.username !== project.creatorName &&
            socket.data.taskListNotify
          ) {
            console.log("send");
            var info = {
              notificationID: -1,
              email: creatorUser.email,
              // title: project.title,
              subject: "Изменение задачи.",
              theme: "Изменение задачи.",
              text:
                "Пользователь " +
                socket.data.username +
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

          io.to(socket.data.TaskList).emit("updated-task", {
            board: board,
            task: task,
          });

          if (board._id !== board._newBoardId) {
            var obord = await list.boards.id(
              mongoose.Types.ObjectId(board._id)
            );
            var nbord = await list.boards.id(
              mongoose.Types.ObjectId(board._newBoardId)
            );
            if (nbord.items.length >= 100) {
              io.to(socket.id).emit("limit-in-newBoard", { err: "limit" });
              return;
            }

            await list.boards
              .id(mongoose.Types.ObjectId(obord._id))
              .items.pull(updTask);
            await list.boards
              .id(mongoose.Types.ObjectId(nbord._id))
              .items.push(updTask);
            await list.save((err) => {
              if (err) {
                io.to(socket.id).emit("err", { err: err.message });
                return;
              }
            });
            io.to(socket.data.TaskList).emit("moved-task", {
              from: obord._id,
              to: nbord._id,
              task: updTask,
            });
          }
        }
      );
    });

    socket.on("move-task", async ({ oldBoard, newBoard, mvTask }) => {
      if (!oldBoard) {
        io.to(socket.id).emit("err", { err: "oldBoard are require" });
        return;
      }
      if (!newBoard) {
        io.to(socket.id).emit("err", { err: "newBoard are require" });
        return;
      }
      if (!mvTask) {
        io.to(socket.id).emit("err", { err: "mvTask are require" });
        return;
      }

      var project = await Projects.findOne(
        { slug: socket.data.TaskList },
        async (err) => {
          if (err) {
            io.to(socket.id).emit("err", { err: err.message });
            return;
          }
        }
      );
      var creatorUser = await Users.findOne(
        { username: project.creatorName },
        (err) => {
          if (err) {
            io.to(socket.id).emit("err", { err: err.message });
            return;
          }
        }
      );

      await ToDoLists.findOne(
        { projectSlug: socket.data.TaskList },
        async (err, list) => {
          if (err) {
            io.to(socket.id).emit("err", { err: err.message });
            return;
          }
          var task = await list.boards
            .id(mongoose.Types.ObjectId(oldBoard._id))
            .items.id(mongoose.Types.ObjectId(mvTask._id));

          var obord = await list.boards.id(
            mongoose.Types.ObjectId(oldBoard._id)
          );
          var nbord = await list.boards.id(
            mongoose.Types.ObjectId(newBoard._id)
          );
          if (nbord.items.length >= 100) {
            io.to(socket.id).emit("limit-in-newBoard", { err: "limit" });
            return;
          }

          await list.boards
            .id(mongoose.Types.ObjectId(oldBoard._id))
            .items.pull(task);
          await list.boards
            .id(mongoose.Types.ObjectId(newBoard._id))
            .items.push(task);
          await list.save((err) => {
            if (err) {
              io.to(socket.id).emit("err", { err: err.message });
              return;
            }
          });
          if (
            socket.data.username !== project.creatorName &&
            socket.data.taskListNotify
          ) {
            console.log("send");
            var info = {
              notificationID: -1,
              email: creatorUser.email,
              // title: project.title,
              subject: "Перемещение задачи.",
              theme: "Перемещение задачи.",
              text:
                "Пользователь " +
                socket.data.username +
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
          io.to(socket.data.TaskList).emit("moved-task", {
            from: oldBoard._id,
            to: newBoard._id,
            task: mvTask,
          });
        }
      );
    });

    socket.on("delete-task", async ({ board, delTask }) => {
      if (!board) {
        io.to(socket.id).emit("err", { err: "Board are require" });
        return;
      }
      if (!delTask) {
        io.to(socket.id).emit("err", { err: "delTask are require" });
        return;
      }

      var project = await Projects.findOne(
        { slug: socket.data.TaskList },
        async (err) => {
          if (err) {
            io.to(socket.id).emit("err", { err: err.message });
            return;
          }
        }
      );
      var creatorUser = await Users.findOne(
        { username: project.creatorName },
        (err) => {
          if (err) {
            io.to(socket.id).emit("err", { err: err.message });
            return;
          }
        }
      );

      await ToDoLists.findOne(
        { projectSlug: socket.data.TaskList },
        async (err, list) => {
          if (err) {
            io.to(socket.id).emit("err", { err: err.message });
            return;
          }
          await list.boards
            .id(mongoose.Types.ObjectId(board._id))
            .items.pull(mongoose.Types.ObjectId(delTask._id));
          await list.save();
          if (
            socket.data.username !== project.creatorName &&
            socket.data.taskListNotify
          ) {
            console.log("send");
            var info = {
              notificationID: -1,
              email: creatorUser.email,
              // title: project.title,
              subject: "Удаление задачи.",
              theme: "Удаление задачи.",
              text:
                "Пользователь " +
                socket.data.username +
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
          io.to(socket.data.TaskList).emit("deleted-task", {
            board: board,
            task: delTask,
          });
        }
      );
    });

    counter++; //

    socket.on("update-files", ({ filesInfo }) => {
      io.to(socket.data.TaskList).emit("updated-files", filesInfo);
      return;
    });
  });
};

var isProjectMember = async (username, slug) => {
  console.log("slug:", slug);
  console.log("username:", username);
  await Projects.findOne({ slug: slug }, async function (err, project) {
    if (err) {
      return false;
    }
    if (!project) {
      return false;
    }
    var members = project.projectMembers;
    var member = false;

    members.forEach((element) => {
      if (element.username === username) {
        member = true;
        console.log("true in cycle");
      }
    });

    if (member) {
      console.log("true");
      return true;
    } else {
      console.log("false");
      return false;
    }
  });
};
