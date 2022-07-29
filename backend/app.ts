//require('./tracing')

const config = require('config');
const appConfig = config.get('app');
const mongoConfig = config.get('mongo');
const jwtSecret = config.get('jwtSecret');

const port = appConfig.port;

// Express imports
const express = require('express');
const cors = require('cors');

// Express Initialization
const app = express();
app.use(cors());
app.use(express.json());

// HTTP server
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

const secret = jwtSecret;

// Auto-load modules
const fs = require('fs');
const join = require('path').join;
const models = join(__dirname, 'models');
fs.readdirSync(models)
  .filter(file => ~file.indexOf('.js'))
  .forEach(file => require(join(models, file)));

// Mongo
const mongoose = require('mongoose');
try {
    mongoose.connect(mongoConfig.url);
} catch (error) {
    console.log('no mongo connection')
}

const User = mongoose.model('User');

app.post('/signup', async (req, res) => {
  const { name, username, email, password } = req.body;
  const user = await User.exists({ username });
  console.log(req.body);
  
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
    console.log("DIOCANE");
    res.status(200).json({message: "ok"});
  } else {
    console.log("FALLITO");
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
     console.log(token);
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

app.get('/foo', (req, res) => {
  console.log("DIOEBREO");
  res.send('Hello World!');
});

app.get('/', authenticateJWT, (req, res) => {
  res.send('Hello World!');
});

const { logger } = require('./logger.ts');
let members=0;
io.on('connection', (socket) => {
 
  //logger.error({ message: 'user connected', labels: { 'key': 'value' } })
  socket.on('Move', function (data) {
    socket.to("game").emit("Move", data);
  });
  socket.on('Board', function (data) {
    console.log("DIOCANE");
    socket.to("game").emit("Board", data);
  });
  socket.on("inGame",function(){
      console.log("Membri prima dell'entrata: "+members);
      members++;
      console.log("Membri dopo dell'entrata: "+members);
      if (members <= 2) {
        socket.join("game");
        io.emit("new_member", members);
        console.log("si è aggiunto al gioco! "+members);
    }
  })
  

    
  socket.on('message', arg => {
      logger.error({ message: 'message received', labels: { 'key': 'value' } })
      console.log(arg);
  })

  socket.on('disconnect', () => {
      logger.error({ message: 'user disconnected', labels: { 'key': 'value' } })
      members--;
  })
});

server.listen(port, function () {
  console.log(`Example app listening on ${port}!`);
});


app.get('/chat', async (req, res) => {
    const { ChatClient } = require('./chat');
    let c = new ChatClient(1)
    c.put('Hello, World!', 3)
    await c.get(3)
        .then(response => response.hits.hits.map(i => i._source.text))
        .then(items => res.json(items))
});

export {};
