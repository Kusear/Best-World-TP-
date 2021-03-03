var express = require("express");
var bodyParser = require("body-parser");
var mqtt = require("mqtt");
var mongoDBClient = require("mongodb").MongoClient;
var ObjectID = require("mongodb").ObjectID;
var db = require("./db");

var app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname));

const options = {
  clientId: "web-client",
  connectTimeout: 5000,
  hostname: "localhost",
  port: 1883,
  path: "/mqtt",
};

/*
  регистрация
  авторизация
  (просто регистрация и авторизация)
   для авторизации использовать passport (библиотека)
*/

var client = mqtt.connect(options);

var topic1 = "out";
var mess = "";
const collName = "users";

let mes = "null";

app.get("/", function (req, res) {
  if (client.connected) {
    var mes = {
      status: true,
    };
    console.log("connected");
    res.send(mes);
    client.end();
  }
});

app.get("/api/users", function (req, res) {
  db.get()
    .collection(collName)
    .find()
    .toArray(function (err, docs) {
      if (err) {
        console.log(err);
        return res.sendStatus(500);
      }
      res.send(docs);
    });
});

app.get("/api/users/userById", function (req, res) {
  db.get()
    .collection(collName)
    .findOne({ _id: ObjectID(req.body.id) }, function (err, doc) {
      if (err) {
        console.log(err);
        return res.sendStatus(500);
      }
      res.send(doc);
    });
});

app.get("/api/users/updateUser", function (req, res) {
  db.get()
    .collection(collName)
    .updateOne(
      { _id: ObjectID(req.body.id) },
      { $set: { name: req.body.name } },
      {
        upsert: false,
        multi: false,
      },
      function (err, result) {
        if (err) {
          console.log(err);
          return res.sendStatus(500);
        }
        res.sendStatus(200);
      }
    );
});

app.post("/api/users/deleteUser", function (req, res) {
  db.get()
    .collection(collName)
    .deleteOne({ _id: ObjectID(req.body.id) }, function (err, result) {
      if (err) {
        console.log(err);
        return res.sendStatus(500);
      }
      res.sendStatus(200);
    });
});

app.post("/api/users/addUser", function (req, res) {
  var user = {
    name: req.body.name,
  };

  db.get()
    .collection(collName)
    .insertOne(user, function (err, result) {
      if (err) {
        console.log(err);
        return res.sendStatus(500);
      }
      res.send(user);
    });
});

app.post("/api/lamp1/status", function (req, res) {
  var myTopic = "out";
  //var client = mqtt.connect(options);
  client = mqtt.connect(options);
  client.subscribe(myTopic, function (err) {
    if (!err) {
      console.log("subscribed on " + myTopic);
    }
    client.on("message", function (myTopic, message) {
      console.log(message.toString());
      mes = message.toString();
      client.unsubscribe(myTopic);
    });
  });
  client.end();
  return res.json(mes);
  //return res.json(mes);
});

app.post("/api/lamp2/status", function (req, res) {
  var myTopic = "lamp1";
  //var client = mqtt.connect(options);
  client = mqtt.connect(options);
  client.subscribe(myTopic, function (err) {
    if (!err) {
      console.log("subscribed on " + myTopic);
    }
    client.on("message", function (myTopic, message) {
      console.log(message.toString());
      mes = message.toString();
      client.unsubscribe(myTopic);
    });
  });
  client.end();
  return res.json(mes);
});

db.connect(
  "mongodb+srv://new-user222:qwer1234@cluster0.zpuem.mongodb.net/users?retryWrites=true&w=majority",
  function (err) {
    if (err) {
      return console.log(err);
    }
    app.listen(process.env.PORT || 3000, function () {
      console.log("API Working!");
    });
  }
);
//client.on();
/*app.listen(3000, function () {
  console.log("API Working!");
});*/

/*

if (!client.connected) {
    client = mqtt.connect(options);
  } 
  if (client.connected) {
    console.log("connected");
    res.send("<h1> Connected </h1>");
    client.subscribe(topic1, function (err) {
      if (!err) {
        console.log("recieve");
      }
    });
    client.on("message", function (topic1, message) {
      console.log(message.toString());
      resStr = message.toString();
      //res.send("<h1>" + message.toString() + "</h1>");
      client.unsubscribe(topic1);
      client.end();
    });
  }

  const expOptions = {
  url: "http://localhost:3000",
  method: "GET",
  headers: {
    Accept: "application/json",
    "Accept-Charset": "utf-8",
  },
};

*/

/*db.dropCollection("users", function (err, delOK) {
    if (err) {
      return console, log(err);
    }
    if (delOK) {
      console.log("Delete sucsses");
    }
  });*/
