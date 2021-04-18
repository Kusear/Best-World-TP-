var nodemailer = require("nodemailer");

exports.mailAuthMessage = {
  from: "best-world-team@bw.com",
  to: "",
  subject: "Test message",
  html:
    "<h1>Test message</h1>" +
    "<br>Bruh</br>" +
    "<a href = 'http://localhost:3000/api/emailAuth'>Go to site</a>",
};
// "<a href = 'https://best-world.herokuapp.com/'>Go to site</a>",

exports.transport = nodemailer.createTransport(
  /*{
  host: "",
  port: 465,
  secure: true,
  auth: {
    user: "dan-smile@mail.ru",
    pass: "buhf yf ljnf2",
  },
}*/
  {
    aliases: ["Google Mail"],
    domains: ["gmail.com", "googlemail.com"],
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
      username: "MYEMAIL",
      password: "MYPASS",
    },
  }
);
