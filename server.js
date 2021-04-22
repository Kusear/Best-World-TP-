var express = require("express");
var session = require("express-session");
var cookieParser = require("cookie-parser");
var passport = require("passport");
var mongoose = require("mongoose");
var bcrypt = require("bcrypt");
var cors = require("cors");
var MongoStore = require("connect-mongo");
var multer = require("multer");
require("dotenv").config();
//////
var store = require("./config/multer").storage;
//////
var Grid = require("gridfs-stream");

var midleware = require("./midleware/midleware");
var controllersCommon = require("./controllers/common");
var controllersUser = require("./controllers/user");
var controllersSuperAdmin = require("./controllers/superAdmin");
var controllersAdmin = require("./controllers/admin");
var controllersProject = require("./controllers/project");
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

app.get("/api/", multer({storage: store}).any(), function (req, res) {
  //console.log(req.body.a);
  //console.log(req.body.b);
  // console.log(req.files[0].fieldname);

  // var gfs = Grid(mongoose.connection.db, mongoose.mongo);

  //   req.pipe(
  //     gfs
  //       .createWriteStream({
  //         filename: req.files[0].fieldname,
  //       })
  //       .on("close", function (savedFile) {
  //         console.log("file saved", savedFile);
  //         return res.json({ file: savedFile });
  //       })
  //   );

  return res.send(req.files).end();
});

app.post(api_route + "/login", controllersCommon.login);
app.post(api_route + "/logout", midleware.auth, controllersCommon.logout);
app.post(api_route + "/registration", multer({storage: store}).any(), controllersCommon.registration);
app.post(api_route + "/deleteUser", midleware.auth, controllersCommon.deleteUser);
app.post(api_route + "/emailAuth", controllersCommon.emailAuth);

app.create(api_route + "/createProject", multer({storage: store}).any(), midleware.auth, controllersProject.createProject);
app.get(api_route + "/projectData", midleware.auth, midleware.roleCheck("user" || "admin" || "superadmin"), controllersProject.projectData);
app.put(api_route + "/updateProject", multer({storage: store}).any(), midleware.auth, midleware.roleCheck("user" || "admin" || "superadmin"), controllersProject.updateProject);
app.delete(api_route + "/deleteProject",midleware.auth, midleware.auth, midleware.roleCheck("user" || "admin" || "superadmin"), controllersProject.deleteProject)
app.post(api_route + "/preModerProjects", midleware.auth, midleware.roleCheck("admin" || "superadmin"), controllersProject.preModerProjects);
app.post(api_route + "/getProjects",  controllersProject.getProjects);

/////
app.get(api_route + "/saveFile", midleware.auth, controllersCommon.saveFiles);
app.post(
  api_route + "/getFile",
  midleware.auth,
  multer({storage: store}).any(),
  controllersCommon.getFiles
);
/////

app.get(
  api_route + "/superAdmin",
  midleware.auth,
  midleware.roleCheck("superadmin"),
  controllersSuperAdmin.superAdminPage
);
app.put(
  api_route + "/superAdminUpdateUsers",
  midleware.auth,
  midleware.roleCheck("superadmin"),
  controllersSuperAdmin.updateUsers
);

app.get(
  api_route + "/admin",
  midleware.auth,
  midleware.roleCheck("admin"),
  controllersAdmin.adminPage
);
app.put(
  api_route + "/adminUpdateUsers",
  midleware.auth,
  midleware.roleCheck("admin"),
  controllersAdmin.adminUpdateUsers
);

app.get(
  api_route + "/user",
  midleware.auth,
  midleware.roleCheck("user"),
  controllersUser.userData
);
app.put(api_route + "/updateUser", midleware.auth, controllersUser.updateUser);

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
