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
  return res.status(200).json({ message: "success" }).end();
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
  var slug = req.body.slug;
  if (!slug) {
    return res.status(500).json({ err: "slug are required" }).end();
  }
  console.log(slug);
  var todoList = await ToDoLists.findOne({ projectSlug: slug }, async (err, list) => {
    if (err) {
      return res.status(500).json({ err: err.message }).end();
    }
    var newBoard = new Boards();
    newBoard.name = req.body.name;
    newBoard.color = req.body.color;
    newBoard.items = req.body.items;
    list.boards.push(newBoard);
    list.save();
    return res.status(200).json({ message: "seccess" }).end();
  });
};

exports.updateBoard = async (req, res) => {
  var projectSlug = req.body.projectSlug;
  if (!projectSlug) {
    return res.status(500).json({ err: "projectSlug are required" }).end();
  }
  var todoList = await ToDoLists.findOne(
    { projectSlug: projectSlug },
    (err) => {
      if (err) {
        return res.status(500).json({ err: err.message }).end();
      }
    }
  );
  var board = todoList.boards.id(req.body.boardID);

  if (req.body.name) {
    board.name = req.body.name;
  }
  if (req.body.color) {
    board.color = req.body.color;
  }

  board.update((err) => {
    if (err) {
      return res.status(520).json({ err: err.message }).end();
    }
  });

  return res.status(200).json({ message: "seccess" }).end();
};

exports.deleteBoard = async (req, res) => {
  var projectSlug = req.body.projectSlug;
  if (!projectSlug) {
    return res.status(500).json({ err: "projectSlug are required" }).end();
  }
  var todoList = await ToDoLists.findOne(
    { projectSlug: projectSlug },
    (err) => {
      if (err) {
        return res.status(500).json({ err: err.message }).end();
      }
    }
  );
  var board = todoList.boards.id(req.body.boardID);
  board.remove((err) => {
    return res.status(520).json({ err: err.massage }).end();
  });
  return res.status(200).json({ message: "seccess" }).end();
};

exports.createTask = async (req, res) => {
  var projectSlug = req.body.projectSlug;
  if (!projectSlug) {
    return res.status(500).json({ err: "projectSlug are required" }).end();
  }
  var todoList = await ToDoLists.findOne(
    { projectSlug: projectSlug },
    (err, list) => {
      if (err) {
        return res.status(500).json({ err: err.message }).end();
      }
      var newTask = new Tasks();
      newTask.text = req.body.text;
      newTask.performer = req.body.performer;
      list.boards.id(req.body.boardID).items.push(newTask);
      list.save();
      return res.status(200).json({ message: "seccess" }).end();
    }
  );
};

exports.updateTask = async (req, res) => {
  var projectSlug = req.body.projectSlug;
  if (!projectSlug) {
    return res.status(500).json({ err: "projectSlug are required" }).end();
  }
  var todoList = await ToDoLists.findOne(
    { projectSlug: projectSlug },
    (err) => {
      if (err) {
        return res.status(500).json({ err: err.message }).end();
      }
    }
  );
  var task = todoList.boards.id(req.body.boardID).items.id(req.body.taskID);

  if (req.body.text) {
    task.text = req.body.text;
  }
  if (req.body.performer) {
    task.performer = req.body.performer;
  }

  await task.update((err) => {
    if (err) {
      return res.status(520).json({ err: err.message }).end();
    }
  });
  return res.status(200).json({ message: "seccess" }).end();
};

exports.deleteTask = async (req, res) => {
  var projectSlug = req.body.projectSlug;
  if (!projectSlug) {
    return res.status(500).json({ err: "projectSlug are required" }).end();
  }
  var todoList = await ToDoLists.findOne(
    { projectSlug: projectSlug },
    (err) => {
      if (err) {
        return res.status(500).json({ err: err.message }).end();
      }
    }
  );
  var task = todoList.boards.id(req.body.boardID).items.id(req.body.taskID);
  await task.remove((err) => {
    if (err) {
      return res.status(520).json({ err: err.message }).end();
    }
  });
  return res.status(200).json({ message: "seccess" }).end();
};
