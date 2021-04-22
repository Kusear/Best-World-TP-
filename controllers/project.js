var mongoose = require("mongoose");
var Projects = require("../models/project").Project;
var Users = require("../models/user").User;

exports.projectData = async function (req, res, next) {
  // add pic process
  await Projects.findOne(
    { name: req.body.projectName },
    async function (err, project) {
      if (err) {
        next();
        return res.status(500).json({ message: "Something Wrong" }).end();
      }
      if (project) {
        var creator = await Users.findById(project.CreatorID);
        var manager = await Users.findById(project.ManagerID);

        return res
          .status(200)
          .json({
            projectData: project,
            // picture
            creatorData: {
              ID: creator._id,
              username: creator.username,
            },
            managerData: {
              ID: manager._id,
              username: manager.username,
            },
          })
          .end();
      } else {
        next();
        return res.status(400).json("Project not found").end();
      }
    }
  );
};

exports.createProject = async function (req, res, next) {
  await Projects.findOne(
    { name: req.query.projectName },
    function (err, project) {
      if (err) {
        return done(err);
      }
      if (project) {
        return res.status(400).json("User already exist");
      }
    }
  );
  // reconstruct to multipart/form-data
  var newProject = {
    CreatorID: req.query.creatorid,
    ManagerID: req.query.managerID,
    needManager: req.query.neededManager,
    name: req.query.projectName,
    // picture
    description: req.query.projectDescription,
    subject: req.query.projectSubject,
    picture: req.query.filename,
    countMembers: req.query.membersCount,
    creationDate: new Date(),
    endTeamGathering: req.query.endGathering,
    endProjectDate: req.query.endProject,
    requareRoles: req.query.requredRoles,
  };

  if (!newProject.name || !newProject.CreatorID) {
    return res.status(400).json({ err: "All fields must be sent!" }).end();
  }

  await Projects.insertMany(newProject, function (err, result) {
    if (err) {
      console.log(err);
      return res.status(500).json({ err: err.message }).end();
    }
    return res.status(200).json("success").end();
  });
};

exports.updateProject = async function (req, res, next) {
  var projectToUpdate = req.body.projectID;

  if (!projectToUpdate) {
    next();
    return res.status(400).json({ err: "no projectID to edit" }).end();
  }

  var newProjectData = {
    ManagerID: req.body.managerID,
    name: req.query.projectName,
    description: req.query.projectDescription,
    subject: req.query.projectSubject,
    picture: req.query.filename,
    countMembers: req.query.membersCount,
    endTeamGathering: req.query.endGathering,
    endProjectDate: req.query.endProject,
    requareRoles: req.query.requredRoles,
    projectMembers: req.body.projectMembers,
  };

  await Projects.findById(projectToUpdate, async function (err, project) {
    if (err) {
      next();
      return res.status(500).json({ err: err.message }).end();
    }

    if (!project) {
      next();
      return res.status(400).json({ err: "Project not found" }).end();
    }

    if (newProjectData.ManagerID) {
      project.ManagerID = newProjectData.ManagerID;
    }
    if (newProjectData.name) {
      project.name = newProjectData.name;
    }
    if (newProjectData.description) {
      project.description = newProjectData.description;
    }
    if (newProjectData.subject) {
      project.projectSubject = newProjectData.subject;
    }
    if (newProjectData.picture) {
      project.picture = newProjectData.picture;
    }
    if (newProjectData.countMembers) {
      project.countOfMembers = newProjectData.countMembers;
    }
    if (newProjectData.endTeamGathering) {
      project.endTeamGathering = newProjectData.endTeamGathering;
    }
    if (newProjectData.endProjectDate) {
      project.endProjectDate = newProjectData.endProjectDate;
    }
    if (newProjectData.requareRoles) {
      project.requiredRoles = newProjectData.requareRoles;
    }
    if (newProjectData.projectMembers) {
      project.projectMembers = newProjectData.projectMembers;
    }

    await project.save(function (err, doc) {
      if (err) {
        next();
        return res.status(400).json({ err: err.message }).end();
      }
      return res.status(200).json({ message: "updated" }).end();
    });
  });
};

exports.deleteProject = async function (req, res, next) {
  var projectToDelete = req.body.projectID;

  if (!projectToDelete) {
    next();
    return res.status(400).json({ err: "no projectID to edit" }).end();
  }

  await Projects.findById(projectToDelete, async function (err, project) {
    if (err) {
      next();
      return res.status(500).json({ err: err.message }).end();
    }

    if (!project) {
      next();
      return res.status(400).json({ err: "Project not found" }).end();
    }

    await project.remove(function (err, doc) {
      if (err) {
        next();
        return res.status(500).json({ err: err.message }).end();
      }
      return res.status(200).json({ message: "updated" }).end();
    });
  });
};
