var nodemailer = require("nodemailer");

// exports.mailAuthMessage = {
//   from: "kusear7@gmail.com",
//   to: "dan-smile@mail.ru",
//   subject: "Test message",
//   html:
//     "<h1>Test message</h1>" +
//     "<br>Bruh</br>" +
//     "<a href = 'http://localhost:3000/api/emailAuth'>Go to site</a>",
// };
// "<a href = 'https://best-world.herokuapp.com/'>Go to site</a>",

var transport = nodemailer.createTransport({
  service: "Gmail",
  auth: {
    type: "OAuth2",
    username: "kusear7@gmail.com",
    password: "game_on_dota2",
  },
});

transport.set("oauth2_provision_cb", (user, renew, callback) => {
  let accessToken = userTokens[user];
  if (!accessToken) {
    return callback(new Error("Unknown user"));
  } else {
    return callback(null, accessToken);
  }
});

transport.on("token", (token) => {
  console.log("A new access token was generated");
  console.log("User: %s", token.user);
  console.log("Access Token: %s", token.accessToken);
  console.log("Expires: %s", new Date(token.expires));
});

module.exports.transport = transport;
