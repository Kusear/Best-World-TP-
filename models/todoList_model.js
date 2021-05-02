const mongoose = require("mongoose");

const Tasks = new mongoose.Schema({
  text: {
    type: String,
  },
  performer: {
    type: String,
  },
  description: {
    type: String,
  },
});

const BoardsSchema = new mongoose.Schema({
  name: {
    type: String,
    require: true,
    trim: true,
  },
  items: {
    type: [Tasks],
    default: [],
  },
  color: {
    type: String,
  },
});

const TODOListShema = new mongoose.Schema({
  projectSlug: {
    type: String,
    require: true,
  },
  boards: {
    type: [BoardsSchema],
    default: [],
  },
});

exports.TODOList = mongoose.model("TODOLists", TODOListShema);
exports.Boards = mongoose.model("boards", BoardsSchema);
exports.Tasks = mongoose.model("tasks", Tasks);
