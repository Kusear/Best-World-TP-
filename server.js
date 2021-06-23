const express = require("express");
const session = require("express-session");
const cookieParser = require("cookie-parser");
const passport = require("passport");
const mongoose = require("mongoose");
const cors = require("cors");
const MongoStore = require("connect-mongo");
const soketio = require("socket.io");
const http = require("http");
const formData = require("express-form-data");
const multer = require("multer");
const nodemailer = require("./config/nodemailer");
const slugify = require("slugify");
require("dotenv").config();
require("./config/config-passport");
const GridFsStorage = require("multer-gridfs-storage");

const MONGO_URL = process.env.MONGO_URL;
const api_route = "/api";

const storageIMG = new GridFsStorage({
  url: MONGO_URL,
  file: (req, file) => {
    console.log(file); // jpeg png jpg
    console.log(file.mimetype); // jpeg png jpg
    var objID = req.body.userID || req.body.projectID;
    return {
      filename:
        slugify(req.body.filename, {
          replacement: "-",
          remove: undefined,
          lower: false,
          strict: false,
          locale: "ru",
        }) +
        "-IMAGE-" +
        objID,
    };
  },
});
const storageFILE = new GridFsStorage({
  url: MONGO_URL,
  file: (req, file) => {
    console.log(file);
    console.log(req.body.projectID);
    return {
      filename:
        slugify(req.body.filename, {
          replacement: "-",
          remove: undefined,
          lower: false,
          strict: false,
          locale: "ru",
        }) +
        "-FILE-" +
        req.body.projectID,
    };
  },
});
const upload = multer({
  fileFilter: function (req, file, next) {
    if (!file.originalname.match(/\.(jpg|jpeg|png|JPG|JPEG|PNG)$/)) {
      return next(null, false);
    }
    next(null, file.originalname);
  },
  storage: storageIMG,
});
const uploadFiles = multer({
  fileFilter: async function (req, file, next) {
    await Projects.findById(req.body.projectID, (err, pr) => {
      if (err) {
        return next(null, "err");
      }
      if (pr.projectFiles.length <= 20) {
        if (!file.originalname.match(/\.(DOC|DOCX|PDF|doc|docx|pdf)$/)) {
          return next(null, false);
        }
        next(null, file.originalname);
      } else {
        return next(null, "limit");
      }
    });
  },
  storage: storageFILE,
});
const multerParse = multer();

const midleware = require("./midleware/midleware");
const controllersCommon = require("./controllers/common");
const controllersUser = require("./controllers/user");
const controllersProject = require("./controllers/project");
const controllersProjectBoard = require("./controllers/todoList");
const controllersChat = require("./controllers/chat_contr");
const controllersReportUser = require("./controllers/reportedUser");
const controllersReportProject = require("./controllers/reportedProject");
const controllersBan = require("./controllers/userBan");
const Users = require("./models/user_model").User;
const ProjectFiles = require("./models/project").Files;
const Projects = require("./models/project").Project;
const { Project } = require("./models/project");
const app = express();
const server = http.createServer(app);
const io = soketio(server, {
  cors: {
    origin: "*",
  },
  pingTimeout: 30000,
});
require("./sockets/chat")(io);
require("./sockets/task_lists")(io);

const options = {
  autoClean: true,
};

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
      ttl: 43200,
    }),
    cookie: {
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

// TODO удалить все выводы в консоль
///////////////////////////////////////////////////////////////////////////////////////////////////////

app.get("/", (req, res) => {});

app.post("/api/", async function (req, res) {
  var list = await Projects.find({
    projectHashTag: { $in: req.body.tags },
  });
  return res.status(200).json({ list: list }).end();
});

// Common routes
app.post(api_route + "/login", controllersCommon.login);
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
  api_route + "/getArchivedProjects",
  midleware.routeLog,
  controllersProject.getArchivedProjects
);
app.post(
  api_route + "/getProjectsByFilters",
  midleware.routeLog,
  controllersProject.getProjectsByFilters
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
app.post(
  api_route + "/deleteAllRequest",
  midleware.routeLog,
  midleware.auth,
  midleware.roleCheck("user", "superadmin"),
  controllersProject.deleteAllRequest
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
app.post(
  api_route + "/getProjectUsers",
  midleware.routeLog,
  midleware.auth,
  midleware.roleCheck("user", "superadmin"),
  midleware.checkProjectMember,
  controllersProjectBoard.getUsers
);

// files routes
app.post(
  api_route + "/saveFile",
  midleware.auth,
  upload.single("image"),
  async (req, res) => {
    if (!req.file) {
      return res.status(500).json({ text: "bad file", status: -200 }).end();
    }
    var objID = req.body.userID || req.body.projectID;
    var filenameSlug =
      (await slugify(req.body.filename, {
        replacement: "-",
        remove: undefined,
        lower: false,
        strict: false,
        locale: "ru",
      })) +
      "-IMAGE-" +
      objID;

    console.log("slug: ", filenameSlug);

    var image = {
      image: filenameSlug,
    };
    if (req.body.userID) {
      await Users.findByIdAndUpdate(
        req.body.userID,
        image,
        { new: true },
        (err) => {
          if (err) {
            return res.status(500).json({ err: err.message }).end();
          }
          return res
            .status(200)
            .json({ message: "Image saved", filename: filenameSlug })
            .end();
        }
      );
    } else {
      await Project.findByIdAndUpdate(
        req.body.projectID,
        image,
        { new: true },
        (err) => {
          if (err) {
            return res.status(500).json({ err: err.message }).end();
          }
          return res
            .status(200)
            .json({ message: "Image saved", filename: filenameSlug })
            .end();
        }
      );
    }
  }
);
app.post(
  api_route + "/addFileToProject",
  midleware.auth,
  uploadFiles.single("file"),
  async (req, res) => {
    if (!req.file) {
      return res.status(500).json({ text: "bad file", status: -200 }).end();
    } else if (req.file === "err") {
      return res.status(500).json({ text: "db err", status: -300 }).end();
    } else if (req.file === "limit") {
      return res.status(500).json({ text: "limit", status: -400 }).end();
    }
    var filenameSlug =
      (await slugify(req.body.filename, {
        replacement: "-",
        remove: undefined,
        lower: false,
        strict: false,
        locale: "ru",
      })) +
      "-FILE-" +
      req.body.projectID;

    console.log("slug: ", filenameSlug);

    var file = {
      file: filenameSlug,
    };
    await Project.findById(req.body.projectID, async (err, pr) => {
      if (err) {
        return res.status(500).json({ err: err.message }).end();
      }
      if (!pr) {
        return res
          .status(500)
          .json({ err: "Такого проекта не существует" })
          .end();
      }

      var newFile = new ProjectFiles();
      newFile.username = req.body.username;
      newFile.filename = filenameSlug;
      newFile.fileType = req.body.fileType;

      pr.projectFiles.push(newFile);

      pr.save();
      return res
        .status(200)
        .json({
          message: "File added",
          filename: filenameSlug,
          username: req.body.username,
          defaultFilename: req.body.filename,
          fileID: newFile._id,
        })
        .end();
    });
  }
);
app.post(
  api_route + "/getFile",
  midleware.routeLog,
  controllersCommon.getFiles
);
app.get("/download", controllersCommon.downloadFile);
app.post(api_route + "/deleteFile", controllersProject.deleteFile);

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
app.post(
  api_route + "/applyProjectReport",
  midleware.auth,
  midleware.roleCheck("superadmin"),
  controllersReportUser.applyReport
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
  api_route + "/deleteProjectReport",
  midleware.auth,
  midleware.roleCheck("user", "superadmin"),
  controllersReportProject.deleteReportProject
);
app.post(
  api_route + "/applyReport",
  midleware.auth,
  midleware.roleCheck("superadmin"),
  controllersReportProject.applyReport
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
app.post(api_route + "/getChats", midleware.auth, controllersChat.getChats);
app.post(api_route + "/deleteChat", midleware.auth, controllersChat.deleteChat);
app.post(api_route + "/getUsersInChat", controllersChat.getUsersInChat);

// Date
app.get(api_route + "/serverDate", (req, res) => {
  return res.status(200).json({ serverDate: new Date() }).end();
});

mongoose
  .connect(MONGO_URL, { useNewUrlParser: true })
  .then(
    server.listen(process.env.PORT || 7000, function () {
      console.log("API Working!");
      nodemailer.transport.verify();
    })
  )
  .catch(function (err) {
    console.log("Mongo err: ", err);
  });
