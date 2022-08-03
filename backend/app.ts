//require('./tracing')

import { randomBytes } from "crypto";
import { match } from "./matches";

const BOARD_SIZE: number = 32;
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

let users:Foo={};
// Mongo
const mongoose = require('mongoose');
try {
    mongoose.connect(mongoConfig.url);
} catch (error) {
    console.log('no mongo connection')
}

const User = mongoose.model('User');
const Match = mongoose.model("Match");

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
    
    res.status(200).json({message: "ok"});
  } else {
    
    res.status(400).json({message: "user exists"});
  }
});

app.post('/signin', (req, res) => {
  const { username, password } = req.body;
  const hashed = crypto2
    .createHash("sha256")
    .update(password)
    .digest("hex");
  
  const user = User.findOne({ username:username,password:hashed},function(err,sub){
    console.log(sub)
    if (sub) {
      const token = jwt.sign({ username: username,  role: user.role }, secret);
      res.status(200).json({ token });
  
  
    } else {
      res.status(400).json({message: "Credenziali errate!"});
    }
  });
  
  
  
  
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
    
    User.find({username:username},function(err,sub){
      User.find({_id:sub[0].friends},function(err,sub){
        io.emit("updateFriends",sub)
        
      })
    })
  });
  
  res.sendStatus(200);
});
app.get('/allUsers', authenticateJWT, (req, res) => {
  console.log("STAMPA DI TUTTI GLI UTENTI: "+users);
  res.status(200).json({users});
});
app.post('/friend', authenticateJWT, (req, res) => {
  const { username } = req.body;
  User.find({username:username},function(err,sub){
    User.find({_id:sub[0].friends},function(err,sub){
      if(sub[0]){
        res.status(200).json(sub);
      }else{
        res.status(400).json({message:"Amici non trovati!"});
      }
      
    })
  })
  
});
app.post('/logout', authenticateJWT, (req, res) => {
  const { username } = req.body;
  console.log(req.body)
  delete users[username];
  io.emit("updatePlayers",users);
  
  res.status(200).json({message: "ok"});
  
});
app.post('/matchId', authenticateJWT, (req, res) => {
  const { id } = req.body;
  res.json({match:matches[id]});
  
});
app.get('/matches', authenticateJWT, (req, res) => {
  if(matches){
    res.status(200).json({matches});

  }else{
    res.status(400).json({message:"Non ci sono partite in corso!"});
  }
  
  
});
app.post('/getHistoricalMatches', authenticateJWT, (req, res) => {
  const { username } = req.body;
  const f = Match.find({$or: [{ player1: username },{ player2: username }]},function(err,sub){
    console.log("STAMPA DELLO STORICO "+sub[0])
    if(sub){
      res.status(200).json({sub});

  }else{
    res.status(400).json({message:"Non ci sono partite nello storico!"});
  }
    
  });
    
  
  
});
//const { logger2 } = require('./logger.ts');




var matches:match[]=[];
let j=0;
matches[0]=new match();
matches[j].id=makeid(20);
io.on('connection', (socket) => {
  
  //logger.error({ message: 'user connected', labels: { 'key': 'value' } })
  socket.on('Move', function (data) {
    console.log("Mossa inviata "+data.gameId+" "+data.canPlay+" "+data.board)
    matches[data.gameId].boards=data.boards;
    matches[data.gameId].whoPlay=data.opponent;
    socket.to(matches[data.gameId].id).emit("Move", data);
    socket.to("visitors"+matches[data.gameId].id).emit("ListenGames", matches[data.gameId])
  });
  socket.on('Board', function (data) {
    matches[j].boards[data.username]=data.board;
    console.log("DIOCANE");
    
  });
  socket.on('login',function(data){
    users[data.username] = socket.id;
    io.emit("updatePlayers",users);
  });
  
  socket.on("friendRequest",function(data){   
    io.to(users[data.friend]).emit("friendRequest", data);
  })
  socket.on("matchRequest",function(data){
    io.to(users[data.username]).emit("matchRequest", data);
    
  })
  socket.on("matchConfirm",function(data){
    io.to(users[data.username]).emit("matchConfirm");
  });
  socket.on("inGame",function(data){
      if (data.visitor==true){
        console.log("ENTRA UN VISITATORE!")
        socket.join("visitors"+matches[data.gameId].id);
      }else{
        while(matches[j]!=null && matches[j].members==2 ){
          j++;
        }
        if(matches[j]==null){
          matches[j]=new match();
          matches[j].id=makeid(20);
        }
        
        
        matches[j].players[matches[j].i]=data.username;
        matches[j].i++;
        socket.join(matches[j].id);
        console.log("ENTRA NELLA STANZA "+matches[j].id)
        io.emit("new_member", {members:matches[j].members+1,gameId:j});
        console.log("si è aggiunto al gioco! "+matches[j].members);
        matches[j].members++;
      
        
      }      
      if(matches[j].members==2){
        const randomElement = matches[j].players[Math.floor(Math.random() * matches[j].players.length)];
        if(randomElement==matches[j].players[0]){
          matches[j].whoPlay=matches[j].players[0];
          io.to(users[matches[j].players[0]]).emit("Board", {board: matches[j].boards[matches[j].players[1]],username:matches[j].players[1],canPlay:true});
          io.to(users[matches[j].players[1]]).emit("Board", {board: matches[j].boards[matches[j].players[0]],username:matches[j].players[0],canPlay:false});
        }else{
          matches[j].whoPlay=matches[j].players[1];
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
  socket.on('quitGame', async (data) => {
    //logger2.error({ message: 'user disconnected', labels: { 'key': 'value' } })
    console.log("Partita numero "+data.gameId);
    if(data.gameId!=undefined && data.gameId>=0 && matches[data.gameId].members>0){
      if(matches[data.gameId].boards[matches[data.gameId].players[0]].player.score>=BOARD_SIZE || matches[data.gameId].boards[matches[data.gameId].players[1]].player.score>=BOARD_SIZE){

      }else{ 
        (data.username==matches[data.gameId].players[0])? matches[data.gameId].boards[matches[data.gameId].players[1]].player.score=BOARD_SIZE : matches[data.gameId].boards[matches[data.gameId].players[0]].player.score=BOARD_SIZE;
        console.log("PUNTEGGI INVIATI"+matches[data.gameId].boards[matches[data.gameId].players[1]].player.score+" "+matches[data.gameId].boards[matches[data.gameId].players[0]].player.score)
        socket.to("visitors"+matches[data.gameId].id).emit("ListenGames", matches[data.gameId]);
        io.emit("new_member", {members:matches[data.gameId].members-1,gameId:data.gameId});
        
      }
      const r = await new Match({
        player1: matches[data.gameId].players[0],
        player2: matches[data.gameId].players[1],
        score1: matches[data.gameId].boards[matches[data.gameId].players[0]].player.score,
        score2: matches[data.gameId].boards[matches[data.gameId].players[1]].player.score,
        winner: max(data.gameId)
      }).save();
     
      console.log("CANCELLATO IL GAME");
      j=data.gameId;
      console.log("UN GIOCATORE HA QUITATO");
      io.to(users[data.username]).emit("quitGame");
      matches[data.gameId]=new match();
      console.log("L'utente si è disconnesso");
    }
    
    
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

function max(id){
  if(matches[id].boards[matches[id].players[0]].player.score>matches[id].boards[matches[id].players[1]].player.score){
    return matches[id].players[0];
  }else{
    return matches[id].players[1];
  }
}

