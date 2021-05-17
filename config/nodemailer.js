var nodemailer = require("nodemailer");

/* TODO 
 * сделать обновление токена для nodemailer
 */

var transport = nodemailer.createTransport(
  {
    service: "Gmail",
    auth: {
      type: "OAuth2",
      user: process.env.OWNER_EMAIL,
      refreshToken: process.env.GMAIL_REFRESH_TOKEN,
      clientId: process.env.CLIENT_ID,
      clientSecret: process.env.CLIENT_SECRET,
      //accessToken: process.env.ACCESS_TOKEN,
    },
  },
  {
    from: "Better world team <kusear7@gmail.com>",
  }
);

transport.on("token", (token) => {
  console.log("A new access token was generated");
  console.log("User: %s", token.user);
  console.log("Access Token: %s", token.accessToken);
  console.log("Expires: %s", new Date(token.expires) + 12000);
});

module.exports.transport = transport;
