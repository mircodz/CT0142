import {waitingPlayer} from "./waitingPlayer";
import {NextFunction, Request, Response} from "express";
import {JwtPayload, VerifyErrors} from "jsonwebtoken";
import {CallbackError, Schema, connect, model} from "mongoose";

import * as crypto from "crypto";

import {match} from "./matches";

const BOARD_SIZE: number = 32;
const config = require('config');
const appConfig = config.get('app');
const mongoConfig = config.get('mongo');
const jwtSecret = config.get('jwtSecret');

const port = appConfig.port;

// express import and initialization
const cors = require('cors');
const express = require('express');

const app = express()
  .use(cors())
  .use(express.json());

// HTTP server
const http = require('http');
const server = http.createServer(app);
const {Server} = require("socket.io");

// Sockets
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["*"]
  }
});

// Crypto
const crypto2 = require('crypto');
const jwt = require('jsonwebtoken');

const secret = jwtSecret;

// Auto-load modules
const fs = require('fs');
const join = require('path').join;
const models = join(__dirname, 'models');
fs.readdirSync(models)
  .filter((file: string) => ~file.indexOf('.js'))
  .forEach((file: string) => require(join(models, file)));

interface Foo {
  [key: string]: string;
}

let users: Foo = {};

// Establish mongo connection
connect(mongoConfig.url)
  .then(() => console.log("connection with mongo established"))
  .catch(() => console.log("could not connect to mongo"));

const User = model('User');
const Match = model("Match");
const Message = model("Message");

type UserT = typeof User;
type MatchT = typeof Match;
type MessageT = typeof Message;

// Make sure the user `admin` exists at any times.
User.findOne({username: "admin"})
    .then((user: UserT) => {
        if (!user) {
            new User({
                username: "admin",
                password: hashed("admin"),
                isFirstLogin: true,
                isModerator: true,
            }).save();
        } else {
            throw "admin already exists";
        }
    }).then(() => console.log("insert default user admin:admin"))
    .catch(console.log);

app.post("/signup", async (req: Request, res: Response) => {
    const {name, username, email, password} = req.body;
    const user = await User.exists({username});

    if (!user) {
        await new User({
            name,
            username,
            email,
            password: hashed(password),
        }).save();

        console.log("user has successfully signed up");
        res.status(200).json({message: "ok"});
    } else {
        console.log("error signing up user");
        res.status(400).json({message: "user exists"});
    }
});

const hashed = (s: String): String => {
  return crypto2
    .createHash("sha256")
    .update(s)
    .digest("hex");
};

// Given a username, returns whether the user has unread messages
const hasNewMessages = (username: string): Promise<Boolean> => {
  return Message
    .findOne({new: true, to: username})
    .then((message: typeof Message) => {
      return message;
    })
};

app.post('/signin', (req: Request, res: Response) => {
  const {username, password} = req.body;
  const hashed = hashed(password);

  User.findOne({username: username, password: hashed})
    .then(async (user: typeof User) => {
      if (user) {
        const token = jwt.sign({username: username, role: user.role}, secret);
        const hasMessages = await hasNewMessages(username);
        res.status(200).json({token, user, newMessages: hasMessages});
      } else {
        res.status(400).json({"error": "invalid credentials"});
      }
    }).catch((error: CallbackError) => res.status(500).json({error}));
});

const mustAuth = (req: Request, res: Response, next: NextFunction) => {
  const header = req.headers.authorization;

  if (header) {
    const [_, token] = header.split(' ');
    jwt.verify(token, secret, (err: VerifyErrors, user: JwtPayload) => {
      if (err) {
        return res.sendStatus(403);
      }

      req.body.username = user;
      next();
    });
  } else {
    res.sendStatus(401);
  }
};

app.get('/foo', (req: Request, res: Response) => {
  res.send('Hello World!');
});

app.get('/', mustAuth, (req: Request, res: Response) => {
  res.send('Hello World!');
});

// Given a username, return it's UID
const getUserId = (username: string): Promise<Schema.Types.ObjectId> => {
  return User.findOne({username}).then((user: typeof User) => user._id);
}

// TODO error handling
// TODO better control flow
app.post('/addFriends', mustAuth, async (req: Request, res: Response) => {
  const {username, friend} = req.body;

  const usernameId = await getUserId(username);
  const friendId = await getUserId(friend);

  User.updateOne({_id: usernameId}, {$push: {friends: friendId}});
  User.updateOne({_id: friendId}, {$push: {friends: usernameId}});

  res.status(200).json({message: "ok"});
});

app.get('/allUsers', mustAuth, (req: Request, res: Response) => {
  console.log("STAMPA DI TUTTI GLI UTENTI: " + users);
  res.status(200).json({users});
});

const isModerator = async (username: String): Promise<Boolean> => {
  return User.findOne({username}, function (err: CallbackError, user: typeof User) {
    return !err ? user.isModerator : false;
  });
};

app.post('/getAllUsers', mustAuth, async (req: Request, res: Response) => {
  const {moderator} = req.body;
  if (await isModerator(moderator)) {
    User.find({isModerator: false}, function (err: CallbackError, users: typeof User[]) {
      if (err) {
        res.status(500).json({err});
      } else {
        res.status(200).json({users});
      }
    });
  } else {
    res.status(401).json({message: "unauthorized"});
  }
});

app.get('/getModerators', mustAuth, (req: Request, res: Response) => {

  User.find({isModerator: true}, function (err, sub) {
    if (sub) {
      res.status(200).json({sub});
    } else {
      res.status(400).json({message: "We don't have any moderator!"});
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
app.post('/deleteFriend', mustAuth, (req: Request, res: Response) => {
  const {username, friend} = req.body;
  User.findOne({username: username}, function (err, sub) {
    console.log(sub);
    let friends = sub.friends;
    let idFriend = sub._id;
    User.findOne({username: friend}, function (err, sub) {
      console.log(sub);
      let i=0;
      if(sub){
        User.updateOne({username:username},{$pull:{friends:sub._id}},function(err,res){
          console.log("Utente aggiornato");
          
        })
        User.updateOne({username:friend},{$pull:{friends:idFriend}},function(err,res){
          console.log("Utente aggiornato");
        })
    res.status(200).json({message:"ok"});
     }else{
        res.status(400).json({message:"error"});
      }

    })
  })
 
  io.to(users[friend]).emit("friendRemoved",{friend:username});
  
});

app.post('/logout', mustAuth, (req: Request, res: Response) => {
  const {username} = req.body;

  console.log(`deleting user session for ${username}`)

  delete users[username];
  io.emit("updatePlayers",users);
  
  res.status(200).json({message: "ok"});
  
});

app.post('/matchId', mustAuth, (req: Request, res: Response) => {
  const {id} = req.body;
  res.json({match: matches.filter(value => value.id == id)[0]});
});

app.post('/firstLogin', mustAuth, (req: Request, res: Response) => {
  const {username, password, name, email} = req.body;
  User.updateOne({username: username}, {
    $set: {
      name: name,
      email: email,
      password: hashed(password),
      isFirstLogin: false
    }
  }).then(() => res.status(200).json({message: "ok"}))
    .catch((error: CallbackError) => res.status(500).json({error}));
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

app.post('/addModeator', mustAuth, async (req: Request, res: Response) => {
  const {moderator, username, password} = req.body;

  if (await isModerator(moderator)) {
    await new User({
      username,
      password: hashed(password),
      isModerator: true,
      isFirstLogin: true
    }).save();

    res.status(200).json({message: "ok"});
  } else {
    res.status(401).json({message: "not authorized"});
  }
});

app.get('/matches', mustAuth, (req: Request, res: Response) => {
  res.status(200).json({matches});
});

app.post('/matches', mustAuth, (req: Request, res: Response) => {
  const {username} = req.body;

  Match.find({$or: [{player1: username}, {player2: username}]})
    .then((matches: typeof Match[]) => res.status(200).json({matches}))
    .catch((error: CallbackError) => res.status(500).json({error}))
});

app.post('/chat', mustAuth, async (req: Request, res: Response) => {
  const {username, friend, msg} = req.body;
  const time = new Date().toString();

  await new Message({
    from: username,
    to: friend,
    message: msg,
    timestamp: time
  }).save();
  res.status(200).json({message:"ok"});
  io.to(users[friend]).emit("privateMessage",{username:username,msg:msg,timestamp:time});
        
      });
app.post('/getChat', authenticateJWT, async (req, res) => {
  const {username,friend} = req.body;
  Message.find({$or :[{from:username,to:friend},{from:friend,to:username}]},async function(err,sub){

    console.log(sub);
    if(sub){
      await Message.updateMany({to:username},{$set:{new:false}});
      res.status(200).json({sub});
    }else{
      res.status(400).json({message:"chat empty!"});
    }
  })

  res.status(200).json({message: "ok"});
});

// TODO better control flow
app.post('/getChat', mustAuth, async (req: Request, res: Response) => {
  const {username, friend} = req.body;

  Message.find({
    $or: [{from: username, to: friend}, {
      from: friend,
      to: username
    }]
  }).then(async (messages: typeof Message[]) => {
    await Message.updateMany({to: username}, {$set: {new: false}});
    res.status(200).json({messages});
  }).catch((error: CallbackError) => res.status(500).json({error}));
});

// Mark all unread messages as read
// TODO User level "message read" policies similar to WhatsApp
// TODO Remove this endpoint and keep "message read" logic only in `/getChat`
app.post('/readChat', mustAuth, async (req: Request, res: Response) => {
  const {username} = req.body;

  Message.updateMany({to: username}, {$set: {new: false}})
    .then(() => res.status(200).json({message: "ok"}))
    .catch((error: CallbackError) => res.status(500).json({error}))
});

let waitingPlayers: waitingPlayer[] = [];
let matches: match[] = [];

io.on('connection', (socket: any) => {
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
    users[data.username]= socket.id;
    let game = matches.filter(value => value.players.includes(data.username))[0];
    if(game){
      
      socket.join(game.id);
    }
    io.emit("updatePlayers",users);
  });
  
  socket.on("friendRequest",function(data){   
    console.log(data.username+" a "+data.friend);
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
    setTimeout(()=>{
      let game = matches.filter(value => value.members==1)[0];
      console.log(game);
      let username=waitingPlayers.pop()?.name;
      if(username){
        if(game){
          console.log("MI COLLEGO");
          game.players[game.i] = username || "";
          game.i++;
          game.members++;
          io.in(users[username+""]).socketsJoin(game.id);
          console.log("I players sono:")
          console.log(game.players);
          io.to(game.id).emit("new_member", {members:game.members,gameId:game.id});
        }else{
          console.log("CREO");
          let game = new match();
          game.id=makeid(20);
          game.players[game.i] = username || "";
          game.i++;
          game.members++;
          matches.push(game);
          io.in(users[username+""]).socketsJoin(game.id);
          console.log("ECCO COSA MANDO: "+game.id);
          io.to(game.id).emit("new_member", {members:game.members,gameId:game.id});
        }
      }
    }, 30000);

    User.findOne({username: data.username})
      .then((user: typeof User) => {
        waitingPlayers.push(new waitingPlayer({name: data.username, ratio: user.wins / user.matches}));
        waitingPlayers.sort((a, b) => a.ratio - b.ratio);
      });

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
  socket.on("quitVisitor",(data)=>{
    if(data.gameId){
      console.log("ESCE UN VISITATORE!");
      matches.filter(value => value.id==data.gameId)[0].visitor--;
      
      socket.leave("visitors"+data.gameId);
      console.log(socket.rooms);
    }
  });

  socket.on('message', (data) => {
    io.to(users[data.to])
      .emit("message", data);

    io.to("visitors" + data.gameId)
      .emit("message", data);
  });

  socket.on('messageBroadcast', (data: any) => {
    io.to("visitors" + data.gameId).emit("messageBroadcast", data);
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
        io.to("visitors"+match.id).emit("ListenGames", match)
        io.to(users[match.players[max(match.id)]]).emit("Move",{canPlay:true,boards:match.boards,gameId:match.id,opponent:data.username});
        
      }else{
        console.log("STO QUITTANDO")
        io.to(users[matches.filter(value => value.id=data.gameId)[0].players.filter(value => value != data.username)[0]]).emit("listenOpponentQuit");
      }
      let i = matches.indexOf(match);
      matches.splice(i,1);
      console.log(matches);
    }else{
      let player=waitingPlayers.filter(value => value.name==data.username)[0];
      if(player){
        let i = waitingPlayers.indexOf(player);
        waitingPlayers.splice(i,1);
      }
    }
  })
  socket.on('disconnect', async () => {
    let username= getKeyByValue(users,socket.id) || "";
    delete users[username];
    setTimeout(async () => {
      if(!users[username]){
        let player=waitingPlayers.find(value => value.name==username);
        if(player){
          let i = waitingPlayers.indexOf(player);
          waitingPlayers.splice(i,1);
        }else{
          let match = matches.find(value => value.players.includes(username));
          if(match){
            if(Object.keys(match.boards).length==2){
              (username==match.players[0])? match.boards[match.players[1]].player.score=BOARD_SIZE : match.boards[match.players[0]].player.score=BOARD_SIZE;
              const r = await new Match({
                player1: match.players[0],
                player2: match.players[1],
                score1: match.boards[match.players[0]].player.score,
                score2: match.boards[match.players[1]].player.score,
                winner: match.players[max(match.id)]
              }).save();
              User.updateOne({username: match.players[max(match.id)]}, {
                $inc: {
                  matches: 1,
                  wins: 1
                }
              }, function (err, res) {
                console.log("Giocatore aggiornato!")
              });
              User.updateOne({username: match.players[min(match.id)]}, {
                $inc: {
                  matches: 1,
                  looses: 1
                }
              }, function (err, res) {
                console.log("Giocatore aggiornato!")
              });
              io.to("visitors" + match.id).emit("ListenGames", match)
              io.to(users[match.players[max(match.id)]]).emit("Move", {
                canPlay: true,
                boards: match.boards,
                gameId: match.id,
                opponent: username
              });

            } else {
              console.log("STO QUITTANDO")
              io.to(users[match.players.find(value => value != username) || ""]).emit("listenOpponentQuit");
            }
            let i = matches.indexOf(match);
            matches.splice(i, 1);
            console.log(matches);
          }
        }
      }
    }, 3000);
    console.log("Ti sei disconesso");

  })
});

server.listen(port, () => {
  console.log(`listening on ${port}`);
});

function max(id: String): number {
  let match = matches.filter(value => value.id == id)[0];
  return match.boards[match.players[0]].player.score > match.boards[match.players[1]].player.score ? 0 : 1;
}

function min(id: String): number {
  let match = matches.filter(value => value.id == id)[0];
  return match.boards[match.players[0]].player.score > match.boards[match.players[1]].player.score ? 1 : 0;
}

function getKeyByValue(object, value) {
  return Object.keys(object).find(key => object[key] === value);
}