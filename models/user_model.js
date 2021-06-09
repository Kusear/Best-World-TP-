var mongoose = require("mongoose");
var bcrypt = require("bcrypt");
var jwt = require("jsonwebtoken");
require("dotenv").config();

var JWT_SECRET = process.env.JWT_SECRET;
var salt = 5;

var UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  name: {
    type: String,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  emailConfirm: {
    type: Boolean,
    default: false,
  },
  ban: {
    type: Boolean,
    default: false,
  },
  password: {
    type: String,
    required: true,
    trim: true,
  },
  preferredRole: {
    type: String,
  },
  needChanges: {
    type: Boolean,
    default: false,
  },
  info: {
    type: String,
  },
  role: {
    type: String,
    enum: ["user", "superadmin"],
    default: "user",
  },
  image: {
    type: String,
    default: "",
  },
});

UserSchema.method.hashPassword = async function (newpassword) {
  return await bcrypt.hash(newpassword, salt);
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
