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
        creationDate: new Date(),
        requiredRoles: req.body.requredRoles,
        projectMembers: req.body.projectMembers,
        requests: req.body.requests,
        needChanges: req.body.needChanges,
      }).save();
    }

    var newProjectChat = await new Chat({
      chatRoom: newProject.slug,
      chatMembers: newProject.projectMembers,
      privateChat: false,
    }).save();

    var newToDoList = await new ToDoLists({
      projectSlug: newProject.slug,
      boards: [
        new Boards({ name: "Board 1" }),
        new Boards({ name: "Board 2" }),
        new Boards({ name: "Board 3" }),
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
          { chatRoom: newSlug },
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
        return res.status(200).json({ message: "updated" }).end();
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
          return res.status(200).json({ message: "updated" }).end();
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

  var projects = await Projects.find({}, null, function (err, result) {
    if (err) {
      return res.status(520).json({ err: err.message }).end();
    }
  })
    .skip(10 * req.query.currentPage)
    .limit(10);
  console.log(projects.length);
  projects.forEach((element) => {
    var endSTR = "";

    var pr = {
      project: element,
    };

    gfs
      .openDownloadStreamByName(element.image, { revision: -1 })
      .on("data", (chunk) => {
        console.log("CHUNK: ", chunk);
        endSTR += Buffer.from(chunk, "hex").toString("base64");
      })
      .on("error", function (err) {
        console.log("ERR: ", err);
        pr.project.image = "default";

        gfs
          .openDownloadStreamByName(pr.project.image, { revision: -1 })
          .on("data", (chunk) => {
            console.log("CHUNK: ", chunk);
            endSTR += Buffer.from(chunk, "hex").toString("base64");
          })
          .on("error", function (err) {
            pr.project.image = "Err on image";
            listProjects.push(pr);
          })
          .on("close", () => {
            pr.project.image = endSTR;
            listProjects.push(pr);
            console.log("d c: ", counter);
            if (counter == projects.length - 1) {
              return res.status(200).json(listProjects).end();
            }
            console.log("e: ", counter);
            counter++;
          });

        // if (counter == projects.length - 1) {
        //   return res.status(200).json(listProjects).end();
        // }
        // console.log("e: ", counter);
      })
      .on("close", () => {
        pr.project.image = endSTR;
        listProjects.push(pr);
        if (counter == projects.length - 1) {
          return res.status(200).json(listProjects).end();
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
    await Projects.findOneAndUpdate(
      { slug: projectSlug },
      { $pull: { requests: { username: req.body.username } } },
      (err) => {
        if (err) {
          exeptionPullRequests = err.message;
        }
      }
    );

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
    try {
      await ToDoLists.updateMany(
        { projectSlug: projectSlug },
        { $pull: { boards: { items: { performer: user.username } } } }
      );
    } catch (err) {}

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
  var projectSlug = req.body.projectSlug;
  if (!projectSlug) {
    return res.status(500).json({ err: "projectSlug are required" }).end();
  }
  await Projects.findOneAndUpdate(
    { slug: projectSlug },
    { $pull: { requests: { username: req.body.username } } },
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

// await Projects.findOne(
//   { slug: projectToDelete },
//   async function (err, project) {
//     if (err) {
//       return res.status(520).json({ err: err.message }).end();
//     }

//     if (!project) {
//       return res.status(500).json({ err: "Project not found" }).end();
//     }

//     await ToDoLists.findOne(
//       { projectSlug: project.slug },
//       async (err, list) => {
//         if (err) {
//           return res.status(520).json({ err: err.message }).end();
//         }

//         if (list) {
//           await list.remove((err) => {
//             if (err) {
//               return res.status(520).json({ err: err.message }).end();
//             }
//             responce.todoListStatus = "deleted";
//           });
//         } else {
//           responce.todoListStatus = "todo not found";
//         }
//       }
//     );

//     await Chat.findOne({ chatRoom: project.slug }, async (err, chat) => {
//       if (err) {
//         responce.chatStatus = err.message;
//       }
//       if (!chat) {
//         responce.chatStatus = "Chat not found";
//       }
//       await chat.remove((err, result) => {
//         if (err) {
//           responce.chatStatus = err.message;
//         }
//         responce.chatStatus = "deleted";
//       });
//     });

//     await project.remove(function (err, doc) {
//       if (err) {
//         return res.status(500).json({ err: err.message }).end();
//       }
//       responce.projectStatus = "deleted";
//       return res.status(200).json(responce).end();
//     });
//   }
// );
