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
var controllersProjectBoard = require("./controllers/todoList");
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
 * удалить комменты midleware для todo листов
 */

const ToDoLists = require("./models/todoList_model").TODOList;

app.post("/api/", async function (req, res) {
  return res.status(200).json("main route").end();
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
app.get(
  api_route + "/emailAuth/:id",
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
  midleware.roleCheck("user", "superadmin"),
  controllersProject.updateProject
);
app.delete(
  api_route + "/deleteProject",
  midleware.auth,
  midleware.routeLog,
  midleware.roleCheck("user", "superadmin"),
  controllersProject.deleteProject
);
app.get(
  api_route + "/getProjects",
  midleware.routeLog,
  controllersProject.getProjects
);
// app.post(
//   api_route + "/updateRequiredRoles",
//   midleware.routeLog,
//   midleware.auth,
//   midleware.roleCheck("user", "superadmin"),
//   controllersProject.updateRequiredRoles
// );
app.post(
  api_route + "/addProjectMember",
  midleware.routeLog,
  midleware.auth,
  midleware.roleCheck("user", "superadmin"),
  controllersProject.addProjectMember
);
app.post(
  api_route + "/deleteProjectMember",
  midleware.routeLog,
  midleware.auth,
  midleware.roleCheck("user", "superadmin"),
  controllersProject.deleteProjectMember
);
app.post(
  api_route + "/addRequest",
  midleware.routeLog,
  midleware.auth,
  midleware.roleCheck("user", "superadmin"),
  controllersProject.addReqest
);
app.post(
  api_route + "/deleteRequest",
  midleware.routeLog,
  midleware.auth,
  midleware.roleCheck("user", "superadmin"),
  controllersProject.deleteRequest
);

// Project board routes
app.get(
  api_route + "/getTodoList",
  /*midleware.routeLog, midleware.auth, midleware.roleCheck("user", "superadmin"),*/ controllersProjectBoard.getProjectTODOList
);
app.post(
  api_route + "/createTodoList",
  /*midleware.routeLog, midleware.auth, midleware.roleCheck("user", "superadmin"),*/ controllersProjectBoard.createToDoList
);
app.post(
  api_route + "/updateTodoList",
  midleware.routeLog,
  midleware.auth,
  midleware.roleCheck("user", "superadmin"),
  controllersProjectBoard.updeteToDoList
);
app.post(
  api_route + "/createBoard",
  /*midleware.routeLog, midleware.auth, midleware.roleCheck("user", "superadmin"),*/ controllersProjectBoard.createBoard
);
app.post(
  api_route + "/updateBoard",
  /*midleware.routeLog, midleware.auth, midleware.roleCheck("user", "superadmin"),*/ controllersProjectBoard.updateBoard
);
app.post(
  api_route + "/deleteBoard",
  /*midleware.routeLog, midleware.auth, midleware.roleCheck("user", "superadmin"),*/ controllersProjectBoard.deleteBoard
);

app.post(
  api_route + "/createTask",
  /*midleware.routeLog, midleware.auth, midleware.roleCheck("user", "superadmin"),*/ controllersProjectBoard.createTask
);
app.post(
  api_route + "/updateTask",
  /*midleware.routeLog, midleware.auth, midleware.roleCheck("user", "superadmin"),*/ controllersProjectBoard.updateTask
);
app.post(
  api_route + "/moveTask",
  /*midleware.routeLog, midleware.auth, midleware.roleCheck("user", "superadmin"),*/ controllersProjectBoard.moveTask
);
app.post(
  api_route + "/deleteTask",
  /*midleware.routeLog, midleware.auth, midleware.roleCheck("user", "superadmin"),*/ controllersProjectBoard.deleteTask
);

// files routes
/////
app.get(api_route + "/saveFile", midleware.auth, controllersCommon.saveFiles);
app.post(api_route + "/getFile", midleware.auth, controllersCommon.getFiles);
/////

// User routes
app.get(api_route + "/userData", midleware.routeLog, controllersUser.userData);
app.post(
  api_route + "/updateUser",
  midleware.auth,
  midleware.routeLog,
  midleware.roleCheck("user", "superadmin"),
  controllersUser.updateUser
);
app.delete(
  api_route + "/deleteUser",
  midleware.auth,
  midleware.routeLog,
  midleware.roleCheck("user", "superadmin"),
  controllersUser.deleteUser
);
app.get(
  api_route + "/getUsers",
  midleware.auth,
  midleware.routeLog,
  midleware.roleCheck("user", "superadmin"),
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
