var mongoose = require("mongoose");
var Projects = require("../models/project").Project;

exports.createProject = function (req, res) {
  Projects.findOne({ name: req.query.projectName }, function (err, project) {
    if (err) {
      return done(err);
    }
    if (project) {
      return res.status(400).json("User already exist");
    }
  });

  var newProject = {
    CreatorID: req.query.creatorid,
    ManagerID: CreatorID,
    name: req.query.projectName,
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

  Projects.insertMany(newProject, function (err, result) {
    if (err) {
      console.log(err);
      return res.status(500).json({ err: err.message }).end();
    }
    return res.status(200).json("success").end();
  });
};

exports.updateProject = function (req, res) {
  var projectToUpdate = req.body.projectID;

  if (!projectToUpdate) {
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

  Projects.findById(projectToUpdate, function (err, project) {
    if (err) {
      return res.status(500).json({ err: err.message }).end();
    }

    if (!project) {
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

    project.save(function (err, doc) {
      if (err) {
        return res.status(400).json({ err: err.message }).end();
      }
      return res.status(200).json({ message: "updated" }).end();
    });
  });
};
