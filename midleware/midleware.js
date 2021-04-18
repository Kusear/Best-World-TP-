exports.auth = function (req, res, next) {
  console.log("session: ", req.session);
  res.header('Access-Control-Allow-Credentials', true);
  if (req.isAuthenticated()) {
    next();
  } else res.status(400).json("No auth").end();
};

exports.supAdminRoleCheck = function (req, res, next) {
  // console.log("role: ", req.user.role);
  if (req.user.role === "superadmin") {
    return next();
  } else {
    return res.status(400).json({err: "Not allowed"}).end();
  }
  // return res.sendStatus(500).json("No user's role");
};

exports.adminRoleCheck = function (req, res, next) {
    // console.log("role: ", req.user.role);
    if (req.user.role === "admin") {
      return next();
    } else {
      return res.status(400).json({err: "Not allowed"}).end();
    }
    // return res.sendStatus(500).json("No user's role");
  };

  exports.userRoleCheck = function (req, res, next) {
    // console.log("role: ", req.user.role);
    if (req.user.role === "user") {
      return next();
    } else {
      return res.status(400).json({err: "Not allowed"}).end();
    }
    // return res.sendStatus(500).json("No user's role");
  };
