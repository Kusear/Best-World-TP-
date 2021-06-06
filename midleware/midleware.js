const passport = require("passport");
const Projects = require("../models/project").Project;
const Users = require("../models/user_model").User;
var validator = require("validator");

exports.auth = passport.authenticate("jwt", { session: false });

exports.roleCheck = function (...allowed) {
  var isAllowed = (role) => allowed.indexOf(role) > -1;
  return function (req, res, next) {
    if (req.user && isAllowed(req.user.role)) {
      next();
    } else {
      res.status(400).json({ message: "Forbidden" });
    }
  };
};

exports.routeLog = function (req, res, next) {
  console.log("Route: ", req.route.path);
  console.log("Headers: ", req.headers);
  next();
};

exports.checkProjectMember = async (req, res, next) => {
  var projectSlug;
  if (req.body.projectSlug) {
    projectSlug = req.body.projectSlug;
  }
  if (req.query.projectSlug) {
    projectSlug = req.query.projectSlug;
  }
  console.log("slug:", projectSlug);
  await Projects.findOne({ slug: projectSlug }, async function (err, project) {
    if (err) {
      return res.status(500).json({ err: err.message }).end();
    }
    if (!project) {
      return res.status(500).json({ err: "Project not found" }).end();
    }
    var members = project.projectMembers;
    var member = false;

    members.forEach((element) => {
      if (
        element.username === req.query.username ||
        element.username === req.body.username
      ) {
        member = true;
      }
    });

    if (member) {
      return next();
    } else {
      return res
        .status(500)
        .json({ message: "User doesnt exist in this project" })
        .end();
    }
  });
};

exports.loginValidation = async (req, res, next) => {
  if (!validator.isEmail(req.body.email)) {
    return res.status(500).json({ err: "Email не соответсвует шаблону" }).end();
  }
  if (!validator.isLenght(req.body.password, { min: 8, max: 32 })) {
    return res
      .status(500)
      .json({ err: "Пароль не содержит требуемое количество символов" })
      .end();
  }
  return next();
};

exports.registrationValidation = async (req, res, next) => {
  if (!validator.isEmail(req.body.email)) {
    return res.status(500).json({ err: "Email не соответсвует шаблону" }).end();
  }
  if (!validator.isLenght(req.body.password, { min: 8, max: 32 })) {
    return res
      .status(500)
      .json({ err: "Пароль не содержит требуемое количество символов" })
      .end();
  }
  return next();
};
