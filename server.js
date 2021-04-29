var express = require("express");
var session = require("express-session");
var cookieParser = require("cookie-parser");
var passport = require("passport");
var mongoose = require("mongoose");
var bcrypt = require("bcrypt");
var cors = require("cors");
var MongoStore = require("connect-mongo");
require("dotenv").config();

var Grid = require("gridfs-stream");
var midleware = require("./midleware/midleware");
var controllersCommon = require("./controllers/common");
var controllersUser = require("./controllers/user");
var controllersProject = require("./controllers/project");
var controllersProjectBoard = require('./controllers/todoList');
require("./config/config-passport");
var app = express();

var MONGO_URL = process.env.MONGO_URL;
var api_route = "/api";

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
    //proxy: true,
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

/* TODO
  * изменить пути для премодерированых функций
  * удалить роль админа
*/

app.get("/api/", function (req, res) {
  return res.status(200).json().end();
});

/////////
app.get("/emailAuth", controllersCommon.emailAuth);
/////////

// Common routes
app.post(api_route + "/login", midleware.routeLog, controllersCommon.login);
app.post(
  api_route + "/logout",
  midleware.auth,
  midleware.routeLog,
  controllersCommon.logout
);
app.post(
  api_route + "/registration",
  midleware.routeLog,
  controllersCommon.registration
);
app.post(
  api_route + "/emailAuth",
  midleware.routeLog,
  controllersCommon.emailAuth
);

// Project routes
app.post(
  api_route + "/createProject",
  midleware.auth,
  midleware.routeLog,
  controllersProject.createProject
);
app.post(
  api_route + "/projectData",
  midleware.routeLog,
  controllersProject.projectData
);
app.post(
  api_route + "/updateProject",
  midleware.auth,
  midleware.routeLog,
  midleware.roleCheck("user", "admin", "superadmin"),
  controllersProject.updateProject
);
app.delete(
  api_route + "/deleteProject",
  midleware.auth,
  midleware.routeLog,
  midleware.roleCheck("admin", "superadmin"),
  controllersProject.deleteProject
);
// app.post(
//   api_route + "/preModerProjects",
//   midleware.auth,
//   midleware.routeLog,
//   midleware.roleCheck("admin", "superadmin"),
//   controllersProject.preModerProjects
// );
app.get(
  api_route + "/getProjects",
  midleware.routeLog,
  controllersProject.getProjects
);

// Project board routes
app.get(api_route + "/getBoard", /*midleware.routeLog, midleware.auth, midleware.roleCheck("user", "superadmin"),*/ controllersProjectBoard.getProjectTODOList);
app.post(api_route + "/createBoard", /*midleware.routeLog, midleware.auth, midleware.roleCheck("user", "superadmin"),*/ controllersProjectBoard.createToDoList);
app.post(api_route + "/updateBoard", midleware.routeLog, midleware.auth, midleware.roleCheck("user", "superadmin"), controllersProjectBoard.updeteToDoList);

/////
app.get(api_route + "/saveFile", midleware.auth, controllersCommon.saveFiles);
app.post(api_route + "/getFile", midleware.auth, controllersCommon.getFiles);
/////

// User routes
app.post(api_route + "/userData", midleware.routeLog, controllersUser.userData);
app.post(
  api_route + "/updateUser",
  midleware.auth,
  midleware.routeLog,
  midleware.roleCheck("user", "admin", "superadmin"),
  controllersUser.updateUser
);
app.delete(
  api_route + "/deleteUser",
  midleware.auth,
  midleware.routeLog,
  midleware.roleCheck("user", "admin", "superadmin"),
  controllersUser.deleteUser
);
// app.post(
//   api_route + "/preModerateUsers",
//   midleware.auth,
//   midleware.routeLog,
//   midleware.roleCheck("admin", "superadmin"),
//   controllersUser.getUsersOnPreModerate
// );
app.get(
  api_route + "/getUsers",
  midleware.auth,
  midleware.routeLog,
  midleware.roleCheck("admin", "superadmin"),
  controllersUser.getUsers
);

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
