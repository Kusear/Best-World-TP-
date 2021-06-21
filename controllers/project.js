const mongoose = require("mongoose");
const mongodb = require("mongodb");
const Projects = require("../models/project").Project;
const Members = require("../models/project").Members;
const Requests = require("../models/project").Requests;
const ToDoLists = require("../models/todoList_model").TODOList;
const Boards = require("../models/todoList_model").Boards;
const Users = require("../models/user_model").User;
const Chat = require("../models/chats_model").Chat;
const slugify = require("slugify");
const ChatMembers = require("../models/chats_model").ChatMembers;
const nodemailer = require("../config/nodemailer");

exports.projectData = async function (req, res) {
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

      var endSTR = "";
      var gfs = new mongodb.GridFSBucket(
        mongoose.connection.db,
        mongoose.mongo
      );
      var creatorImage;
      gfs
        .openDownloadStreamByName(project.image, { revision: -1 })
        .on("data", (chunk) => {
          console.log("CHUNK: ", chunk);
          endSTR += Buffer.from(chunk, "hex").toString("base64");
        })
        .on("error", function (err) {
          console.log("ERR: ", err);
          project.image = "default";

          gfs
            .openDownloadStreamByName(project.image, { revision: -1 })
            .on("data", (chunk) => {
              console.log("CHUNK: ", chunk);
              endSTR += Buffer.from(chunk, "hex").toString("base64");
            })
            .on("error", function (err) {
              console.log("ERR: ", err);
              project.image = "default";
            })
            .on("close", () => {
              project.image = endSTR;
              var usersInProject = [];
              var i = 0;
              project.projectMembers.forEach(async (element) => {
                var endSTR2 = "";
                var user = {
                  username: element.username,
                  role: element.role,
                  canChange: element.canChange,
                  image: "",
                };
                console.log("USER: ", element);
                await Users.findOne(
                  { username: user.username },
                  (err, userBD) => {
                    if (userDB) {
                      gfs
                        .openDownloadStreamByName(userBD.image, {
                          revision: -1,
                        })
                        .on("data", (chunk) => {
                          console.log("CHUNK: ", chunk);
                          endSTR2 += Buffer.from(chunk, "hex").toString(
                            "base64"
                          );
                        })
                        .on("error", function (err) {
                          console.log("ERR: ", err);
                          user.image = "default";

                          if (element.username === project.creatorName) {
                            creatorImage = user.image;
                          }
                          usersInProject.push(user);
                          if (i == project.projectMembers.length - 1) {
                            return res
                              .status(200)
                              .json({
                                project: project,
                                members: usersInProject,
                                creatorImage: creatorImage,
                              })
                              .end();
                          }
                          i++;
                        })
                        .on("close", () => {
                          if (userBD.image !== "default") {
                            user.image = endSTR2;
                          } else {
                            user.image = "default";
                          }
                          if (element.username === project.creatorName) {
                            creatorImage = user.image;
                          }

                          usersInProject.push(user);
                          if (i == project.projectMembers.length - 1) {
                            return res
                              .status(200)
                              .json({
                                project: project,
                                members: usersInProject,
                                creatorImage: creatorImage,
                              })
                              .end();
                          }
                          i++;
                        });
                    }
                  }
                );
              });
            });
        })
        .on("close", () => {
          project.image = endSTR;
          var usersInProject = [];
          var i = 0;
          project.projectMembers.forEach(async (element) => {
            var endSTR2 = "";
            var user = {
              username: element.username,
              role: element.role,
              canChange: element.canChange,
              image: "",
            };
            console.log("USER: ", element);
            await Users.findOne({ username: user.username }, (err, userBD) => {
              if (userBD.image != null) {
                gfs
                  .openDownloadStreamByName(userBD.image, { revision: -1 })
                  .on("data", (chunk) => {
                    console.log("CHUNK: ", chunk);
                    endSTR2 += Buffer.from(chunk, "hex").toString("base64");
                  })
                  .on("error", function (err) {
                    console.log("ERR: ", err);
                    user.image = "default";
                    if (element.username === project.creatorName) {
                      creatorImage = user.image;
                    }
                    usersInProject.push(user);
                    if (i == project.projectMembers.length - 1) {
                      return res
                        .status(200)
                        .json({
                          project: project,
                          members: usersInProject,
                          creatorImage: creatorImage,
                        })
                        .end();
                    }
                    i++;
                  })
                  .on("close", () => {
                    if (userBD.image !== "default") {
                      user.image = endSTR2;
                    } else {
                      user.image = "default";
                    }
                    if (element.username === project.creatorName) {
                      creatorImage = user.image;
                    }
                    usersInProject.push(user);
                    if (i == project.projectMembers.length - 1) {
                      return res
                        .status(200)
                        .json({
                          project: project,
                          members: usersInProject,
                          creatorImage: creatorImage,
                        })
                        .end();
                    }
                    i++;
                  });
              } else {
                userBD.image = "default";
              }
            });
          });
        });
    } else {
      return res.status(500).json("Project not found").end();
    }
  });
};

exports.createProject = async function (req, res) {
  try {
    var newProject;
    var userBD = await Users.findOne(
      { username: req.body.creatorUsername },
      (err) => {
        if (err) {
          return res.status(500).json({ err: err.message }).end();
        }
      }
    );

    if (userBD.ban == true) {
      return res.status(500).json({ message: "User banned" }).end();
    }

    if (!req.body.needHelp) {
      newProject = await new Projects({
        IDcreator: req.body.creatorid,
        creatorName: req.body.creatorUsername,
        IDmanager: req.body.managerid,
        managerName: req.body.creatorUsername,
        needHelp: req.body.needHelp,
        title: req.body.projectTitle,
        description: req.body.projectDescription,
        projectHashTag: req.body.projectHashTag,
        countOfMembers: req.body.membersCount,
        freePlaces: req.body.membersCount,
        creationDate: new Date(),
        endTeamGathering: new Date(req.body.endGathering),
        endProjectDate: new Date(req.body.endProject),
        requiredRoles: req.body.requredRoles,
        projectMembers: req.body.projectMembers,
        requests: req.body.requests,
        needChanges: req.body.needChanges,
      }).save();
    } else {
      newProject = await new Projects({
        IDcreator: req.body.creatorid,
        creatorName: req.body.creatorUsername,
        IDmanager: req.body.managerid,
        managerName: req.body.creatorUsername,
        needHelp: req.body.needHelp,
        title: req.body.projectTitle,
        description: req.body.projectDescription,
        projectHashTag: req.body.projectHashTag,
        countOfMembers: req.body.membersCount,
        freePlaces: req.body.membersCount,
        creationDate: new Date(),
        requiredRoles: req.body.requredRoles,
        projectMembers: req.body.projectMembers,
        requests: req.body.requests,
        needChanges: req.body.needChanges,
      }).save();
    }

    var newProjectChat = await new Chat({
      chatRoom: newProject.slug,
      chatName: newProject.title,
      chatMembers: newProject.projectMembers,
      privateChat: false,
    }).save();

    var newToDoList = await new ToDoLists({
      projectSlug: newProject.slug,
      boards: [
        new Boards({ name: "TODO", color: "#FCA5A5" }),
        new Boards({ name: "IN PROGRESS", color: "#FCD34D" }),
        new Boards({ name: "TEST", color: "#6EE7B7" }),
      ],
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
  var projectToUpdate = req.body.projectSlug;

  if (!projectToUpdate) {
    return res.status(500).json({ err: "no project to edit" }).end();
  }

  var projectA = await Projects.findOne({ slug: projectToUpdate }, (err) => {
    if (err) {
      console.log("ERR: ", err.message);
    }
  });
  console.log("A: ", projectA);
  if (
    req.body.userWhoUpdate.username === projectA.creatorName ||
    req.body.userWhoUpdate.username === projectA.managerName
  ) {
    console.log("creator");
    await Projects.findOneAndUpdate(
      { slug: projectToUpdate },
      req.body.newProjectData,
      { new: true },
      async (err, project) => {
        if (err) {
          return res.status(500).json({ err: err.message }).end();
        }
        var newSlug =
          (await slugify(project.title, {
            replacement: "-",
            remove: undefined,
            lower: false,
            strict: false,
            locale: "ru",
          })) +
          "-" +
          project._id;

        await Chat.findOneAndUpdate(
          { chatRoom: project.slug },
          { chatRoom: newSlug, chatName: project.title },
          { new: true }
        );
        await ToDoLists.findOneAndUpdate(
          { projectSlug: project.slug },
          { projectSlug: newSlug },
          { new: true }
        );

        project.slug = newSlug;
        project.save();
        console.log("C: ", req.body.newProjectData);
        return res
          .status(200)
          .json({
            message: "updated",
            projectID: project._id,
            projectSlug: project.slug,
          })
          .end();
      }
    );
  } else {
    if (
      req.body.userWhoUpdate.role === "Помощь в заполнении проекта" &&
      req.body.userWhoUpdate.canChange == true
    ) {
      console.log("someone else");
      await Projects.findOneAndUpdate(
        { slug: projectToUpdate },
        req.body.newProjectData,
        { new: true },
        async (err, project) => {
          if (err) {
            return res.status(500).json({ err: err.message }).end();
          }

          var newSlug =
            (await slugify(project.title, {
              replacement: "-",
              remove: undefined,
              lower: false,
              strict: false,
              locale: "ru",
            })) +
            "-" +
            project._id;

          await Chat.findOneAndUpdate(
            { chatRoom: project.slug },
            { chatRoom: newSlug },
            { new: true }
          );
          await ToDoLists.findOneAndUpdate(
            { projectSlug: project.slug },
            { projectSlug: newSlug },
            { new: true }
          );

          project.slug = newSlug;
          project.projectMembers.pull(req.body.userWhoUpdate);
          project.save();
          return res
            .status(200)
            .json({
              message: "updated",
              projectID: project._id,
              projectSlug: project.slug,
            })
            .end();
        }
      );
    } else {
      return res.status(200).json({ message: "failed" }).end();
    }
  }
};

exports.deleteProject = async function (req, res) {
  var projectToDelete = req.body.projectSlug;
  var responce = {
    todoListStatus: "",
    projectStatus: "",
    chatStatus: "",
  };
  if (!projectToDelete) {
    return res.status(500).json({ err: "no projectID to edit" }).end();
  }

  var project = await Projects.findOneAndDelete(
    { slug: projectToDelete },
    (err) => {
      if (err) {
        responce.projectStatus = err.message;
      }
    }
  );

  var todolist = await ToDoLists.findOneAndDelete(
    {
      projectSlug: projectToDelete,
    },
    (err) => {
      if (err) {
        responce.todoListStatus = err.message;
      }
    }
  );

  var chat = await Chat.findOneAndDelete(
    { chatRoom: projectToDelete },
    (err) => {
      if (err) {
        responce.chatStatus = err.message;
      }
    }
  );

  if (
    !responce.projectStatus &&
    !responce.todoListStatus &&
    !responce.chatStatus
  ) {
    return res.status(200).json({ message: "deleted" }).end();
  } else {
    return res.status(500).json({ message: responce }).end();
  }
};

exports.getProjects = async function (req, res) {
  var gfs = new mongodb.GridFSBucket(mongoose.connection.db, mongoose.mongo);

  var listProjects = [];
  var counter = 0;
  var hasNext = false;

  var page = req.query.currentPage;

  var projects = await Projects.find(
    { needHelp: false },
    null,
    function (err, result) {
      if (err) {
        return res.status(520).json({ err: err.message }).end();
      }
    }
  )
    .skip(10 * page)
    .limit(10);
  console.log(projects.length);

  var projects2 = await Projects.find(
    { needHelp: false },
    null,
    function (err, result) {
      if (err) {
        return res.status(520).json({ err: err.message }).end();
      }
    }
  )
    .skip(10 * (page + 1))
    .limit(10);

  if (projects.length == 0) {
    var emptyList = [];
    return res
      .status(200)
      .json({ listProjects: emptyList, hasNext: hasNext })
      .end();
  }
  if (projects2.length != 0) {
    hasNext = true;
  }

  projects.forEach((element) => {
    var endSTR = "";
    console.log(true);
    var pr = {
      project: element,
    };

    if (element.endProjectDate > new Date()) {
      element.archive = true;
    }
    element.save();

    gfs
      .openDownloadStreamByName(element.image, { revision: -1 })
      .on("data", (chunk) => {
        console.log("CHUNK: ", chunk);
        endSTR += Buffer.from(chunk, "hex").toString("base64");
      })
      .on("error", function (err) {
        console.log("ERR: ", err);
        pr.project.image = "default";
        console.log("d c: ", counter);
        gfs
          .openDownloadStreamByName(pr.project.image, { revision: -1 })
          .on("data", (chunk) => {
            console.log("CHUNK: ", chunk);
            endSTR += Buffer.from(chunk, "hex").toString("base64");
          })
          .on("error", function (err) {
            console.log("e: ", counter);
            pr.project.image = "Err on image";
            listProjects.push(pr);
            if (counter == projects.length - 1) {
              return res
                .status(200)
                .json({ listProjects: listProjects, hasNext: hasNext })
                .end();
            }
            console.log("e: ", counter);
            counter++;
          })
          .on("close", () => {
            pr.project.image = endSTR;
            listProjects.push(pr);
            console.log("a: ", counter);
            if (counter == projects.length - 1) {
              return res
                .status(200)
                .json({ listProjects: listProjects, hasNext: hasNext })
                .end();
            }
            console.log("e: ", counter);
            counter++;
          });
      })
      .on("close", () => {
        pr.project.image = endSTR;
        listProjects.push(pr);
        console.log("c: ", counter);
        if (counter == projects.length - 1) {
          return res
            .status(200)
            .json({ listProjects: listProjects, hasNext: hasNext })
            .end();
        }
        console.log("c: ", counter);
        counter++;
      });
  });
};

exports.getProjectsByTag = async (req, res) => {
  var projects = await Projects.find({}, null, function (err, result) {
    if (err) {
      return res.status(520).json({ err: err.message }).end();
    }
  })
    .where("projectHashTag")
    .all(req.query.hashTag)
    .skip(20 * req.query.currentPage)
    .limit(20);

  return res.status(200).json(projects).end();
};

exports.getProjectNeedHelp = async (req, res) => {
  var projects = await Projects.find(
    { needHelp: req.body.needHelp },
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

    var rolesReq = await pr.requiredRoles.id(req.body.roleID);
    if (req.body.alreadyEnter > rolesReq.count) {
      return res
        .status(500)
        .json({ err: "Все места на эту роль заняты" })
        .end();
    }

    var requestExist = false;

    pr.requests.forEach((element) => {
      if (
        element.role === req.body.role &&
        element.username === req.body.username
      ) {
        console.log("Requiest exist");
        requestExist = true;
      }
    });

    if (!requestExist) {
      return res.status(200).json({ message: "No request" }).end();
    }

    var newMember;
    if (req.body.helper && pr.needHelp) {
      newMember = new Members();
      newMember.username = req.body.username;
      newMember.role = "Помощь в заполнении проекта";
      newMember.canChange = true;
    } else {
      newMember = new Members();
      newMember.username = req.body.username;
      newMember.role = req.body.role;
    }

    await pr.projectMembers.push(newMember);

    var exeptionReqRole = "null";
    try {
      var reqRole = await pr.requiredRoles.id(req.body.roleID);

      if (!reqRole) {
        exeptionReqRole = "No reqRole";
      }

      await pr.requiredRoles.pull(req.body.roleID);

      reqRole.alreadyEnter++;
      pr.freePlaces--;

      await pr.requiredRoles.push(reqRole);
    } catch (ex) {
      exeptionReqRole = ex;
    }

    var exeptionPullRequests = "null";
    await Projects.findOneAndUpdate(
      { slug: projectSlug },
      { $pull: { requests: { username: req.body.username } } },
      (err) => {
        if (err) {
          exeptionPullRequests = err.message;
        }
      }
    );
    var exptionChatAddMember = "null";
    await Chat.findOne({ chatRoom: projectSlug }, (err, chat) => {
      if (err) {
        exptionChatAddMember = err.message;
      }

      var isChatMember = false;
      if (chat) {
        if (chat.chatMembers != null) {
          chat.chatMembers.forEach((element) => {
            if (element.username === newMember.username) {
              isChatMember = true;
            }
          });
          if (!isChatMember) {
            var newChatUser = new ChatMembers();
            newChatUser.username = newMember.username;
            newChatUser.role = newMember.role;
            chat.chatMembers.push(newChatUser);
            chat.save();
          }
        } else {
          chat.chatMembers = [newMember];
          chat.save();
        }
      } else {
        var newProjectChat = new Chat({
          chatRoom: pr.slug,
          chatName: pr.title,
          chatMembers: pr.projectMembers,
          privateChat: false,
        }).save();
      }
    });

    pr.projectMembers.forEach(async (element) => {
      await Users.findOne({ username: element.username }, (err, user) => {
        if (err) {
          return res.status().json({}).end();
        }
        if (user.projectNotify) {
          var info;
          if (user.username != newMember.username) {
            info = {
              notificationID: -1,
              email: user.email,
              // title: project.title,
              subject: "Пользователь присоединился к одному из ваших проектов",
              theme:
                user.username + " к вашему проекту присоединился пользователь",
              text:
                "<div><br>К вашему '" +
                pr.title +
                "' проекту присоединился пользователь с никнеймом '" +
                newMember.username +
                "'.</div>" +
                "<div>Роль: " +
                newMember.role +
                ".</div>" +
                "<div><br>Благодарим за внимание, Start-Up.</div>",
            };
            nodemailer.sendMessageEmail(info);
          } else {
            info = {
              notificationID: -1,
              email: user.email,
              // title: project.title,
              subject: "Приняте в проект",
              theme: user.username + " вас приняли в проект",
              text:
                "<div><br>Вас приняли в '" +
                pr.title +
                "' проект." +
                "</div>" +
                "<div>На роль: " +
                newMember.role +
                ".</div>" +
                "<div><br>Благодарим за внимание, Start-Up.</div>",
            };
            nodemailer.sendMessageEmail(info);
          }
        }
      });
    });

    await pr.save();
    return res
      .status(200)
      .json({
        message: "success",
        exeptionReqRole: exeptionReqRole,
        exeptionPullRequests: exeptionPullRequests,
        exptionChatAddMember: exptionChatAddMember,
      })
      .end();
  });
};

exports.deleteProjectMember = async (req, res) => {
  var projectSlug = req.body.projectSlug;
  console.log(req.body);
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
      if (chat.chatMembers != null) {
        chat.chatMembers.pull(user);
        chat.save();
      } else {
        chat.remove();
      }
    });
    try {
      await ToDoLists.updateMany(
        { projectSlug: projectSlug },
        { $pull: { "boards.$[].items": { performer: user.username } } }
      );
    } catch (error) {
      console.log("DELETE MEMBER: ", error.message);
    }

    await project.projectMembers.pull(req.body.memberID);

    var exeption = "null";
    try {
      var reqRole = await project.requiredRoles.id(req.body.roleID);
      if (!reqRole) {
        return res.status(500).json("Req role not found").end();
      }
      reqRole.alreadyEnter--;
      pr.freePlaces++;
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
  var projectSlug = req.body.projectSlug;
  if (!projectSlug) {
    return res.status(500).json({ err: "projectSlug are required" }).end();
  }
  await Projects.findOneAndUpdate(
    { slug: projectSlug },
    {
      $pull: { requests: { _id: mongoose.Types.ObjectId(req.body.requestID) } },
    },
    (err) => {
      if (err) {
        return res
          .status(200)
          .json({ message: "failed", err: err.message })
          .end();
      }
      return res.status(200).json({ message: "success" }).end();
    }
  );
};

exports.deleteFile = async (req, res) => {
  var projectUser = req.body.username;
  var gfs = new mongodb.GridFSBucket(mongoose.connection.db, mongoose.mongo);
  await Projects.findOne(
    { slug: req.body.projectSlug },
    async (err, project) => {
      if (err) {
        return res.status(500).json({ err: err.message }).end();
      }
      if (!project) {
        return res.status(500).json({ err: "Проект не найден" }).end();
      }
      var user;
      var file;
      var status = false;
      if (
        projectUser != project.creatorName &&
        projectUser != project.managerName
      ) {
        console.log("not creator");
        project.projectFiles.forEach(async (element) => {
          console.log(element);
          if (
            element.filename === req.body.filename &&
            element.username === projectUser
          ) {
            file = await gfs.find({ filename: req.body.filename }).toArray();
            if (file.length != 0) {
              file.forEach(async (cursor) => {
                if (cursor.filename === req.body.filename) {
                  gfs.delete(cursor._id);
                  var obj = await project.projectFiles.id(req.body.fileObj);
                  console.log(obj);
                  await project.projectFiles.pull(obj);
                  await project.save();
                  status = true;
                  return res.status(500).json({ message: "err" }).end();
                }
              });
            } else {
              return res.status(500).json({ message: "No file" }).end();
            }
          }
        });
      } else {
        file = await gfs.find({ filename: req.body.filename }).toArray();
        console.log(file);
        if (file.length != 0) {
          file.forEach(async (cursor) => {
            console.log("creator");
            if (cursor.filename === req.body.filename) {
              gfs.delete(cursor._id);
              var obj = await project.projectFiles.id(req.body.fileObj);
              console.log(obj);
              await project.projectFiles.pull(obj);
              await project.save();
              return res.status(200).json({ message: "success" }).end();
            }
          });
        } else {
          return res.status(500).json({ message: "No file" }).end();
        }
      }
    }
  );
};

exports.getProjectsByFilters = async (req, res) => {
  var tags = [""];

  var dateEndPr = new Date().toISOString();
  var endTeamGathDate = new Date().toISOString();

  var indexForendpr;
  var indexForendteamgath;
  var tempDateendpr = new Date().toISOString();
  var tempDateteamgthend = new Date().toISOString();

  indexForendpr = tempDateendpr.indexOf("T");
  indexForendteamgath = tempDateteamgthend.indexOf("T");

  dateEndPr = tempDateendpr.substring(0, indexForendpr);
  endTeamGathDate = tempDateteamgthend.substring(0, indexForendteamgath);

  var reqRoles = "";
  var countOfMembersMin = 1;
  var countOfMembersMax = 20;
  var needHelp = false;
  var freePlacesMin = 0;
  var freePlacesMax = 20;
  console.log(tags);

  if (req.body.tags) {
    tags = req.body.tags;
  }
  if (req.body.dateEndPr) {
    dateEndPr = req.body.dateEndPr;
  }
  if (req.body.dateTeamGathEnd) {
    endTeamGathDate = req.body.dateTeamGathEnd;
  }
  if (req.body.reqRole) {
    reqRoles = req.body.reqRole;
  }
  if (req.body.countOfMembersMin) {
    countOfMembersMin = req.body.countOfMembersMin;
  }
  if (req.body.countOfMembersMax) {
    countOfMembersMax = req.body.countOfMembersMax;
  }
  if (req.body.needHelp) {
    needHelp = req.body.needHelp;
  }
  if (req.body.freePlacesMin) {
    freePlacesMin = req.body.freePlacesMin;
  }
  if (req.body.freePlacesMax) {
    freePlacesMax = req.body.freePlacesMax;
  }

  console.log("t", tags);
  console.log("d", dateEndPr);
  console.log("e", endTeamGathDate);
  console.log("r", reqRoles);
  console.log("cmin", countOfMembersMin);
  console.log("cmax", countOfMembersMax);
  console.log("m", needHelp);
  console.log("fmin", freePlacesMin);
  console.log("fmax", freePlacesMax);

  var list = await Projects.find({
    $and: [
      {
        $or: [
          { projectHashTag: { $in: tags } },
          { title: { $regex: tags[0], $options: "$i" } },
        ],
      },
      {
        endProjectDate: { $gte: new Date(dateEndPr) },
      },
      {
        endTeamGathering: { $gte: new Date(endTeamGathDate) },
      },
      {
        $or: [
          { requiredRoles: { $elemMatch: { role: reqRoles } } },
          { requiredRoles: { $elemMatch: { role: /.*/ } } },
        ],
      },
      {
        countOfMembers: {
          $gte: countOfMembersMin,
          $lte: countOfMembersMax,
        },
      },
      {
        needHelp: needHelp,
      },
      {
        freePlaces: {
          $gte: freePlacesMin,
          $lte: freePlacesMax,
        },
      },
    ],
  })
    .skip(20 * req.body.page)
    .limit(20);
  console.log("list: ", list);
  if (!list) {
    return res.status(200).json({ list: [] }).end();
  } else {
    return res.status(200).json({ list: list }).end();
  }
};
