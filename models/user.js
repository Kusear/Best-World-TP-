var mongoose = require("mongoose");

var UserSchema = new mongoose.Schema({
  /*expire_at: {
    type: Date, 
    default: Date.now(),
    expires: 3600
  },*/
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
  }
});

module.exports = User = mongoose.model("users", UserSchema);
