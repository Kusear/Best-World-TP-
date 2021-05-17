const express = require("express");
const session = require("express-session");
const cookieParser = require("cookie-parser");
const passport = require("passport");
const mongoose = require("mongoose");
const cors = require("cors");
const MongoStore = require("connect-mongo");
require("dotenv").config();
const soketio = require("socket.io");
const http = require("http");
const path = require("path");
const nodemailer = require("./config/nodemailer");

const midleware = require("./midleware/midleware");
const controllersCommon = require("./controllers/common");
const controllersUser = require("./controllers/user");
const controllersProject = require("./controllers/project");
const controllersProjectBoard = require("./controllers/todoList");
const controllersChat = require("./controllers/chat_contr");
require("./config/config-passport");
const app = express();
const server = http.createServer(app);
const io = soketio(server, {
    cors: {
        origin: '*',
    }
});
require("./sockets/chat")(io);

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
app.use(express.static(path.join(__dirname, "public")));  // TODO удалить как доделаю чат и таски
app.use(passport.initialize());
app.use(passport.session());

/* TODO
 * удалить комменты midleware для todo листов
 */
app.get("/", midleware.auth, (req, res)=>{

});

const Chat2 = require("./models/chats_model").Chat;
app.get("/api/", async function (req, res) {
  var a = Chat2.find({}, (err, result)=>{
    console.log(result);
  });
  
  return res.status(200).json("aga").end();
});

// Common routes
app.post(
  api_route + "/login",
  midleware.routeLog,
  /*midleware.loginValidation,*/ controllersCommon.login
);
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
  /*midleware.routeLog, midleware.auth, midleware.roleCheck("user", "superadmin"),*/ midleware.checkProjectMember,
  controllersProjectBoard.getProjectTODOList
);
app.post(
  api_route + "/createTodoList",
  /*midleware.routeLog, midleware.auth, midleware.roleCheck("user", "superadmin"),*/ midleware.checkProjectMember,
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
  /*midleware.routeLog, midleware.auth, midleware.roleCheck("user", "superadmin"),*/ midleware.checkProjectMember,
  controllersProjectBoard.createBoard
);
app.post(
  api_route + "/updateBoard",
  /*midleware.routeLog, midleware.auth, midleware.roleCheck("user", "superadmin"),*/ midleware.checkProjectMember,
  controllersProjectBoard.updateBoard
);
app.post(
  api_route + "/deleteBoard",
  /*midleware.routeLog, midleware.auth, midleware.roleCheck("user", "superadmin"),*/ midleware.checkProjectMember,
  controllersProjectBoard.deleteBoard
);

app.post(
  api_route + "/createTask",
  /*midleware.routeLog, midleware.auth, midleware.roleCheck("user", "superadmin"),*/ midleware.checkProjectMember,
  controllersProjectBoard.createTask
);
app.post(
  api_route + "/updateTask",
  /*midleware.routeLog, midleware.auth, midleware.roleCheck("user", "superadmin"),*/ midleware.checkProjectMember,
  controllersProjectBoard.updateTask
);
app.post(
  api_route + "/moveTask",
  /*midleware.routeLog, midleware.auth, midleware.roleCheck("user", "superadmin"),*/ midleware.checkProjectMember,
  controllersProjectBoard.moveTask
);
app.post(
  api_route + "/deleteTask",
  /*midleware.routeLog, midleware.auth, midleware.roleCheck("user", "superadmin"),*/ midleware.checkProjectMember,
  controllersProjectBoard.deleteTask
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

// Chat routes
app.post(api_route+ '/createChat', controllersChat.createChat);
app.get(api_route + "/getChats", controllersChat.getChats);
app.post(api_route + "/deleteChat", controllersChat.deleteChat);

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
