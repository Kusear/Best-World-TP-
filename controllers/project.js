var mongoose = require("mongoose");
var Projects = require("../models/project").Project;
var Users = require("../models/user").User;

exports.projectData = async function (req, res, next) {
  // add pic process
  await Projects.findOne(
    { title: req.body.projectName },
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
  console.log("req: ", req.body);
  var existProject = await Projects.findOne({ title: req.body.projectTitle });
  if (existProject) {
    next();
    return res.status(400).json("Project already exist").end();
  }

  var newProject = {
    IDcreator: req.body.creatorid, //required
    IDmanager: req.body.managerid,
    needManager: req.body.neededManager,
    title: req.body.projectTitle, // required
    // picture
    description: req.body.projectDescription,
    subject: [req.body.projectSubject],
    picture: req.body.filename,
    countMembers: req.body.membersCount,
    creationDate: new Date(),
    endTeamGathering: new Date(req.body.endGathering), // required
    endProjectDate: new Date(req.body.endProject), // required
    requareRoles: [req.body.requredRoles],
  };

  if (!newProject.title || !newProject.IDcreator) {
    console.log(newProject);
    next();
    return res.status(400).json({ err: "All fields must be sent!" }).end();
  }

  await Projects.insertMany(newProject, function (err, result) {
    if (err) {
      console.log(err);
      next();
      //return res.status(500).json({ err: err.message }).end();
    }
    return res.status(200).json("success").end();
  });
};

exports.updateProject = async function (req, res, next) {
  var projectToUpdate = req.body.projectTitleToUpdate;

  if (!projectToUpdate) {
    next();
    return res.status(400).json({ err: "no projectID to edit" }).end();
  }

  var newProjectData = {
    ManagerID: req.body.managerID,
    title: req.body.projectTitle,
    description: req.body.projectDescription,
    subject: req.body.projectSubject,
    picture: req.body.filename,
    countMembers: req.body.membersCount,
    endTeamGathering: req.body.endGathering,
    endProjectDate: req.body.endProject,
    requareRoles: req.body.requredRoles,
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
    if (newProjectData.title) {
      project.title = newProjectData.title;
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

    await project.update(function (err, doc) {
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

exports.getProjects = async function (req, res, next) {
  Projects.find({ /*onPreModerate: false*/ }, null, function (err, result) {
    if (err) {
      next();
      return res.status(400).json({ err: err.message }).end();
    }
    return res.status(200).json(result).end();
  });
};

exports.preModerProjects = async function (req, res, next) {
  Projects.find({ onPreModerate: true }, null, function (err, result) {
    if (err) {
      next();
      return res.status(400).json({ err: err.message }).end();
    }
    return res.status(200).json(result).end();
  });
};
