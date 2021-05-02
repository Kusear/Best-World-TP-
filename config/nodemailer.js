var nodemailer = require("nodemailer");

/* TODO
 * сделать ссылку для подтверждения
 * реализовать подтверждение в бд
 */

// "<a href = 'https://best-world.herokuapp.com/'>Go to site</a>",

var transport = nodemailer.createTransport(
  {
    service: "Gmail",
    auth: {
      type: "OAuth2",
      user: process.env.OWNER_EMAIL,
      refreshToken: process.env.REFRESH_TOKEN,
      clientId: process.env.CLIENT_ID,
      clientSecret: process.env.CLIENT_SECRET,
    },
  },
  {
    from: "Best world team <kusear7@gmail.com>",
  }
);

transport.verify((err, success) => {
  if (err) {
    return console.log(err);
  }
  transport.on("token", (token) => {
    console.log("A new access token was generated");
    console.log("User: %s", token.user);
    console.log("Access Token: %s", token.accessToken);
    console.log("Expires: %s", new Date(token.expires));
  });
});

module.exports.transport = transport;
