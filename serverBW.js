var express = require("express");
var session = require("express-session");
var FileStore = require("session-file-store")(session);
var cookieParse = require("cookie-parser");
var passport = require("passport");
var mongoose = require("mongoose");
var bcrypt = require("bcrypt");

var db = require("./db");
var Users = require("./models/User");
var app = express();
require("./config/config-passport");

var collName = "users";
var saltRounds = 5;
var MONGO_URL =
  "mongodb+srv://Kusear:qwer1234@cluster0.71p8k.mongodb.net/myFirstDatabase?retryWrites=true&w=majority";

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParse());
app.use(
  session({
    secret: "secret",
    store: new FileStore(),
    cookie: {
      //secure: true,
      path: "/",
      httpOnly: true,
      maxAge: 60 * 60 * 1000,
    },
    resave: true,
    saveUninitialized: true,
  })
);
app.use(passport.initialize());
app.use(passport.session());

app.get("/", function (req, res) {
  var mes = {
    status: true,
  };
  res.send(mes);
});

app.post("/login", function (req, res, next) {
  passport.authenticate("local", function (err, user, info) {
    if (err) {
      // произошла ошибка
      return next(err);
    }
    if (!user) {
      //пользователь не найден
      return res.send(info.message);
    }
    req.logIn(user, function (err) {
      // пользователь найден
      if (err) {
        return next(err);
      }
      return res.redirect("/admin");
    });
  })(req, res, next);
});

var auth = function (req, res, next) {
  if (req.isAuthenticated()) {
    next();
  } else res.redirect("/");
};

app.post("/logout", auth, function (req, res) {
  req.logOut();
  res.redirect("/");
});

app.get("/admin", auth, function (req, res) {
  res.send("Admins page!");
});

app.post("/api/users/userById", function (req, res) {
  db.get()
    .collection(collName)
    .findOne({ email: req.body.email }, function (err, doc) {
      if (err) {
        console.log(err);
        return res.sendStatus(500);
      }
      res.send(doc);
    });
});

app.post("/api/users/addUser", function (req, res) {
  var user = {
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    info: req.body.info,
  };
  bcrypt.hash(user.password, saltRounds, function (err, hash) {
    if (err) {
      console.log("crypt err: ", err);
      return res.sendStatus(500);
    }
    user.password = hash;
    Users.insertMany(user, function (err, result) {
      if (err) {
        console.log(err);
        return res.sendStatus(500);
      }
      res.send(user);
    });
  });
});

mongoose
  .connect(MONGO_URL, { useNewUrlParser: true })
  .then(
    app.listen(process.env.PORT || 3000, function () {
      console.log("API Working!");
    })
  )
  .catch(function (err) {
    console.log(err);
  });
/*
  mongodb+srv://Kusear:<password>@cluster0.71p8k.mongodb.net/myFirstDatabase?retryWrites=true&w=majority
  */
