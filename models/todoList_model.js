const mongoose = require("mongoose");

const TODOListShema = new mongoose.Schema({
  projectSlug: {
    type: String,
    require: true,
  },
  boards: [
    {
      name: {
        type: String,
        require: true,
      },
      items: [],
      color: {
        type: String,
      },
    },
  ],
});

exports.TODOList = mongoose.model("TODOLists", TODOListShema);
