var passport = require("passport");

exports.login = function (req, res, next) {
  passport.authenticate("local", function (err, user, info) {
    if (err) {
      // произошла ошибка
      return res
        .status(500)
        .json({ err: err.message + " ||bruh" })
        .end();
    }
    if (!user) {
      //пользователь не найден
      return res.status(400).json({ err: "User not found!" }).end();
    }
    req.logIn(user, function (err) {
      // пользователь найден
      if (err) {
        return next(err);
      }
      if (user.role === "admin") {
        return res.redirect("/admin");
      }
      if (user.role === "moder") {
        return res.redirect("/moder");
      }
      return res.redirect("/user");
    });
  })(req, res, next);
};

exports.logout = function (req, res) {
  req.logOut();
  res.redirect("/");
};
