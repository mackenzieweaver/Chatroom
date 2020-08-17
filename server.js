"use strict";

const express = require("express");
const session = require("express-session");
const bodyParser = require("body-parser");
const fccTesting = require("./freeCodeCamp/fcctesting.js");
const auth = require("./app/auth.js");
const routes = require("./app/routes.js");
const passport = require("passport");
const cookieParser = require("cookie-parser");
const app = express();
const http = require("http").createServer(app);
const sessionStore = new session.MemoryStore();

fccTesting(app); //For FCC testing purposes

app.use("/public", express.static(process.cwd() + "/public"));
app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.set("view engine", "pug");

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: true,
    saveUninitialized: true,
    key: "express.sid",
    store: sessionStore
  })
);

// Connect to mongodb
const MongoClient = require("mongodb").MongoClient;
const uri =
  "mongodb+srv://macknz7:I6ZoDlS9ipLuP8qB@cluster0.j79xz.mongodb.net/peach?retryWrites=true&w=majority";
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});
client.connect(function(err) {
  const db = client.db("peach");
  if (err) console.log("Database error: " + err);

  auth(app, db);
  routes(app, db);
  
});


const io = require("socket.io")(http);
const passportSocketIo = require("passport.socketio");

io.use(passportSocketIo.authorize({
  cookieParser: cookieParser,
  key:          'express.sid',
  secret:       process.env.SESSION_SECRET,
  store:        sessionStore
}));

//start socket.io code
let currentUsers = 0;

// Listen for new connection
io.on("connection", socket => {
  // connection
  console.log('user ' + socket.request.user.name + ' connected');
  currentUsers += 1;
  io.emit('user', {name: socket.request.user.name, currentUsers, connected: true});
  console.log("users online: " + currentUsers);

  // message
  socket.on("chat message", msg => {
    console.log(socket.request.user.name + ': ' + msg);
    io.emit("chat message", {name: socket.request.user.name, message: msg});
  });

  // disconnect
  socket.on("disconnect", () => {
    currentUsers -= 1;
    console.log('user ' + socket.request.user.name + ' disconnected');
    io.emit('user', {name: socket.request.user.name, currentUsers, connected: false});
    console.log("users online: " + currentUsers);
  });
});

http.listen(process.env.PORT || 3000, () => {
  console.log("listening on port " + process.env.PORT);
});
