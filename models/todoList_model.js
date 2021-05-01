const mongoose = require("mongoose");

const Tasks = new mongoose.Schema({
  text: {
    type: String,
  },
  performer: {
    type: String,
  },
});

const BoardsSchema = new mongoose.Schema({
  name: {
    type: String,
    require: true,
    trim: true,
  },
  items: [Tasks],
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