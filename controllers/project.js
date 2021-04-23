var mongoose = require("mongoose");
var Projects = require("../models/project").Project;
var Users = require("../models/user").User;

exports.projectData = async function (req, res) {
  // add pic process
  await Projects.findOne(
    { slug: req.body.projectSlug },
    async function (err, project) {
      if (err) {
        return res.status(500).json({ message: "Something Wrong" }).end();
      }
      if (project) {
        return res.status(200).json(project).end();
      } else {
        return res.status(400).json("Project not found").end();
      }
    }
  );
};

exports.createProject = async function (req, res, next) {
  try {
    // var user = await Users.findById(req.body.creatorid);
    // var manager = await Users.findById(req.body.managerid);
    var newProject = await new Projects({
      IDcreator: req.body.creatorid, //required
      creatorName: req.body.creatorUsername,
      IDmanager: req.body.managerid,
      managerName: req.body.creatorUsername,
      needManager: req.body.neededManager,
      title: req.body.projectTitle, // required
      // picture
      description: req.body.projectDescription,
      projectSubject: req.body.projectSubject,
      picture: req.body.filename,
      countMembers: req.body.membersCount,
      creationDate: new Date(),
      endTeamGathering: new Date(req.body.endGathering), // required
      endProjectDate: new Date(req.body.endProject), // required
      requiredRoles: req.body.requredRoles,
    }).save();
    // project add members
    console.log("a");

    return res.status(200).json(newProject).end();
  } catch (err) {
    if (err) {
      next({
        status: 400,
        message: "Project already exist",
      });
      return;
    }
    next({
      status: 400,
      message: "Project already exist",
    });
  }
};

exports.updateProject = async function (req, res) {
  var projectToUpdate = req.body.projectTitleToUpdate;

  if (!projectToUpdate) {
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
      return res.status(500).json({ err: err.message }).end();
    }

    if (!project) {
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
        return res.status(400).json({ err: err.message }).end();
      }
      return res.status(200).json({ message: "updated" }).end();
    });
  });
};

exports.deleteProject = async function (req, res) {
  var projectToDelete = req.body.projectID;

  if (!projectToDelete) {
    return res.status(400).json({ err: "no projectID to edit" }).end();
  }

  await Projects.findById(projectToDelete, async function (err, project) {
    if (err) {
      return res.status(500).json({ err: err.message }).end();
    }

    if (!project) {
      return res.status(400).json({ err: "Project not found" }).end();
    }

    await project.remove(function (err, doc) {
      if (err) {
        return res.status(500).json({ err: err.message }).end();
      }
      return res.status(200).json({ message: "deleted" }).end();
    });
  });
};

exports.getProjects = async function (req, res) {
  Projects.find(
    {
      /*onPreModerate: false*/
    },
    null,
    function (err, result) {
      if (err) {
        return res.status(400).json({ err: err.message }).end();
      }
      return res.status(200).json(result).end();
    }
  );
};

exports.preModerProjects = async function (req, res) {
  Projects.find({ onPreModerate: true }, null, function (err, result) {
    if (err) {
      return res.status(400).json({ err: err.message }).end();
    }
    return res.status(200).json(result).end();
  });
};
