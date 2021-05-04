var mongoose = require("mongoose");
var Projects = require("../models/project").Project;
var Members = require("../models/project").Members;
var Requests = require("../models/project").Requests;
var ToDoLists = require("../models/todoList_model").TODOList;
var Users = require("../models/user_model").User;

/* TODO
 * сделть обновление требуемых ролей в добавлении пользователя в проект (присылает id роли и количество вошедших) ?
 * полностью проверить все ли правильно написано с изменением subdoc
 * добавить комментарии с тем что присылать
 */

exports.projectData = async function (req, res) {
  // add pic process

  //   projectSlug,

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
  //     IDcreator: req.body.creatorid, //required
  //     creatorName: req.body.creatorUsername,
  //     IDmanager: req.body.managerid,
  //     managerName: req.body.creatorUsername,
  //     needManager: req.body.neededManager,
  //     title: req.body.projectTitle, // required
  //     description: req.body.projectDescription,
  //     projectSubject: req.body.projectSubject,
  //     picture: req.body.filename,
  //     countOfMembers: req.body.membersCount,
  //     creationDate: new Date(),
  //     endTeamGathering: new Date(req.body.endGathering), // required
  //     endProjectDate: new Date(req.body.endProject), // required
  //     requiredRoles: req.body.requredRoles,
  //     projectMembers: req.body.projectMembers,
  //     requests: req.body.requests,

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
  // req.body.projectTitleToUpdate
  // ManagerID: req.body.managerID,
  // title: req.body.projectTitle,
  // description: req.body.projectDescription,
  // subject: req.body.projectSubject,
  // picture: req.body.filename,
  // countMembers: req.body.membersCount,
  // endTeamGathering: req.body.endGathering,
  // endProjectDate: req.body.endProject,
  // requareRoles: req.body.requredRoles,
  // projectMembers: req.body.projectMembers,

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

exports.deleteProject = async function (req, res) {
  // req.body.projectSlug

  var projectToDelete = req.body.projectSlug;
  var responce = {
    todoListStatus: "",
    projectStatus: "",
  };
  if (!projectToDelete) {
    return res.status(500).json({ err: "no projectID to edit" }).end();
  }

  await Projects.findOne(
    { slug: projectToDelete },
    async function (err, project) {
      if (err) {
        return res.status(520).json({ err: err.message }).end();
      }

      if (!project) {
        return res.status(500).json({ err: "Project not found" }).end();
      }

      await ToDoLists.findOne(
        { projectSlug: project.slug },
        async (err, list) => {
          if (err) {
            return res.status(520).json({ err: err.message }).end();
          }

          if (list) {
            await list.remove((err) => {
              if (err) {
                return res.status(520).json({ err: err.message }).end();
              }
              responce.todoListStatus = "deleted";
            });
          } else {
            responce.todoListStatus = "todo not found";
          }
        }
      );
      await project.remove(function (err, doc) {
        if (err) {
          return res.status(500).json({ err: err.message }).end();
        }
        responce.projectStatus = "deleted";
        return res.status(200).json(responce).end();
      });
    }
  );
};

exports.getProjects = async function (req, res) {
  Projects.find({}, null, function (err, result) {
    if (err) {
      return res.status(520).json({ err: err.message }).end();
    }
    return res.status(200).json(result).end();
  });
};
// TODO возможно удалить эту часть если все нормально работать будет
// exports.updateRequiredRoles = async (req, res) => {
//   var projectSlug = req.body.projectSlug;
//   if (!projectSlug) {
//     return res.status(500).json({ err: "projectSlug are required" }).end();
//   }
//   var project = await Projects.findOne({ slug: projectSlug }, (err) => {
//     if (err) {
//       return res.status(520).json({ err: err.message }).end();
//     }
//   });
//   var reqRoles = await project.requaredRoles.id(req.body.roleID);
//   if (req.body.name) {
//     reqRoles.name = req.body.name;
//   }
//   if (req.body.count) {
//     reqRoles.count = req.body.count;
//   }
//   reqRoles.update((err) => {
//     if (err) {
//       return res.status(520).json({ err: err.message }).end();
//     }
//   });
//   return res.status(200).json({ message: "seccess" }).end();
// };

exports.addProjectMember = async (req, res) => {
  // req.body.projectSlug
  // req.body.role
  // req.body.username
  // req.body.roleID
  // reqRole.name = req.body.name; // optional
  // reqRole.count = req.body.count; // optional
  // reqRole.alreadyEnter = req.body.alreadyEnter; // optional

  var projectSlug = req.body.projectSlug;
  if (!projectSlug) {
    return res.status(500).json({ err: "projectSlug are required" }).end();
  }
  await Projects.findOne({ slug: projectSlug }, async (err, pr) => {
    if (err) {
      return res.status(520).json({ err: err.message }).end();
    }
    if (!pr) {
      return res.status(500).json("Project not found").end();
    }

    var newMember = new Members();
    newMember.username = req.body.username;
    newMember.role = req.body.role;

    await pr.projectMembers.push(newMember);

    var reqRole = await pr.requiredRoles.id(req.body.roleID);

    if (!reqRole) {
      return res.status(500).json("Req role not found").end();
    }

    await pr.requiredRoles.pull(req.body.roleID);

    if (req.body.name) {
      reqRole.name = req.body.name;
    }
    if (req.body.count) {
      reqRole.count = req.body.count;
    }
    if (req.body.alreadyEnter) {
      reqRole.alreadyEnter = req.body.alreadyEnter;
    }

    await pr.requiredRoles.push(reqRole);

    await pr.save();
    return res.status(200).json({ message: "success" }).end();
  });
};

exports.deleteProjectMember = async (req, res) => {
  // req.body.projectSlug
  // req.body.memberID
  // req.body.roleID
  // reqRole.name = req.body.name; // optional
  // reqRole.count = req.body.count; // optional
  // reqRole.alreadyEnter = req.body.alreadyEnter; // optional

  var projectSlug = req.body.projectSlug;
  if (!projectSlug) {
    return res.status(500).json({ err: "projectSlug are required" }).end();
  }
  await Projects.findOne({ slug: projectSlug }, async (err, project) => {
    if (err) {
      return res.status(520).json({ err: err.message }).end();
    }
    await project.projectMembers.pull(req.body.memberID);

    var reqRole = await project.requiredRoles.id(req.body.roleID);

    if (!reqRole) {
      return res.status(500).json("Req role not found").end();
    }
    await project.requiredRoles.pull(req.body.roleID);
    if (req.body.name) {
      reqRole.name = req.body.name;
    }
    if (req.body.count) {
      reqRole.count = req.body.count;
    }
    if (req.body.alreadyEnter) {
      reqRole.alreadyEnter = req.body.alreadyEnter;
    }

    await project.requiredRoles.push(reqRole);

    await project.save();
    return res.status(200).json({ message: "success" }).end();
  });
};
// TODO сделать проверку на одну и туже роль
exports.addReqest = async (req, res) => {
  // req.body.projectSlug
  // newRequest.username = req.body.username;
  // newRequest.role = req.body.role;

  var projectSlug = req.body.projectSlug;
  if (!projectSlug) {
    return res.status(500).json({ err: "projectSlug are required" }).end();
  }
  await Projects.findOne({ slug: projectSlug }, async (err, pr) => {
    if (err) {
      return res.status(520).json({ err: err.message }).end();
    }

    var requestExist = false;

    pr.requests.forEach((element) => {
      if (
        element.role === req.body.role &&
        element.username === req.body.username
      ) {
        requestExist = true;
      }
    });
    if (!requestExist) {
      var newRequest = new Requests();
      newRequest.username = req.body.username;
      newRequest.role = req.body.role;
      await pr.requests.push(newRequest);
      await pr.save();
      return res.status(200).json({ message: "success" }).end();
    } else {
      return res.status(500).json("Request already sent").end();
    }
  });
};

exports.deleteRequest = async (req, res) => {
  // req.body.projectSlug
  // req.body.requestID

  var projectSlug = req.body.projectSlug;
  if (!projectSlug) {
    return res.status(500).json({ err: "projectSlug are required" }).end();
  }
  await Projects.findOne({ slug: projectSlug }, async (err, project) => {
    if (err) {
      return res.status(520).json({ err: err.message }).end();
    }
    await project.requests.pull(req.body.requestID);
    await project.save();
    return res.status(200).json({ message: "success" }).end();
  });
};
