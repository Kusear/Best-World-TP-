const Users = require("../models/user_model").User;
const Chats = require("../models/chats_model").Chat;
const Projects = require("../models/project").Project;
const projectMembers = require("../models/project").Members;
const ReportedUsers = require("../models/reported_users").ReportedUser;

const STATUS_DBOBJECT_NOT_FOUND = 32685;
const INTERNAL_ERROR = 23568;
const SUCCESS = 22222;

exports.userData = async function (req, res) {
  await Users.findOne({ username: req.query.username }, async (err, user) => {
    if (err) {
      return res
        .status(500)
        .json({ err: err.message, status: INTERNAL_ERROR })
        .end();
    }

    if (!user) {
      return res
        .status(500)
        .json({ err: "User not found", status: STATUS_DBOBJECT_NOT_FOUND })
        .end();
    }

    var memberInProjects = await Projects.find(
      { "projectMembers.username": user.username },
      (err, result) => {
        if (err) {
        }
        // return res.status(520).json({ err: err.message }).end();
        console.log("MEMBERINPROJECT\n");
      }
    );

    var projects = [];
    memberInProjects.forEach((element) => {
      var construction = {
        project: "",
        role: "",
        archived: false,
      };
      construction.role = element.projectMembers[0].role;
      projects.push(construction);
    });
    for (let i = 0; i < projects.length; i++) {
      projects[i].project = memberInProjects[i];
      if (memberInProjects[i].archived) {
        projects[i].archived = true;
      }
    }

    console.log("\nprojects: ", projects);
    return res
      .status(200)
      .json({
        username: user.username,
        email: user.email,
        name: user.name,
        role: user.role,
        preferredRole: user.preferredRole,
        info: user.info,
        image: user.image,
        projects: projects,
        emailConfirm: user.emailConfirm,
        status: SUCCESS,
      })
      .end();
  });
};

exports.updateUser = async function (req, res) {
  // TODO обновление везде
  var userToUpdate = req.body.userToUpdate;

  if (!userToUpdate) {
    return res
      .status(400)
      .json({
        err: "field (usertoupdate) are required",
        status: INTERNAL_ERROR,
      })
      .end();
  }

  var state = false;
  await Users.findOne({ username: userToUpdate }, (err, user) => {
    if (err) {
      return res
        .status(500)
        .json({ err: err.message, status: INTERNAL_ERROR })
        .end();
    }
    if (!user) {
      state = true;
    }
  });

  if (state) {
    return res
      .status(400)
      .json({ err: "User not found", status: STATUS_DBOBJECT_NOT_FOUND })
      .end();
  }
  try {
    await Users.findOneAndUpdate(
      // TODO восстановление пароля
      { username: userToUpdate },
      req.body.newData,
      { new: true },
      async (err, user) => {
        if (err) {
          return res
            .status(500)
            .json({ err: err.message, status: INTERNAL_ERROR })
            .end();
        }
        return res
          .status(200)
          .json({ message: "updated", status: SUCCESS })
          .end();
      }
    );

    if (req.body.newData.username) {
      await Projects.updateMany(
        { "projectMembers.username": userToUpdate },
        { $set: { "projectMembers.$.username": req.body.newData.username } },
        { multi: true }
      );
      await Chats.updateMany(
        { "chatMembers.username": userToUpdate },
        { $set: { "chatMembers.$.username": req.body.newData.username } },
        { multi: true }
      );
      await ReportedUsers.updateMany(
        { username: userToUpdate },
        { username: req.body.newData.username },
        { multi: true }
      );
    }
  } catch (error) {
    if (err.code === 11000) {
      return res
        .status(500)
        .json({ err: "Данный никнейм уже занят.", status: INTERNAL_ERROR })
        .end();
    } else {
      return res.status(500).json({ err: "Something wrong" }).end();
    }
  }
};

exports.deleteUser = async function (req, res) {
  // TODO сделать удаление из всего
  var userToDelete = req.body.username;
  if (!userToDelete) {
    return res
      .status(400)
      .json({
        err: "field (usertoupdate) are required",
        status: INTERNAL_ERROR,
      })
      .end();
  }
  var userFromBD = await Users.findOne(
    { username: userToDelete },
    async function (err, user) {
      if (err) {
        return res
          .status(500)
          .json({ err: err.message, status: INTERNAL_ERROR })
          .end();
      }
      if (!user) {
        return;
      }

      var stat = {
        proj: false,
        chats: false,
        repor: false,
      };
      await Projects.find(
        { "projectMembers.username": userToDelete },
        (err, project) => {
          if (err) {
            return res
              .status(500)
              .json({ err: err.message, status: INTERNAL_ERROR })
              .end();
          }
          if (!project) {
            stat.proj = false;
          } else {
            project.projectMembers.forEach((element) => {
              if (element.username === userFromBD.username) {
                project.projectMembers.pull(element);
              }
            });
            project.save();
            stat.proj = true;
          }
        }
      );
      await Chats.find(
        { "chatMembers.username": userToDelete },
        (err, chat) => {
          if (err) {
            return;
          }
          if (!chat) {
            stat.chats = false;
          } else {
            chat.chatMembers.forEach((element) => {
              if (element.username === userFromBD.username) {
                chat.chatMembers.pull(element);
              }
            });
            chat.save();
            stat.chats = true;
          }
        }
      );
      await ReportedUsers.findOneAndRemove(
        { username: userToDelete },
        { multi: true },
        (err) => {
          if (err) {
            stat.repor = false;
          } else {
            stat.repor = true;
          }
        }
      );

      await user.remove(function (err, doc) {
        if (err) {
          return res
            .status(500)
            .json({ err: err.message, status: INTERNAL_ERROR })
            .end();
        }
        return res
          .status(200)
          .json({
            message: "deleted",
            status: SUCCESS,
            deletFromEverywhere: stat,
          })
          .end();
      });
    }
  );
};

exports.getUsers = async function (req, res) {
  await Users.find({ role: "user" }, function (err, result) {
    if (err) {
      return res
        .status(400)
        .json({ err: err.message, status: INTERNAL_ERROR })
        .end();
    }
    return res.status(200).json({ result, status: SUCCESS }).end();
  });
};

// var member = await Projects.aggregate(
//   [
//     {
//       $project: {
//         projectMembers: {
//           $filter: {
//             input: "$projectMembers",
//             as: "members",
//             cond: {
//               $eq: ["$$members.username", user.username],
//             },
//           },
//         },
//       },
//     },
//   ],
//   async (err, countOfDocs) => {
//     if (err) {
//       console.log("err: ", err.message);
//     }
//   }
// );
