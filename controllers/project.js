var mongoose = require("mongoose");
var Projects = require("../models/project").Project;
var Members = require("../models/project").Members;
var Requests = require("../models/project").Requests;
var Users = require("../models/user_model").User;

/* TODO
 * - в (projectData) добавить отправку картинок в ответ
 * обернуть получение данных из req в try catch
 */

exports.projectData = async function (req, res) {
  // add pic process
  var projectSlug = req.body.projectSlug;
  if (!projectSlug) {
    return res.status(500).json({ err: "projectSlug are required" }).end();
  }
  await Projects.findOne({ slug: projectSlug }, async function (err, project) {
    if (err) {
      return res.status(500).json({ message: "Something Wrong" }).end();
    }
    if (project) {
      console.log(project.description);
      return res.status(200).json(project).end();
    } else {
      return res.status(500).json("Project not found").end();
    }
  });
};

exports.createProject = async function (req, res) {
  try {
    var newProject = await new Projects({
      IDcreator: req.body.creatorid, //required
      creatorName: req.body.creatorUsername,
      IDmanager: req.body.managerid,
      managerName: req.body.creatorUsername,
      needManager: req.body.neededManager,
      title: req.body.projectTitle, // required
      description: req.body.projectDescription,
      projectSubject: req.body.projectSubject,
      picture: req.body.filename,
      countOfMembers: req.body.membersCount,
      creationDate: new Date(),
      endTeamGathering: new Date(req.body.endGathering), // required
      endProjectDate: new Date(req.body.endProject), // required
      requiredRoles: req.body.requredRoles,
      projectMembers: req.body.projectMembers,
      requests: req.body.requests,
    }).save();

    return res.status(200).json(newProject).end();
  } catch (err) {
    if (err) {
      return res.status(520).json({ err: err.message }).end();
    }
    return res.status(500).json({ message: "Project already exist" }).end();
  }
};

exports.updateProject = async function (req, res) {
  var projectToUpdate = req.body.projectTitleToUpdate;

  if (!projectToUpdate) {
    return res.status(500).json({ err: "no projectID to edit" }).end();
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
      return res.status(520).json({ err: err.message }).end();
    }

    if (!project) {
      return res.status(500).json({ err: "Project not found" }).end();
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
        return res.status(520).json({ err: err.message }).end();
      }
      return res.status(200).json({ message: "updated" }).end();
    });
  });
};

// TODO сделать при удалении проекта удаление todo листа этого проекта
exports.deleteProject = async function (req, res) {
  var projectToDelete = req.body.projectID;

  if (!projectToDelete) {
    return res.status(500).json({ err: "no projectID to edit" }).end();
  }

  await Projects.findById(projectToDelete, async function (err, project) {
    if (err) {
      return res.status(520).json({ err: err.message }).end();
    }

    if (!project) {
      return res.status(500).json({ err: "Project not found" }).end();
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
  Projects.find({}, null, function (err, result) {
    if (err) {
      return res.status(520).json({ err: err.message }).end();
    }
    return res.status(200).json(result).end();
  });
};

exports.updateRequiredRoles = async (req, res) => {
  var projectSlug = req.body.projectSlug;
  if (!projectSlug) {
    return res.status(500).json({ err: "projectSlug are required" }).end();
  }
  var project = await Projects.findOne({ slug: projectSlug }, (err) => {
    if (err) {
      return res.status(520).json({ err: err.message }).end();
    }
  });
  var reqRoles = await project.requaredRoles.id(req.body.roleID);
  if (req.body.name) {
    reqRoles.name = req.body.name;
  }
  if (req.body.count) {
    reqRoles.count = req.body.count;
  }
  reqRoles.update((err) => {
    if (err) {
      return res.status(520).json({ err: err.message }).end();
    }
  });
  return res.status(200).json({ message: "seccess" }).end();
};

exports.addProjectMember = async (req, res) => {
  var projectSlug = req.body.projectSlug;
  if (!projectSlug) {
    return res.status(500).json({ err: "projectSlug are required" }).end();
  }
  var project = await Projects.findOne({ slug: projectSlug }, (err, pr) => {
    if (err) {
      return res.status(520).json({ err: err.message }).end();
    }
    var newMember = new Members();

    newMember.username = req.body.username;
    newMember.role = req.body.role;
    pr.projectMembers.push(newMember);
    pr.save();
    return res.status(200).json({ message: "success" }).end();
  });
};

exports.deleteProjectMember = async (req, res) => {
  var projectSlug = req.body.projectSlug;
  if (!projectSlug) {
    return res.status(500).json({ err: "projectSlug are required" }).end();
  }
  var project = await Projects.findOne({ slug: projectSlug }, (err) => {
    if (err) {
      return res.status(520).json({ err: err.message }).end();
    }
  });
  project.projectMembers.id(req.body.memberID).remove((err) => {
    if (err) {
      return res.status(520).json({ err: err.message }).end();
    }
  });
  return res.status(200).json({ message: "success" }).end();
};

exports.addReqest = async (req, res) => {
  var projectSlug = req.body.projectSlug;
  if (!projectSlug) {
    return res.status(500).json({ err: "projectSlug are required" }).end();
  }
  var project = await Projects.findOne({ slug: projectSlug }, (err, pr) => {
    if (err) {
      return res.status(520).json({ err: err.message }).end();
    }
    var newRequest = new Requests();
    newRequest.username = req.body.username;
    newRequest.role = req.body.role;
    pr.requests.push(newRequest);
    pr.save();
    return res.status(200).json({ message: "success" }).end();
  });
};

exports.deleteRequest = async (req, res) => {
  var projectSlug = req.body.projectSlug;
  if (!projectSlug) {
    return res.status(500).json({ err: "projectSlug are required" }).end();
  }
  var project = await Projects.findOne({ slug: projectSlug }, (err) => {
    if (err) {
      return res.status(520).json({ err: err.message }).end();
    }
  });
  project.requests.id(req.body.requestID).remove((err) => {
    return res.status(520).json({ err: err.message }).end();
  });
  return res.status(200).json({ message: "success" }).end();
};
