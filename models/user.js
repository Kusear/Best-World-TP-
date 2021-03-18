var mongoose = require("mongoose");

var UserSchema = new mongoose.Schema({
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
  expire_at: {
    type: Date, 
    default: Date.now(),
    expires: 30
  }
});

module.exports = User = mongoose.model("users", UserSchema);
