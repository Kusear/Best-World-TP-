var express = require("express");
var session = require("express-session");
var cookieParser = require("cookie-parser");
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
var controllersSuperAdmin = require("./controllers/superAdmin");
var controllersAdmin = require("./controllers/admin");
require("./config/config-passport");
var app = express();

var saltRounds = 5;
var MONGO_URL =
  "mongodb+srv://Kusear:qwer1234@cluster0.71p8k.mongodb.net/myFirstDatabase?retryWrites=true&w=majority";

mongoose.set("useFindAndModify", false);
app.use(express.json());
app.use(
  cors({
    credentials: true,
  })
);
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser("secret"));
app.use(
  session({
    secret: "secret",
    store: MongoStore.create({
      mongoUrl: MONGO_URL,
      mongoOptions: {
        autoReconnect: true,
      },
      collectionName: "sessions",
      ttl: 43200, // sec
      /*autoRemove: "interval",
      autoRemoveInterval: 60*/
    }),
    cookie: {
      //secure: true,
      path: "/",
      httpOnly: false,
      maxAge: 60 * 60 * 1000,
    },
    resave: true,
    saveUninitialized: false,
  })
);
app.use(passport.initialize());
app.use(passport.session());

app.get("/api/", function (req, res) {
  return res.status(200).json("main").end();
});

app.post("/api/login", controllersCommon.login);
app.post("/api/logout", midleware.auth, controllersCommon.logout);
app.post("/api/registration", controllersCommon.registration);
app.post("/api/emailAuth", controllersCommon.emailAuth);

/////
app.get("/api/saveFile", midleware.auth, controllersCommon.saveFiles);
app.post("/api/getFile", midleware.auth, controllersCommon.getFiles);
/////

app.get(
  "/api/superAdmin",
  midleware.auth,
  midleware.supAdminRoleCheck,
  controllersSuperAdmin.superAdminPage
);
app.put(
  "/api/superAdminUpdateUsers",
  midleware.auth,
  midleware.supAdminRoleCheck,
  controllersSuperAdmin.updateUsers
);

app.get(
  "/api/admin",
  midleware.auth,
  midleware.adminRoleCheck,
  controllersAdmin.adminPage
);
app.put(
  "/api/adminUpdateUsers",
  midleware.auth,
  midleware.adminRoleCheck,
  controllersAdmin.adminUpdateUsers
);

app.get(
  "/api/user",
  midleware.auth,
  midleware.userRoleCheck,
  controllersUser.userPage
);
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

/*
  mongodb+srv://Kusear:<password>@cluster0.71p8k.mongodb.net/myFirstDatabase?retryWrites=true&w=majority
  */
