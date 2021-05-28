const Users = require("../models/user_model").User;
const Projects = require("../models/project").Project;
const projectMembers = require("../models/project").Members;

/* TODO
 * узнать про проекты в архиве (тип отдельная функция или при удалении проекта)
 */

exports.userData = async function (req, res) {
  var user = await Users.findOne(
    { username: req.query.username },
    function (err) {
      if (err) {
        return res.status(500).json({ err: err.message }).end();
      }
    }
  );

  console.log("query: ", req.query);
  console.log("body: ", req.body);
  console.log("params: ", req.params);

  if (!user) {
    return res.status(500).json({ err: "User not found" }).end();
  }

  var member = await Projects.aggregate(
    [
      {
        $project: {
          projectMembers: {
            $filter: {
              input: "$projectMembers",
              as: "members",
              cond: {
                $eq: ["$$members.username", user.username],
              },
            },
          },
        },
      },
    ],
    async (err, countOfDocs) => {
      if (err) {
        console.log("err: ", err.message);
      }
    }
  );

  var memberInProjects = await Projects.find(
    { "projectMembers.username": user.username },
    (err, result) => {
      if (err) {
        return res.status(520).json({ err: err.message }).end();
      }
    }
  );

  var projects = [];
  member.forEach((element) => {
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
    })
    .end();
};

exports.updateUser = async function (req, res) {
  var userToUpdate = req.body.userToUpdate;

  if (!userToUpdate) {
    return res
      .status(400)
      .json({ err: "field (usertoupdate) are required" })
      .end();
  }

  var newData = {
    username: req.body.username,
    email: req.body.email,
    password: req.body.password,
    preferredRole: req.body.preferredRole,
    name: req.body.name,
    role: req.body.role,
    info: req.body.info,
  };

  await Users.findOne({ username: userToUpdate }, async function (err, user) {
    if (err) {
      return res.status(500).json({ err: err.message }).end();
    }
    if (!user) {
      return res.status(400).json({ err: "User not found" }).end();
    }

    if (newData.username) {
      user.username = newData.username;
    }
    if (newData.email) {
      user.email = newData.email;
    }
    if (newData.password && !user.verifyPassword(newData.password)) {
      user.password = user.hashPassword(newData.password);
    }
    if (newData.name) {
      user.name = newData.name;
    }
    if (newData.preferredRole) {
      user.preferredRole = newData.preferredRole;
    }
    if (newData.role) {
      user.role = newData.role;
    }
    if (newData.info) {
      user.info = newData.info;
    }

    await user.update(function (err, doc) {
      if (err) {
        return res.status(400).json({ err: err.message }).end();
      }
      return res.status(200).json({ message: "updated" }).end();
    });
  });
};

exports.deleteUser = async function (req, res) {
  var userToDelete = req.body.username;
  if (!userToUpdate) {
    return res
      .status(400)
      .json({ err: "field (usertoupdate) are required" })
      .end();
  }
  await Users.findOne(userToDelete, async function (err, user) {
    if (err) {
      return res.status(500).json({ err: err.message }).end();
    }
    if (!user) {
      return res.status(400).json({ message: "User not found" }).end();
    }
    await user.remove(function (err, doc) {
      if (err) {
        return res.status(500).json({ err: err.message }).end();
      }
      return res.status(200).json({ message: "deleted" }).end();
    });
  });
};

exports.getUsers = async function (req, res) {
  await Users.find({role: "user"}, function (err, result) {
    if (err) {
      return res.status(400).json({ err: err.message }).end();
    }
    return res.status(200).json(result).end();
  });
};

