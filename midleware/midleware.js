var passport = require("passport");

exports.auth = passport.authenticate("jwt", { session: false });

exports.roleCheck = function (...allowed) {
  var isAllowed = (role) => allowed.indexOf(role) > -1;
  return function (req, res, next) {
    if (req.user && isAllowed(req.user.role)) {
      next();
    } else {
      res.status(400).json({ message: "Forbidden" });
    }
  };
};