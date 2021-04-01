var mongoose = require("mongoose");

var UserSchema = new mongoose.Schema({
  username: {
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

exports.userCollection = "users";
exports.User = mongoose.model("users", UserSchema);
