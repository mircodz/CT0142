//require('./tracing')

import { randomBytes } from "crypto";
import { Match } from "./matches";

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
const crypto2 = require('crypto');
const jwt = require('jsonwebtoken');

const secret = jwtSecret;

// Auto-load modules
const fs = require('fs');
const join = require('path').join;
const models = join(__dirname, 'models');
fs.readdirSync(models)
  .filter(file => ~file.indexOf('.js'))
  .forEach(file => require(join(models, file)));
interface Foo {
   
    [key: string]: string;
}
interface Foo2 {
   
  [key: string]: any;
}
let last_user;
let users:Foo={};
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
    const hashed = crypto2
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
  const hashed = crypto2
    .createHash("sha256")
    .update(password)
    .digest("hex");
  const user = User.find({ username, password: hashed });

  
  if (user) {
    const token = jwt.sign({ username: user.username,  role: user.role }, secret);
    res.json({ token });
    users[username]='';
    last_user=username;
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

app.post('/addFriends', authenticateJWT, (req, res) => {
  const { username, friend } = req.body;
 
  const f = User.find({username:friend},function(err,sub){

    User.updateOne({username:username},{$push: { friends: sub[0]._id }},function(err,res){
      console.log("Amicizia inserita!")
    })
    
  });
  const f2 = User.find({username:username},function(err,sub){
    User.updateOne({username:friend},{$push: { friends: sub[0]._id }},function(err,res){
      console.log("Amicizia inserita!")
    })
    
  });
  res.sendStatus(200);
});
app.get('/allUsers', authenticateJWT, (req, res) => {
  console.log("Lista utenti: "+users)
  res.json({users});
});
app.post('/friend', authenticateJWT, (req, res) => {
  const { username } = req.body;
  User.find({username:username},function(err,sub){
   console.log(sub)
    User.find({_id:sub[0].friends},function(err,sub){
      res.json(sub);
      
    })
  })
  
});
app.get('/matches', authenticateJWT, (req, res) => {
  
  res.json({matches});
  
});
//const { logger2 } = require('./logger.ts');




var matches:Match[]=[];
let j=0;
matches[0]=new Match();
matches[0].members=0;
matches[0].id=makeid(20);
matches[0].players=[];
matches[0].boards={};
matches[0].i=0;
matches[0].visitor=0;
io.on('connection', (socket) => {
  
  //logger.error({ message: 'user connected', labels: { 'key': 'value' } })
  socket.on('Move', function (data) {
    console.log("Mossa inviata "+data.gameId+" "+data.canPlay+" "+data.board)
    matches[data.gameId].boards[data.board.player.name]=data.board;
    socket.to(matches[data.gameId].id).emit("Move", data);
    socket.to("visitors"+matches[data.gameId].id).emit("ListenGames", matches[data.gameId].boards)
  });
  socket.on('Board', function (data) {
    matches[j].boards[data.username]=data.board;
    console.log("DIOCANE");
    
  });
  socket.on('login',function(data){
    users[data.username] = socket.id;
  });
  
  socket.on("friendRequest",function(data){
    
    io.to(users[data.friend]).emit("friendRequest", data);
  })
  socket.on("matchRequest",function(data){
    console.log(data.opponent+ " send a request to "+data.username);
    io.to(users[data.username]).emit("matchRequest", data);
    
  })
  socket.on("matchConfirm",function(data){
    io.to(users[data.username]).emit("matchConfirm");
  });
  socket.on("inGame",function(data){
      if (matches[j].members < 2 && data.visitor==false) {
        matches[j].players[matches[j].i]=data.username;
        
        matches[j].i++;
        socket.join(matches[j].id);
        
        io.emit("new_member", {members:matches[j].members+1,gameId:j});
        console.log("si è aggiunto al gioco! "+matches[j].members);
        
      }else if (data.visitor==true){
        console.log("ENTRA UN VISITATORE!")
        socket.join("visitors"+matches[data.gameId].id);
        console.log(matches[data.gameId].boards)
        socket.to("visitors"+matches[data.gameId].id).emit("ListenGames", matches[data.gameId].boards)
      }else if(matches[j].members==2 && data.visitor==false){
        while(matches[j].members>2 ){
          j++;
        }
        matches[j]=new Match();
        matches[j].members=0;
        matches[j].id=makeid(20);
        matches[j].players=[];
        matches[j].boards={};
        matches[j].i=0;
        matches[j].visitor=0;
        matches[j].players[matches[j].i]=data.username;
        matches[j].i++;
        socket.join(matches[j].id);
        
        io.emit("new_member", {members:matches[j].members+1,gameId:j});
        console.log("si è aggiunto al gioco! "+matches[j].members);
      }
      matches[j].members++;


      
      if(matches[j].members==2){
        const randomElement = matches[j].players[Math.floor(Math.random() * matches[j].players.length)];
        if(randomElement==matches[j].players[0]){
          io.to(users[matches[j].players[0]]).emit("Board", {board: matches[j].boards[matches[j].players[1]],username:matches[j].players[1],canPlay:true});
          io.to(users[matches[j].players[1]]).emit("Board", {board: matches[j].boards[matches[j].players[0]],username:matches[j].players[0],canPlay:false});
        }else{
          io.to(users[matches[j].players[0]]).emit("Board", {board: matches[j].boards[matches[j].players[1]],username:matches[j].players[1],canPlay:false});
          io.to(users[matches[j].players[1]]).emit("Board", {board: matches[j].boards[matches[j].players[0]],username:matches[j].players[0],canPlay:true});
        }
      }

  })
  

    
  socket.on('message', arg => {
     // logger2.error({ message: 'message received', labels: { 'key': 'value' } })
      console.log(arg);
  })

  socket.on('disconnect', () => {
      //logger2.error({ message: 'user disconnected', labels: { 'key': 'value' } })
      
  })
  socket.on('quitGame', (data) => {
    //logger2.error({ message: 'user disconnected', labels: { 'key': 'value' } })
    console.log("Partita numero "+data.gameId);
    if(matches[data.gameId].members>0){
      matches[data.gameId].members--;
      matches[data.gameId].players[matches[j].i-1] = "";
      matches[data.gameId].i--;
    }
    j=data.gameId;
    
    io.to(users[data.username]).emit("quitGame");
    console.log("L'utente si è disconnesso");
})
});

server.listen(port, function () {
  console.log(`Example app listening on ${port}!`);
});

function makeid(length) {
  var result           = '';
  var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  var charactersLength = characters.length;
  for ( var i = 0; i < length; i++ ) {
    result += characters.charAt(Math.floor(Math.random() * 
charactersLength));
 }
 return result;
}
app.get('/chat', async (req, res) => {
    const { ChatClient } = require('./chat');
    let c = new ChatClient(1)
    c.put('Hello, World!', 3)
    await c.get(3)
        .then(response => response.hits.hits.map(i => i._source.text))
        .then(items => res.json(items))
});


