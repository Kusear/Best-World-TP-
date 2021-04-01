var mongoose = require("mongoose");

var AdminSchema = new mongoose.Schema({
  name: {
    type: String
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String
  },
  info: {
    type: String
  },
  role: {
    type: String
  }
  /*expire_at: {
    type: Date, 
    default: Date.now(),
    expires: 30 //sec
  }*/ // для удаления через время
});

module.exports = Admin = mongoose.model("users", UserSchema);