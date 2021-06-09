const express = require("express");
const session = require("express-session");
const cookieParser = require("cookie-parser");
const passport = require("passport");
const mongoose = require("mongoose");
const cors = require("cors");
const MongoStore = require("connect-mongo");
const soketio = require("socket.io");
const http = require("http");
const path = require("path");
const nodemailer = require("./config/nodemailer");
require("dotenv").config();
require("./config/config-passport");

const midleware = require("./midleware/midleware");
const controllersCommon = require("./controllers/common");
const controllersUser = require("./controllers/user");
const controllersProject = require("./controllers/project");
const controllersProjectBoard = require("./controllers/todoList");
const controllersChat = require("./controllers/chat_contr");
const controllersReportUser = require("./controllers/reportedUser");
const controllersReportProject = require("./controllers/reportedProject");
const controllersBan = require("./controllers/userBan");
const { Project } = require("./models/project");
const app = express();
const server = http.createServer(app);
const io = soketio(server, {
  cors: {
    origin: "*",
  },
});
require("./sockets/chat")(io);
require("./sockets/task_lists")(io);

const MONGO_URL = process.env.MONGO_URL;
const api_route = "/api";

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
app.use(express.static(path.join(__dirname, "public"))); // TODO удалить как доделаю чат и таски
app.use(passport.initialize());
app.use(passport.session());

app.get("/", (req, res) => {});

app.post("/api/", async function (req, res) {
  // await Project.findOne({ slug: req.body.slug }, (err, pr) => {
  //   console.log(pr.projectMembers[0]);
  // });
  return res.status(200).json({}).end();
});

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
app.post(api_route + "/sendRecoveryEmail", controllersCommon.sendRecoveryEmail);
app.post(api_route + "/recoveryPassword", controllersCommon.recoveryPassword);

// Project routes
app.post(
  api_route + "/createProject",
  midleware.auth,
  midleware.banCheck,
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
app.post(
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
app.get(
  api_route + "/getProjectsByTag",
  midleware.routeLog,
  controllersProject.getProjectsByTag
);
app.get(
  api_route + "/getArchivedProjects",
  midleware.routeLog,
  controllersProject.getArchivedProjects
);
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
  midleware.banCheck,
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
  midleware.routeLog,
  midleware.auth,
  midleware.roleCheck("user", "superadmin"),
  midleware.checkProjectMember,
  controllersProjectBoard.getProjectTODOList
);
app.post(
  api_route + "/createTodoList",
  midleware.routeLog,
  midleware.auth,
  midleware.roleCheck("user", "superadmin"),
  midleware.checkProjectMember,
  controllersProjectBoard.createToDoList
);
app.post(
  api_route + "/updateTodoList",
  midleware.routeLog,
  midleware.auth,
  midleware.roleCheck("user", "superadmin"),
  midleware.checkProjectMember,
  controllersProjectBoard.updeteToDoList
);
app.post(
  api_route + "/createBoard",
  midleware.routeLog,
  midleware.auth,
  midleware.roleCheck("user", "superadmin"),
  midleware.checkProjectMember,
  controllersProjectBoard.createBoard
);
app.post(
  api_route + "/updateBoard",
  midleware.routeLog,
  midleware.auth,
  midleware.roleCheck("user", "superadmin"),
  midleware.checkProjectMember,
  controllersProjectBoard.updateBoard
);
app.post(
  api_route + "/deleteBoard",
  midleware.routeLog,
  midleware.auth,
  midleware.roleCheck("user", "superadmin"),
  midleware.checkProjectMember,
  controllersProjectBoard.deleteBoard
);

app.post(
  api_route + "/createTask",
  midleware.routeLog,
  midleware.auth,
  midleware.roleCheck("user", "superadmin"),
  midleware.checkProjectMember,
  controllersProjectBoard.createTask
);
app.post(
  api_route + "/updateTask",
  midleware.routeLog,
  midleware.auth,
  midleware.roleCheck("user", "superadmin"),
  midleware.checkProjectMember,
  controllersProjectBoard.updateTask
);
app.post(
  api_route + "/moveTask",
  midleware.routeLog,
  midleware.auth,
  midleware.roleCheck("user", "superadmin"),
  midleware.checkProjectMember,
  controllersProjectBoard.moveTask
);
app.post(
  api_route + "/deleteTask",
  midleware.routeLog,
  midleware.auth,
  midleware.roleCheck("user", "superadmin"),
  midleware.checkProjectMember,
  controllersProjectBoard.deleteTask
);

// files routes
/////
app.get(api_route + "/saveFile", midleware.auth, controllersCommon.saveFiles);
app.post(api_route + "/getFile", midleware.auth, controllersCommon.getFiles);
/////

// User routes
app.get(api_route + "/userData", midleware.routeLog, controllersUser.userData);
app.get(api_route + "/lightUserData", controllersUser.lightUserData);
app.post(
  api_route + "/updateUser",
  midleware.auth,
  midleware.routeLog,
  midleware.roleCheck("user", "superadmin"),
  controllersUser.updateUser
);
app.post(
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

// Report user routes
app.post(
  api_route + "/createUserReport",
  midleware.auth,
  midleware.banCheck,
  midleware.roleCheck("user", "superadmin"),
  controllersReportUser.createReportUser
);
app.get(
  api_route + "/getReportedUsers",
  midleware.auth,
  midleware.roleCheck("superadmin"),
  controllersReportUser.getReportedUsers
);
app.post(
  api_route + "/deleteUserReport",
  midleware.auth,
  midleware.roleCheck("user", "superadmin"),
  controllersReportUser.deleteUserReport
);

// Report project routes
app.post(
  api_route + "/createProjectReport",
  midleware.auth,
  midleware.banCheck,
  midleware.roleCheck("user", "superadmin"),
  controllersReportProject.createRoportProject
);
app.get(
  api_route + "/getReportedProjects",
  midleware.auth,
  midleware.roleCheck("superadmin"),
  controllersReportProject.getReortedProjects
);
app.post(
  api_route + "/deleteUserReport",
  midleware.auth,
  midleware.roleCheck("user", "superadmin"),
  controllersReportProject.deleteReportProject
);

// Ban routes
app.post(
  api_route + "/getBannedUsers",
  midleware.auth,
  midleware.roleCheck("superadmin"),
  controllersBan.getBannedUsers
);
app.post(
  api_route + "/banUser",
  midleware.auth,
  midleware.roleCheck("superadmin"),
  controllersBan.banUser
);
app.post(
  api_route + "/unbanUser",
  midleware.auth,
  midleware.roleCheck("superadmin"),
  controllersBan.unbanUser
);

// Chat routes
app.post(api_route + "/createChat", midleware.auth, controllersChat.createChat);
app.get(api_route + "/getChats", midleware.auth, controllersChat.getChats);
app.post(api_route + "/deleteChat", midleware.auth, controllersChat.deleteChat);

mongoose
  .connect(MONGO_URL, { useNewUrlParser: true })
  .then(
    server.listen(process.env.PORT || 3000, function () {
      console.log("API Working!");
      nodemailer.transport.verify();
    })
  )
  .catch(function (err) {
    console.log("Mongo err: ", err);
  });
