// Express imports
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

// Express Initialization
const app = express();
app.use(cors());
app.use(bodyParser.json());

const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");

// Sockets
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["*"]
}});

// Crypto
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

const secret = "porcodio";

// Auto-load modules
const fs = require('fs');
const join = require('path').join;
const models = join(__dirname, 'models');
fs.readdirSync(models)
  .filter(file => ~file.indexOf('.js'))
  .forEach(file => require(join(models, file)));

// Mongo
const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/c4');

const User = mongoose.model('User');

app.post('/signup', async (req, res) => {
  const { name, username, email, password } = req.body;
  const user = await User.exists({ username });

  if (!user) {
    const hashed = crypto
      .createHash("sha256")
      .update(password)
      .digest("hex");

    const r = await new User({
      name,
      username,
      email,
      password: hashed
    }).save();

    res.status(200).json({message: "ok"});
  } else {
    res.status(400).json({message: "user exists"});
  }
});

app.post('/signin', (req, res) => {
  const { username, password } = req.body;
  const hashed = crypto
    .createHash("sha256")
    .update(password)
    .digest("hex");
  const user = User.find({ username, password: hashed });

  if (user) {
    const token = jwt.sign({ username: user.username,  role: user.role }, secret);
    res.json({ token });
  } else {
    res.sendStatus(400);
  }
});

const authenticateJWT = (req, res, next) => {
  const header = req.headers.authorization;

  if (header) {
    const [preamble, token] = header.split(' ');
    jwt.verify(token, secret, (err, user) => {
      if (err) {
        return res.sendStatus(403);
      }

      req.user = user;
      next();
    });
  } else {
    res.sendStatus(401);
  }
};

app.get('/', authenticateJWT, (req, res) => {
  res.send('Hello World!');
});

io.on('connection', (socket) => {
  console.log('a user connected');
});

server.listen(3000, function () {
  console.log('Example app listening on port 3000!');
});

