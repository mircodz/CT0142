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
   
    if (sub) {
      const token = jwt.sign({ username: username,  role: user.role }, secret);
      res.status(200).json({ token,sub });
  
  
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
        io.to(users[username]).emit("updateFriends",sub)
        
      })
    })
    User.find({username:friend},function(err,sub){
      User.find({_id:sub[0].friends},function(err,sub){
        io.to(users[friend]).emit("updateFriends",sub)
        
      })
    })
  });
  
  res.sendStatus(200);
});
app.get('/allUsers', authenticateJWT, (req, res) => {
  console.log("STAMPA DI TUTTI GLI UTENTI: "+users);
  res.status(200).json({users});
});

app.post('/getAllUsers', authenticateJWT, (req, res) => {
  const {moderator} = req.body;
  User.findOne({username:moderator},function(err,sub){
    if(sub.isModerator){
      User.find({isModerator:false},function(err,sub){

        res.status(200).json({sub});
      });
    }else{
      res.status(400).json({message:"Non sei il moderatore!"});
    }
  });
  
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
app.post('/deleteFriend', authenticateJWT, (req, res) => {
  const { username,friend } = req.body;
  User.findOne({username:username},function(err,sub){
    console.log(sub);
    let friends = sub.friends;
    let idFriend = sub._id;
    User.findOne({username:friend},function(err,sub){
      console.log(sub);
      let i=0;
      if(sub){
        User.updateOne({username:username},{$pull:{friends:sub._id}},function(err,res){
          console.log("Utente aggiornato");
          
        })
        User.updateOne({username:friend},{$pull:{friends:idFriend}},function(err,res){
          console.log("Utente aggiornato");
        })
        User.find({username:username},function(err,sub){
          User.find({_id:sub[0].friends},function(err,sub){
            io.to(users[username]).emit("updateFriends",sub)
            
          })
        })
        User.find({username:friend},function(err,sub){
          User.find({_id:sub[0].friends},function(err,sub){
            io.to(users[friend]).emit("updateFriends",sub)
            
          })
        })
    res.status(200).json({message:"ok"});
     }else{
        res.status(400).json({message:"error"});
      }
      
    })
  })
 
  io.to(users[friend]).emit("friendRemoved",{friend:username});
  
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
  
  console.log("STAMPA del MATCH: "+matches[id]);
  res.json({match:matches.filter(value => value.id == id)[0]});
  
});
app.post('/firstLogin', authenticateJWT, (req, res) => {
  const { username, password,name,email } = req.body;
  const hashed = crypto2
    .createHash("sha256")
    .update(password)
    .digest("hex");
    const user = User.updateOne({ username:username},{$set:{password:hashed,name:name,email:email,isFirstLogin:false}},function(err,sub){
        console.log("PASSWORD AGGIORNATA!")
    })
    res.status(200).json({message: "ok"});
  
  
});

app.post('/deleteUser', authenticateJWT, (req, res) => {
  const { moderator, username } = req.body;
  User.findOne({username:moderator},function(err,sub){
    if(sub.isModerator){
      User.deleteOne({username:username}).then(function(){
        Match.find({player1:username},function(err,sub){
          let i=0;
          while(i<sub.length){
            if(sub[i].winner==username){
              User.updateOne({ username:sub[i].player2},{$inc:{matches:-1,looses:-1}},function(err,sub){
                console.log("UTENTE AGGIORNATA!")
              })
            }else{
              User.updateOne({ username:sub[i].player2},{$inc:{matches:-1,wins:-1}},function(err,sub){
                console.log("UTENTE AGGIORNATA!")
              })
            }
            i++;
          }
        })
        Match.find({player2:username},function(err,sub){
          let i=0;
          while(i<sub.length){
            if(sub[i].winner==username){
              User.updateOne({ username:sub[i].player1},{$inc:{matches:-1,looses:-1}},function(err,sub){
                console.log("UTENTE AGGIORNATA!")
              })
            }else{
              User.updateOne({ username:sub[i].player1},{$inc:{matches:-1,wins:-1}},function(err,sub){
                console.log("UTENTE AGGIORNATA!")
              })
            }
            i++;
          }
        })
        Match.deleteMany({$or:[{player1:username},{player2:username}]}).then(function(){
          res.status(200).json({message: "ok"});
        }).catch(function(error){
          res.status(400).json({message: error});// Failure
        });
        
      }).catch(function(error){
        res.status(400).json({message: error});// Failure
    });
      
    }else{
      res.status(400).json({message:"Non sei il moderatore!"});
    }
  });
    
  
  
});

app.post('/addModeator', authenticateJWT, (req, res) => {
  const { moderator, username,password } = req.body;
  User.findOne({username:moderator},async function(err,sub){
    if(sub.isModerator){
      const hashed = crypto2
      .createHash("sha256")
      .update(password)
      .digest("hex");
      const r = await new User({
        username,
        password: hashed,
        isModerator: true,
        isFirstLogin:true
      }).save();
      res.status(200).json({message: "ok"});
    }else{
      res.status(400).json({message:"Non sei il moderatore!"});
    }
  });
    
  
  
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
  
    if(sub){
      res.status(200).json({sub});

  }else{
    res.status(400).json({message:"Non ci sono partite nello storico!"});
  }
    
  });
    
  
  
});
 
app.post('/chat', authenticateJWT, async (req, res) => {
  const {username,friend} = req.body;
  const { ChatClient } = require('./chat');
  let c = new ChatClient(username);
    
     
    c.put('Hello, World!', "filippo");
    await c.get("filippo")
        .then(response => response.hits.hits.map(i => i._source.text))
        .then(items => res.status(200).json(items))
});
//const { logger2 } = require('./logger.ts');




var matches:match[]=[];
io.on('connection', (socket) => {
  
  //logger.error({ message: 'user connected', labels: { 'key': 'value' } })
  socket.on('Move', async function (data) {
    
    let match = matches.filter(value => value.id==data.gameId)[0];
    match.boards=data.boards;
    match.whoPlay=data.opponent;
    if(match.boards[match.players[0]].player.score>=BOARD_SIZE || match.boards[match.players[1]].player.score>=BOARD_SIZE){
      const r = await new Match({
        player1: match.players[0],
        player2: match.players[1],
        score1: match.boards[match.players[0]].player.score,
        score2: match.boards[match.players[1]].player.score,
        winner: match.players[max(match.id)]
      }).save();
      User.updateOne({username:match.players[max(match.id)]},{$inc:{matches:1,wins:1}},function(err,res){
        console.log("Giocatore aggiornato!")
      });
      User.updateOne({username:match.players[min(match.id)]},{$inc:{matches:1,looses:1}},function(err,res){
        console.log("Giocatore aggiornato!")
      });
    }
    
    io.to(users[data.opponent]).emit("Move", data);
    console.log("STO INVIANDO al "+data.gameId);
    io.to("visitors"+data.gameId).emit("ListenGames", match);
  });
  socket.on('Board', function (data) {
    let match = matches.filter(value => value.id==data.gameId);
    console.log("HO RICEVUTO "+data.board);
    match[0].boards[data.username]=data.board;
    if(Object.keys(match[0].boards).length==2){
      console.log("HO INVIATO LE BOARD DIOCANE")
      const randomElement = match[0].players[Math.floor(Math.random() * match[0].players.length)];
      if(randomElement==match[0].players[0]){
        match[0].whoPlay=match[0].players[0];
        io.to(users[match[0].players[0]]).emit("Board", {board: match[0].boards[match[0].players[1]],username:match[0].players[1],canPlay:true});
        io.to(users[match[0].players[1]]).emit("Board", {board: match[0].boards[match[0].players[0]],username:match[0].players[0],canPlay:false});
      }else{
        match[0].whoPlay=match[0].players[1];
        io.to(users[match[0].players[0]]).emit("Board", {board: match[0].boards[match[0].players[1]],username:match[0].players[1],canPlay:false});
        io.to(users[match[0].players[1]]).emit("Board", {board: match[0].boards[match[0].players[0]],username:match[0].players[0],canPlay:true});
      }
      
    } 
    console.log("DIOCANE");
    
  });
  socket.on('login',function(data){
    users[data.username] = socket.id;
    let game = matches.filter(value => value.players.includes(data.username))[0];
    if(game){
      
      socket.join(game.id);
    }
    io.emit("updatePlayers",users);
  });
  
  socket.on("friendRequest",function(data){   
    io.to(users[data.friend]).emit("friendRequest", data);
  })
  socket.on("matchRequest",function(data){
    io.to(users[data.username]).emit("matchRequest", data);
    
  })
  socket.on("matchConfirm",function(data){
    io.to(users[data.friend]).emit("matchConfirm",data);
  });
  socket.on("friendConfirm",function(data){
    io.to(users[data.friend]).emit("friendConfirm",data);
  });

  socket.on("randomMatch",function(data){
    console.log("ENTRA IN MATCH!")
    let game = matches.filter(value => value.members==1)[0];
    console.log(game)
    if(game){
      game.players[game.i] = data.username;
      game.i++;
      game.members++;
      socket.join(game.id);
      io.to(game.id).emit("new_member", {members:game.members,gameId:game.id});
    }else{
      let game = new match();
      game.id=makeid(20);
      game.players[game.i] = data.username;
      game.i++;
      game.members++;
      matches.push(game);
      socket.join(game.id);
      console.log("ECCO COSA MANDO: "+game.id);
      io.to(game.id).emit("new_member", {members:game.members,gameId:game.id});
    }
  });
  socket.on("friendlyMatch",function(data){
    let game = matches.filter(value => value.players.includes(data.player1))[0];
    console.log(matches);
    console.log(game);
    if(!game){
      console.log("SONO ENTRATO QUA")
      let game = new match();
      game.id=makeid(20);
      game.players[game.i] = data.player1;
      game.i++;
      game.players[game.i] = data.player2;
      game.i++;
      game.members=2;
      socket.join(game.id);
      matches.push(game);
      io.to(users[data.player1]).to(users[data.player2]).emit("new_member", {members:game.members,gameId:game.id});
    }else{
      socket.join(game.id);
      io.to(users[data.player1]).to(users[data.player2]).emit("new_member", {members:game.members,gameId:game.id});
    }
    
    
  });
  socket.on('watchMatch',(data)=>{
    console.log(socket.rooms);
    if(data.gameId){
      console.log("ENTRA UN VISITATORE!");
      matches.filter(value => value.id==data.gameId)[0].visitor++;
      
      socket.join("visitors"+data.gameId);
      console.log(socket.rooms);
    }
  });
  socket.on('message', data => {
     // logger2.error({ message: 'message received', labels: { 'key': 'value' } })
    
    io.to(users[data.to]).emit("message",data);
    io.to("visitors"+data.gameId).emit("message",data);
    
  });

  socket.on('messageBroadcast',data =>{
    io.to("visitors"+data.gameId).emit("messageBroadcast",data);
  });
  socket.on('quitGame',async data=>{
    let match = matches.filter(value => value.id==data.gameId)[0];
    console.log("SONO DENTRO "+data.gameId);
    if(match){
      console.log("SONO DENTRO "+data.gameId);
      if(Object.keys(match.boards).length==2){
        (data.username==match.players[0])? match.boards[match.players[1]].player.score=BOARD_SIZE : match.boards[match.players[0]].player.score=BOARD_SIZE;
        const r = await new Match({
          player1: match.players[0],
          player2: match.players[1],
          score1: match.boards[match.players[0]].player.score,
          score2: match.boards[match.players[1]].player.score,
          winner: match.players[max(match.id)]
        }).save();
        User.updateOne({username:match.players[max(match.id)]},{$inc:{matches:1,wins:1}},function(err,res){
          console.log("Giocatore aggiornato!")
        });
        User.updateOne({username:match.players[min(match.id)]},{$inc:{matches:1,looses:1}},function(err,res){
          console.log("Giocatore aggiornato!")
        });
        io.to(data.username).emit("listeQuit");
        io.to("visitors"+match.id).emit("ListenGames", match)
        io.to(users[match.players[max(match.id)]]).emit("Move",{canPlay:true,boards:match.boards,gameId:match.id,opponent:data.username});
        
      }
      let i = matches.indexOf(match);
      matches.splice(i,1);
      console.log(matches);
    }
  })
  socket.on('disconnect', async () => {

      
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


function max(id){
  let match = matches.filter(value => value.id == id)[0];
  if(match.boards[match.players[0]].player.score>match.boards[match.players[1]].player.score){
    return 0;
  }else{
    return 1;
  }
}
function min(id){
  let match = matches.filter(value => value.id == id)[0];
  if(match.boards[match.players[0]].player.score>match.boards[match.players[1]].player.score){
    return 1;
  }else{
    return 0;
  }
}

