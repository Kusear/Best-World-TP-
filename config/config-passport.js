var passport = require("passport");
var JwtStrategy = require("passport-jwt").Strategy;
var ExtractJwt = require("passport-jwt").ExtractJwt;
var opts = {
  jwtFromRequest: ExtractJwt.fromHeader(process.env.JWT_HEADERAUTHNAME),
  secretOrKey: process.env.JWT_SECRET,
};
var Users = require("../models/user_model").User;

passport.use(
  new JwtStrategy(opts, async function (jwt_payload, done) {
    await Users.findById(jwt_payload.id, function (err, user) {
      if (err) {
        console.log("err JWT_STRATEGY");
        return done(err, false);
      }
      if (user) {
        console.log("token: ", jwt_payload);
        return done(null, user);
      } else {
        console.log("err else");
        return done(null, false);
      }
    });
  })
);
