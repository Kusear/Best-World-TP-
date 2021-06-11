const mongoose = require("mongoose");
const mongodb = require("mongodb");
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

    var endSTR = "";
    var gfs = new mongodb.GridFSBucket(mongoose.connection.db, mongoose.mongo);

    gfs
      .openDownloadStreamByName(user.image, { revision: -1 })
      .on("data", (chunk) => {
        console.log("Filename: ", user.image, "CHUNK: ", chunk);
        endSTR += Buffer.from(chunk, "hex").toString("base64");
      })
      .on("error", function (err) {
        console.log("ERR: ", err);
        user.image = "default";
      })
      .on("close", () => {
        user.image = endSTR;
        console.log("aboba");
      });

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

    var i = 0;
    var i3 = 0;
    projects.forEach((element) => {
      element.project = memberInProjects[i];
      var endSTR2 = "";
      gfs
        .openDownloadStreamByName(element.project.image, { revision: -1 })
        .on("data", (chunk) => {
          console.log("Filename: ", element.project.image, "CHUNK: ", chunk);
          endSTR2 += Buffer.from(chunk, "hex").toString("base64");
        })
        .on("error", (err) => {
          console.log("ERR: ", err);
          element.project.image = "default";

          gfs
            .openDownloadStreamByName("default", {
              revision: -1,
            })
            .on("data", (chunk) => {
              console.log(
                "Filename: ",
                element.project.image,
                "CHUNK: ",
                chunk
              );
              endSTR2 += Buffer.from(chunk, "hex").toString("base64");
            })
            .on("error", function (err) {
              console.log("ERR: ", err);
              element.project.image = "ERR in image";
            })
            .on("close", () => {
              element.project.image = endSTR2;
              console.log(i3);
              if (i3 == projects.length - 1) {
                return res
                  .status(200)
                  .json({
                    id: user._id,
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
              }
              i3++;
            });
        })
        .on("close", () => {
          element.project.image = endSTR2;
          if (i3 == projects.length - 1) {
            return res
              .status(200)
              .json({
                id: user._id,
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
          }
          i3++;
        });

      if (memberInProjects[i].archived) {
        element.archived = true;
      }
      i++;
    });

    // projects.forEach((element) => {
    //   console.log("PR: ", element.project);
    //   if (element.image === "default") {
    //     gfs
    //       .openDownloadStreamByName("default", {
    //         revision: -1,
    //       })
    //       .on("data", (chunk) => {
    //         console.log(
    //           "Filename: ",
    //           projects[i].project.image,
    //           "CHUNK: ",
    //           chunk
    //         );
    //         endSTR2 += Buffer.from(chunk, "hex").toString("base64");
    //       })
    //       .on("error", function (err) {
    //         console.log("ERR: ", err);
    //         projects[i].project.image = "ERR in image";
    //       })
    //       .on("close", () => {
    //         projects[i].project.image = endSTR2;
    //       });
    //   }
    // });

    console.log("\nprojects: ", projects);
    // gfs
    //   .openDownloadStreamByName(user.image, { revision: -1 })
    //   .on("data", (chunk) => {
    //     console.log("Filename: ", user.image, "CHUNK: ", chunk);
    //     endSTR += Buffer.from(chunk, "hex").toString("base64");
    //   })
    //   .on("error", function (err) {
    //     console.log("ERR: ", err);
    //     user.image = "default";
    //     return res
    //       .status(200)
    //       .json({
    //         id: user._id,
    //         username: user.username,
    //         email: user.email,
    //         name: user.name,
    //         role: user.role,
    //         preferredRole: user.preferredRole,
    //         info: user.info,
    //         image: user.image,
    //         projects: projects,
    //         emailConfirm: user.emailConfirm,
    //         status: SUCCESS,
    //       })
    //       .end();
    //   })
    //   .on("close", () => {
    //     user.image = endSTR;
    //     console.log("aboba");
    //     return res
    //       .status(200)
    //       .json({
    //         id: user._id,
    //         username: user.username,
    //         email: user.email,
    //         name: user.name,
    //         role: user.role,
    //         preferredRole: user.preferredRole,
    //         info: user.info,
    //         image: user.image,
    //         projects: projects,
    //         emailConfirm: user.emailConfirm,
    //         status: SUCCESS,
    //       })
    //       .end();
    //   });
  });
};

exports.lightUserData = async (req, res) => {
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

    await Projects.findOne(
      { "projectMembers.username": user.username },
      (err, prUser) => {
        var endSTR = "";
        var gfs = new mongodb.GridFSBucket(
          mongoose.connection.db,
          mongoose.mongo
        );
        gfs
          .openDownloadStreamByName(user.image, { revision: -1 })
          .on("data", (chunk) => {
            console.log("CHUNK: ", chunk);
            endSTR += Buffer.from(chunk, "hex").toString("base64");
          })
          .on("error", function (err) {
            console.log("ERR: ", err);
            user.image = "default";
            return res
              .status(200)
              .json({
                username: user.username,
                image: user.image,
                role: prUser.role,
              })
              .end();
          })
          .on("close", () => {
            user.image = endSTR;
            return res
              .status(200)
              .json({
                username: user.username,
                image: user.image,
                role: prUser.role,
              })
              .end();
          });
      }
    );
  });
};

exports.updateUser = async function (req, res) {
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
    Users.findOneAndUpdate(
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

        try {
          if (req.body.newData.username) {
            await Projects.updateMany(
              { "projectMembers.username": userToUpdate },
              {
                $set: {
                  "projectMembers.$.username": req.body.newData.username,
                },
              },
              { multi: true }
            );
            await Projects.updateMany(
              { creatorName: userToUpdate },
              { $set: { creatorName: req.body.newData.username } },
              { multi: true }
            );
            await Projects.updateMany(
              { managerName: userToUpdate },
              { $set: { managerName: req.body.newData.username } },
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
        } catch (e) {
          console.log("ERROR WITH updateMany");
        }
        return res
          .status(200)
          .json({ message: "updated", status: SUCCESS })
          .end();
      }
    );
  } catch (error) {
    if (error.code === 11000) {
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

      try {
        // await pr.requests.pull({ _id: req.body.id });
        await Projects.findOneAndUpdate(
          // TODO протестировать
          { "projectMembers.username": userToDelete },
          { $pull: { projectMembers: { username: user.username } } }
        );
        await Chats.findOneAndUpdate(
          // TODO протестировать
          { "chatMembers.username": userToDelete },
          { $pull: { chatMembers: { username: user.username } } }
        );
      } catch (ex) {
        exeptionPullRequests = ex;
      }
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
