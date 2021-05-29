var mongoose = require("mongoose");
var Projects = require("../models/project").Project;
var Members = require("../models/project").Members;
var Requests = require("../models/project").Requests;
var ToDoLists = require("../models/todoList_model").TODOList;
var Users = require("../models/user_model").User;
const Chat = require("../models/chats_model").Chat;
const ChatMembers = require("../models/chats_model").ChatMembers;

/* TODO
 * добавить теги и ключевые слова
 * поиск по массиву клчевых слов или по одному
*/

exports.projectData = async function (req, res) {
  //  req.body.projectSlug

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
      needChanges: req.body.needChanges,
    }).save();

    var newProjectChat = await Chat({
      chatRoom: newProject.slug,
      chatMembers: newProject.projectMembers,
      privateChat: false,
    }).save();

    return res
      .status(200)
      .json({ project: newProject, prChat: newProjectChat })
      .end();
  } catch (err) {
    if (err) {
      return res.status(520).json({ err: err.message }).end();
    }
    return res.status(500).json({ message: "Project already exist" }).end();
  }
};

exports.updateProject = async function (req, res) {
  // req.body.projectSlug / string
  // ManagerID: req.body.managerID, / string
  // title: req.body.projectTitle, / string
  // description: req.body.projectDescription, / string
  // subject: req.body.projectSubject, / string
  // picture: req.body.filename,  / string
  // countMembers: req.body.membersCount, / number
  // endTeamGathering: req.body.endGathering, / date
  // endProjectDate: req.body.endProject, / date
  // requareRoles: req.body.requredRoles, / array
  // projectMembers: req.body.projectMembers, / array
  // archive: req.body.archive  / bool
  // needHelp: req.body.needHelp, / bool
  // needChanges: req.body.needChanges / bool
  // managerName: req.body.managerName, / string

  var projectToUpdate = req.body.projectSlug;

  if (!projectToUpdate) {
    return res.status(500).json({ err: "no project to edit" }).end();
  }

  var newProjectData = {
    ManagerID: req.body.managerID,
    managerName: req.body.managerName, //
    title: req.body.projectTitle,
    description: req.body.projectDescription,
    subject: req.body.projectSubject,
    picture: req.body.filename,
    countMembers: req.body.membersCount,
    endTeamGathering: req.body.endGathering,
    endProjectDate: req.body.endProject,
    requareRoles: req.body.requredRoles,
    projectMembers: req.body.projectMembers,
    archive: req.body.archive, //
    needHelp: req.body.needHelp, //
    needChanges: req.body.needChanges, //
  };

  await Projects.findOne(
    { slug: projectToUpdate },
    async function (err, project) {
      if (err) {
        return res.status(520).json({ err: err.message }).end();
      }

      if (!project) {
        return res.status(500).json({ err: "Project not found" }).end();
      }

      if (newProjectData.managerName) {
        project.managerName = newProjectData.managerName;
      }
      if (newProjectData.archive) {
        project.archive = newProjectData.archive;
      }
      if (newProjectData.needHelp) {
        project.needHelp = newProjectData.needHelp;
      }
      if (newProjectData.needChanges) {
        project.needChanges = newProjectData.needChanges;
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
    }
  );
};

exports.deleteProject = async function (req, res) {
  // req.body.projectSlug

  var projectToDelete = req.body.projectSlug;
  var responce = {
    todoListStatus: "",
    projectStatus: "",
    chatStatus: "",
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

      await Chat.findOne({ chatRoom: project.slug }, async (err, chat) => {
        if (err) {
          responce.chatStatus = err.message;
        }
        if (!chat) {
          responce.chatStatus = "Chat not found";
        }
        await chat.remove((err, result) => {
          if (err) {
            responce.chatStatus = err.message;
          }
          responce.chatStatus = "deleted";
        });
      });

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
  // req.query.currentPage

  var projects = await Projects.find({}, null, function (err, result) {
    if (err) {
      return res.status(520).json({ err: err.message }).end();
    }
  })
    .skip(20 * req.query.currentPage)
    .limit(20);

  return res.status(200).json(projects).end();
};

exports.getArchivedProjects = async function (req, res) {
  // req.query.currentPage

  var projects = await Projects.find(
    { archive: true },
    null,
    function (err, result) {
      if (err) {
        return res.status(520).json({ err: err.message }).end();
      }
    }
  )
    .skip(20 * req.query.currentPage)
    .limit(20);

  return res.status(200).json(projects).end();
};

exports.addProjectMember = async (req, res) => {
  // TODO удалять все реквесты принатого пользователся
  // req.body.projectSlug
  // req.body.role
  // req.body.id (request id)
  // req.body.roleID
  // reqRole.name = req.body.name; // optional
  // reqRole.count = req.body.count; // optional
  // reqRole.alreadyEnter = req.body.alreadyEnter; // optional

  // https://docs.mongodb.com/manual/reference/operator/update/pull/
  // прочитать ссылку про pull

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

    var exeptionReqRole = "null";
    try {
      var reqRole = await pr.requiredRoles.id(req.body.roleID);

      if (!reqRole) {
        exeptionReqRole = "No reqRole";
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
    } catch (ex) {
      exeptionReqRole = ex;
    }

    var exeptionPullRequests = "null";
    try {
      await pr.requests.pull({ _id: req.body.id });
    } catch (ex) {
      exeptionPullRequests = ex;
    }

    await pr.save();
    return res
      .status(200)
      .json({
        message: "success",
        exeptionReqRole: exeptionReqRole,
        exeptionPullRequests: exeptionPullRequests,
      })
      .end();
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

    var user = await project.projectMembers.id(req.body.memberID);

    await Chat.findOne({ chatRoom: project.slug }, (err, chat) => {
      if (err) {
        return res.status(520).json({ err: err.message }).end();
      }
      chat.chatMembers.pull(user);
      chat.save();
    });

    // await ToDoLists.findOne(
    //   { projectSlug: project.slug },
    //   async (err, list) => {
    //     if (err) {
    //       // TODO добавить переменную для передачи статуса
    //     }
    //     // list.boards.items.pull({performer: });
    //     // TODO сделать удаление задач удаленного пользователя через aggregate
    //   }
    // );
    try {
    await ToDoLists.updateMany(
      {},
      { $pull: { boards: { items: { performer: user.username } } } }
    );
    } catch (err) {
      
    }

    await project.projectMembers.pull(req.body.memberID);

    var exeption = "null";
    try {
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
    } catch (ex) {
      exeption = ex;
    }

    await project.save();
    return res
      .status(200)
      .json({ message: "success", exeption: exeption })
      .end();
  });
};

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

      var exeption = "null";
      try {
        var chat = Chat.findOne({ chatRoom: pr.slug });
        if (!chat) {
          return res.status(500).json({ err: "Chat not found" }).end();
        }
        await chat.chatMembers.push(newRequest);
        await chat.save();
      } catch (ex) {
        exeption = ex;
      }

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

    var exeption = "null";
    try {
      var chat = Chat.findOne({ chatRoom: project.slug });
      if (!chat) {
        return res.status(500).json({ err: "Chat not found" }).end();
      }
      await chat.chatMembers.pull(req.body.requestID);
      await chat.save();
    } catch (ex) {
      exeption = ex;
    }

    await project.save();
    return res
      .status(200)
      .json({ message: "success", exeption: exeption })
      .end();
  });
};
