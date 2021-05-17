const ToDoLists = require("../models/todoList_model").TODOList;
const Projects = require("../models/project").Project;
const Boards = require("../models/todoList_model").Boards;
const Tasks = require("../models/todoList_model").Tasks;

module.exports = (io) => {
  var counter = 0; //
  var user = {
    id: "",
    username: "",
    TaskList: "",
  };

  io.on("connection", (socket) => {
    console.log("socket io connected " + socket.id + " " + counter);
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
        console.log("List: ", user.TaskList);
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

      await ToDoLists.findOne(
        { projectSlug: user.TaskList },
        async (err, list) => {
          if (err) {
            io.to(user.id).emit("err", { err: err.message });
            return;
          }
          var newBoard = new Boards();
          newBoard.name = crtBoard.name;
          newBoard.color = crtBoard.color;
          newBoard.items = crtBoard.items;
          list.boards.push(newBoard);
          list.save();
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

      await ToDoLists.findOne(
        { projectSlug: user.TaskList },
        async (err, list) => {
          if (err) {
            io.to(user.id).emit("err", { err: err.message });
            return;
          }
          var board = list.boards.id(updBoard._id);
          if (updBoard.name) {
            board.name = updBoard.name;
          }
          if (updBoard.color) {
            board.color = updBoard.color;
          }
          await list.save((err) => {
            if (err) {
              io.to(user.id).emit("err", { err: err.message });
              return;
            }
          });
          io.to(user.id).emit("updated-board", {
            status: success,
            board: board,
          });
        }
      );
    });

    socket.on("delete-board", async ({ delBoard }) => {
      if (!delBoard) {
        io.emit("err", {
          err: "delBoard are required",
        });
        return;
      }
      await ToDoLists.findOne(
        { projectSlug: user.TaskList },
        async (err, list) => {
          if (err) {
            io.to(user.id).emit("err", { err: err.message });
            return;
          }
          list.boards.pull(delBoard._id);
          await list.save();
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

      await ToDoLists.findOne(
        { projectSlug: user.TaskList },
        async (err, list) => {
          if (err) {
            io.to(user.id).emit("err", { err: err.message });
            return;
          }
          var task = list.boards.id(board._id).items.id(updTask._id);
          if (updTask.text) {
            task.text = updTask.text;
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

      await ToDoLists.findOne(
        { projectSlug: user.TaskList },
        async (err, list) => {
          if (err) {
            io.to(user.id).emit("err", { err: err.message });
            return;
          }
          var task = await list.boards.id(oldBoard._id).items.id(mvTask._id);

          await list.boards.id(newBoard._id).items.push(task);
          await list.boards.id(oldBoard._id).items.pull(task);
          await list.save((err) => {
            if (err) {
              io.to(user.id).emit("err", { err: err.message });
              return;
            }
          });
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

      await ToDoLists.findOne(
        { projectSlug: user.TaskList },
        async (err, list) => {
          if (err) {
            io.to(user.id).emit("err", { err: err.message });
            return;
          }
          await list.boards.id(board._id).items.pull(delTask._id);
          await list.save();
          io.to(user.id).emit("deleted-task", { status: "success" });
        }
      );
    });

    counter++; //
  });
};
