var mongoose = require("mongoose");

var ModerSchema = new mongoose.Schema({
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

module.exports = Moder = mongoose.model("users", UserSchema);