var nodemailer = require("nodemailer");

const CHAT_NOTIFICATION = 0;
const PROJECT_NOTIFICATION = 1;
const TASK_LIST_NOTIFICATION = 2;

var transport = nodemailer.createTransport(
  {
    service: "Gmail",
    auth: {
      type: "OAuth2",
      user: process.env.OWNER_EMAIL,
      refreshToken: process.env.GMAIL_REFRESH_TOKEN,
      clientId: process.env.CLIENT_ID,
      clientSecret: process.env.CLIENT_SECRET,
      accessToken: process.env.ACCESS_TOKEN,
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

exports.sendMessageEmail = async (info) => {
  // var info = {
  //   notificationID: 1,
  //   email: "",
  //   slug: "",
  //   username: "",
  //   text: "",
  //   theme: "",
  //   title: "",
  // };
  var mailhMessage;
  switch (info.notificationID) {
    case CHAT_NOTIFICATION: {
      mailhMessage = {
        to: info.email,
        subject: "Не прочитанные сообщения из чатов",
        html:
          "<h1>Не прочитанные сообщения из чатов</h1>" +
          "<div>" +
          "<br>" +
          "У вас есть непрочитанные сообщения в чатах." +
          "</div>" +
          "<div>" +
          "<br>" +
          "Для перехода на страницу чатов нажмите на ссылку ниже." +
          "</div>" +
          "<div><a href =" +
          process.env.FRONT_URL +
          "chat" +
          ">Чаты </a></div>",
      };
      break;
    }
    case PROJECT_NOTIFICATION: {
      mailhMessage = {
        to: info.email,
        subject: "Изменение информации проекта",
        html:
          "<h1>Изменение информации проекта</h1>" +
          "<div>" +
          "<br>" +
          "В проекте произошли изменения." +
          "</div>" +
          "<div>" +
          "<br>" +
          "Для перехода на страницу проекта нажмите на ссылку ниже." +
          "</div>" +
          "<div><a href =" +
          process.env.FRONT_URL +
          "projects/" +
          info.slug +
          ">Проект</a></div>",
      };
      break;
    }
    case TASK_LIST_NOTIFICATION: {
      var Projects = require("../models/project").Project;
      var project = await Projects.findOne({ slug: info.slug }, (err) => {});
      mailhMessage = {
        to: info.email,
        subject: "Изменение задач проекта",
        html:
          "<h1>Изменение задач проекта</h1>" +
          "<div>" +
          "<br>" +
          "В доске задач проекта '" +
          project.title +
          "' произошли изменения." +
          "</div>" +
          "<div>" +
          "<br>" +
          "Для перехода к доске задач необходимо перейти в ваш " +
          "<div><a href =" +
          process.env.FRONT_URL +
          "profile/" +
          info.username +
          ">профиль.</a></div>" +
          " Затем найти нужную карточку проекта и нажать на стрелочку, которая находится в правом нижнем углу карточки." + 
          "</div>",
      };
      break;
    }
    default: {
      mailhMessage = {
        to: info.email,
        subject: info.subject,
        html:
          "<h1>" +
          info.theme +
          "</h1>" +
          "<div>" +
          "<br>" +
          info.text +
          "</div>",
      };
      break;
    }
  }

  transport.sendMail(mailhMessage, function (error, resp) {
    if (error) {
      console.log(error);
    } else {
      console.log(resp);
    }
    transport.close();
  });
};

/*
var mailAuthMessage = {
      to: newUser.email,
      subject: "Test message",
      html:
        "<h1>Test message</h1>" +
        "<br>Bruh</br>" +
        "<div><a href =" +
        process.env.CONFIRM_URL +
        newUser.id +
        ">Verify email</a></div>",
    };
    nodemailer.transport.sendMail(mailAuthMessage, function (error, resp) {
      if (error) {
        console.log(error);
      } else {
        console.log(resp);
      }
      nodemailer.transport.close();
    });
*/
