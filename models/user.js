var mongoose = require("mongoose");
var bcrypt = require("bcrypt");
var jwt = require("jsonwebtoken");
require("dotenv").config();

var  JWT_SECRET  = process.env.JWT_SECRET;
var salt = 10;

var UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
    select: false,
  },
  info: {
    type: String,
  },
  role: {
    type: String,
    enum: ["user", "admin", "superadmin"],
    default: "user",
  },
  image: {
    type: String,
    default: "default",
  },
});

UserSchema.methods.verifyPassword = async function (password) {
  try {
  return await bcrypt.compare(password, this.password);
  } catch (err) {
    console.log(err.message);
  }
};

UserSchema.methods.getToken = function () {
  return jwt.sign(
    {
      id: this._id,
      username: this.username,
    },
    JWT_SECRET,
    {
      expiresIn: "12h",
    }
  );
};

UserSchema.pre("save", async function (next) {
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

exports.userCollection = "users";
exports.User = mongoose.model("users", UserSchema);
