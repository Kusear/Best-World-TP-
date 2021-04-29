const ToDoLists = require("../models/todoList_model").TODOList;
const Projects = require("../models/project").Project;

exports.getProjectTODOList = async (req, res) => {
  var projectSlug = req.params.projectSlug;
  if (!projectSlug) {
    return res.status(400).json({ err: "projectSlug are required" }).end();
  }
  await ToDoLists.findOne({ projectSlug: projectSlug }, (err, list) => {
    if (err) {
      return res.status(400).json({ err: err.message }).end();
    }
    if (!list) {
      return res.status(400).json({ message: "list not found" }).end();
    }
    return res.status(200).json(list).end();
  });
};

exports.createToDoList = async (req, res) => {
  var projectSlug = req.body.projectSlug;
  if (!projectSlug) {
    return res.status(400).json({ err: "projectSlug are required" }).end();
  }

  var board = await ToDoLists.findOne({ projectSlug: projectSlug }, (err) => {
    if (err) {
      return res.status(400).json({ err: err.message }).end();
    }
  });
  if (board) {
    return res.status(400).json({ message: "Board already exist" }).end();
  }

  var project = await Projects.findOne({ slug: projectSlug }, (err) => {
    if (err) {
      return res.status(400).json({ err: err.message }).end();
    }
  });
  if (!project) {
    return res.status(400).json({ message: "Project doesnt exist" }).end();
  }

  const List = await new ToDoLists({
    projectSlug: projectSlug,
    color: req.body.color,
    boards: req.body.boards,
  });

  await List.save();
  return res.status(200).json({ message: "success" }).end();
};

exports.updeteToDoList = async (req, res) => {
  var projectSlug = req.body.projectSlug;
  if (!projectSlug) {
    return res.status(400).json({ err: "projectSlug are required" }).end();
  }
  var List = await ToDoLists.findOne({ projectSlug: projectSlug }, (err) => {
    if (err) {
      return res.status(400).json({ err: err.message }).end();
    }
  });
  if (!List) {
    return res.status(400).json({ message: "List not found" }).end();
  }
  var newList = {
    projectSlug: req.body.projectSlug,
    color: req.body.color,
    boards: req.body.boards,
  };
  List = newList;
  List.update((err) => {
    if (err) {
      return res.status(400).json({ err: err.message }).end();
    }
  });
  return res.status(200).json({ message: "seccess" }).end();
};