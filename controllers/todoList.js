const ToDoLists = require("../models/todoList_model").TODOList;
const Projects = require("../models/project").Project;
const Boards = require("../models/todoList_model").Boards;
const Tasks = require("../models/todoList_model").Tasks;

exports.getProjectTODOList = async (req, res) => {
  var projectSlug = req.query.projectSlug;
  if (!projectSlug) {
    return res.status(500).json({ err: "projectSlug are required" }).end();
  }
  await ToDoLists.findOne({ projectSlug: projectSlug }, (err, list) => {
    if (err) {
      return res.status(500).json({ err: err.message }).end();
    }
    if (!list) {
      return res.status(500).json({ message: "list not found" }).end();
    }
    return res.status(200).json(list).end();
  });
};

exports.createToDoList = async (req, res) => {
  var projectSlug = req.body.projectSlug;
  if (!projectSlug) {
    return res.status(500).json({ err: "projectSlug are required" }).end();
  }

  var board = await ToDoLists.findOne({ projectSlug: projectSlug }, (err) => {
    if (err) {
      return res.status(500).json({ err: err.message }).end();
    }
  });
  if (board) {
    return res.status(500).json({ message: "Board already exist" }).end();
  }

  var project = await Projects.findOne({ slug: projectSlug }, (err) => {
    if (err) {
      return res.status(500).json({ err: err.message }).end();
    }
  });
  if (!project) {
    return res.status(500).json({ message: "Project doesnt exist" }).end();
  }

  const List = await new ToDoLists({
    projectSlug: projectSlug,
    boards: req.body.boards,
  });

  await List.save();
  return res.status(200).json(List).end();
};

exports.updeteToDoList = async (req, res) => {
  var projectSlug = req.body.projectSlug;

  if (!projectSlug) {
    return res.status(500).json({ err: "projectSlug are required" }).end();
  }
  var List = await ToDoLists.findOne({ projectSlug: projectSlug }, (err) => {
    if (err) {
      return res.status(500).json({ err: err.message }).end();
    }
  });

  if (!List) {
    return res.status(500).json({ message: "List not found" }).end();
  }
  var newList = {
    color: req.body.color,
    boards: req.body.boards,
  };

  List.updateOne(newList, (err) => {
    if (err) {
      return res.status(500).json({ err: err.message }).end();
    }
    return res.status(200).json({ message: "seccess" }).end();
  });
};

exports.createBoard = async (req, res) => {
  var projectSlug = req.body.projectSlug;
  if (!projectSlug) {
    return res.status(500).json({ err: "projectSlug are required" }).end();
  }
  console.log(projectSlug);
  await ToDoLists.findOne(
    { projectSlug: projectSlug },
    async (err, list) => {
      if (err) {
        return res.status(500).json({ err: err.message }).end();
      }
      var newBoard = new Boards();
      newBoard.name = req.body.name;
      newBoard.color = req.body.color;
      newBoard.items = req.body.items;
      list.boards.push(newBoard);
      list.save();
      return res
        .status(200)
        .json({ message: "seccess", boardID: newBoard.id })
        .end();
    }
  );
};

exports.updateBoard = async (req, res) => {
  var projectSlug = req.body.projectSlug;
  if (!projectSlug) {
    return res.status(500).json({ err: "projectSlug are required" }).end();
  }
  var todoList = await ToDoLists.findOne(
    { projectSlug: projectSlug },
    async (err, list) => {
      if (err) {
        return res.status(500).json({ err: err.message }).end();
      }
      var board = list.boards.id(req.body.boardID);
      if (req.body.name) {
        board.name = req.body.name;
      }
      if (req.body.color) {
        board.color = req.body.color;
      }
      await list.save((err) => {
        if (err) {
          return res.status(520).json({ err: err.message }).end();
        }
      });
      return res.status(200).json({ message: "seccess" }).end();
    }
  );
};

exports.deleteBoard = async (req, res) => {
  var projectSlug = req.body.projectSlug;
  if (!projectSlug) {
    return res.status(500).json({ err: "projectSlug are required" }).end();
  }
  var todoList = await ToDoLists.findOne(
    { projectSlug: projectSlug },
    async (err, list) => {
      if (err) {
        return res.status(500).json({ err: err.message }).end();
      }
      list.boards.pull(req.body.boardID);
      await list.save();
      return res.status(200).json({ message: "seccess" }).end();
    }
  );
};

exports.createTask = async (req, res) => {
  var projectSlug = req.body.projectSlug;
  if (!projectSlug) {
    return res.status(500).json({ err: "projectSlug are required" }).end();
  }
  await ToDoLists.findOne(
    { projectSlug: projectSlug },
    async (err, list) => {
      if (err) {
        return res.status(500).json({ err: err.message }).end();
      }
      var newTask = new Tasks();
      newTask.text = req.body.text;
      newTask.performer = req.body.performer;
      newTask.description = req.body.description;
      await list.boards.id(req.body.boardID).items.push(newTask);
      await list.save();
      return res
        .status(200)
        .json({ message: "seccess", taskID: newTask.id })
        .end();
    }
  );
};

exports.updateTask = async (req, res) => {
  var projectSlug = req.body.projectSlug;
  if (!projectSlug) {
    return res.status(500).json({ err: "projectSlug are required" }).end();
  }
  await ToDoLists.findOne(
    { projectSlug: projectSlug },
    async (err, list) => {
      if (err) {
        return res.status(500).json({ err: err.message }).end();
      }
      var task = list.boards.id(req.body.boardID).items.id(req.body.taskID);
      if (req.body.text) {
        task.text = req.body.text;
      }
      if (req.body.performer) {
        task.performer = req.body.performer;
      }
      if (req.body.description) {
        task.description = req.body.description;
      }
      await list.save((err) => {
        if (err) {
          return res.status(520).json({ err: err.message }).end();
        }
      });
      return res.status(200).json({ message: "seccess" }).end();
    }
  );
};

exports.moveTask = async (req, res) => {
  var projectSlug = req.body.projectSlug;
  if (!projectSlug) {
    return res.status(500).json({ err: "projectSlug are required" }).end();
  }
  await ToDoLists.findOne(
    { projectSlug: projectSlug },
    async (err, list) => {
      if (err) {
        return res.status(500).json({ err: err.message }).end();
      }
      var task = await list.boards
        .id(req.body.oldBoard)
        .items.id(req.body.taskID);
      console.log(task);
      await list.boards.id(req.body.newBoard).items.push(task);
      await list.boards.id(req.body.oldBoard).items.pull(task);
      await list.save((err) => {
        if (err) {
          return res.status(520).json({ err: err.message }).end();
        }
      });
      return res.status(200).json({ message: "seccess" }).end();
    }
  );
};

exports.deleteTask = async (req, res) => {
  var projectSlug = req.body.projectSlug;
  if (!projectSlug) {
    return res.status(500).json({ err: "projectSlug are required" }).end();
  }
  await ToDoLists.findOne({ projectSlug: projectSlug }, async (err, list) => {
    if (err) {
      return res.status(500).json({ err: err.message }).end();
    }
    await list.boards.id(req.body.boardID).items.pull(req.body.taskID);
    await list.save();
    return res.status(200).json({ message: "seccess" }).end();
  });
};
