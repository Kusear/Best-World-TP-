var express = require("express");
var session = require("express-session");
var cookieParse = require("cookie-parser");
var passport = require("passport");
var mongoose = require("mongoose");
var bcrypt = require("bcrypt");
var cors = require("cors");
var MongoStore = require("connect-mongo");

var db = require("./db");
var Users = require("./models/user");
var midleware = require("./midleware/midleware");
var controllersCommon = require("./controllers/common");
var controllersUser = require("./controllers/user");
var controllersAdmin = require("./controllers/admin");
var controllersModer = require("./controllers/moder");
require("./config/config-passport");
var app = express();

var saltRounds = 5;
var MONGO_URL =
  "mongodb+srv://Kusear:qwer1234@cluster0.71p8k.mongodb.net/myFirstDatabase?retryWrites=true&w=majority";

mongoose.set("useFindAndModify", false);
app.use(express.json());
app.use(
  cors(/*{
  origin: "http://localhost:5000", // restrict calls to those this address
  methods: "GET" // only allow GET requests
}*/)
);
app.use(express.urlencoded({ extended: false }));
app.use(cookieParse());
app.use(
  session({
    secret: "secret",
    store: MongoStore.create({
      mongoUrl: MONGO_URL,
      mongoOptions: {
        autoReconnect: true,
      },
      collectionName: "sessions",
      ttl: 300, // sec
      /*autoRemove: "interval",
      autoRemoveInterval: 60*/
    }),
    cookie: {
      //secure: true,
      path: "/",
      httpOnly: false,
      //maxAge: 60 * 60,
    },
    resave: true,
    saveUninitialized: false,
  })
);
app.use(passport.initialize());
app.use(passport.session());


app.get("/api/", function (req, res) {
  var mes = {
    status: true,
  };
  res.send(mes);
});

app.post("/api/login", controllersCommon.login);
app.post("/api/logout", midleware.auth, controllersCommon.logout);

app.get("/api/admin", midleware.auth, midleware.adminRoleCheck,controllersAdmin.adminPage);
app.put("/api/adminUpdateUsers", midleware.auth, midleware.adminRoleCheck, controllersAdmin.updateUsers);

app.get("/api/moder", midleware.auth, midleware.moderRoleCheck, controllersModer.moderPage);
app.put("/api/moderUpdateUsers", midleware.auth, midleware.moderRoleCheck, controllersModer.moderUpdateUsers);

app.get("/api/user", midleware.auth, midleware.userRoleCheck, controllersUser.userPage);
app.post("/api/addUser", controllersUser.create);
app.put("/api/updateUser", midleware.auth, controllersUser.update);

mongoose
  .connect(MONGO_URL, { useNewUrlParser: true })
  .then(
    app.listen(process.env.PORT || 3000, function () {
      console.log("API Working!");
    })
  )
  .catch(function (err) {
    console.log("Mongo err: ", err);
  });
