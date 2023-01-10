import {waitingPlayer} from "./waitingPlayer";
import express, {NextFunction, Request, Response} from "express";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import {CallbackError, connect, model, Schema} from "mongoose";

// @ts-ignore
import morganBody from "morgan-body";

import {match} from "./matches";
import {Foo} from "foo";
import {hashed, randomUUID} from "./common";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import * as config from "config";
// express import and initialization
import cors from "cors";
// HTTP server
import http from "http";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
// Crypto
import * as jwt from "jsonwebtoken";
import {join} from "path";
import * as fs from "fs";

const BOARD_SIZE = 32;

const appConfig = config.get("app");
const mongoConfig = config.get("mongo");
const secret = config.get("jwtSecret");

const port = appConfig.port;

const app = express()
    .use(cors())
    .use(express.json());

morganBody(app);

const server = http.createServer(app);

// Sockets
const io = require("socket.io")(server, {
    cors: {
        origin: "*",
        methods: ["*"]
    }
});

// Auto-load models
const models = join(__dirname, "models");
fs.readdirSync(models)
    .filter((file: string) => ~file.indexOf(".js"))
    .forEach((file: string) => require(join(models, file)));

// TODO list of online users should not be kept in memory, possibly store the user status in the data store
const users: Foo = {};

// Establish mongo connection
connect(mongoConfig.url)
    .then(() => console.log("connection with mongo established"))
    .catch(() => console.log("could not connect to mongo"));

const User = model("User");
const Match = model("Match");
const Message = model("Message");

type UserType = typeof User;
type MatchType = typeof Match;
type MessageType = typeof Message;

// Make sure the user `admin` exists at any times.
User.findOne({username: "admin"})
    .then(async (user: UserType) => {
        if (!user) {
            await new User({
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

const max = (id: string): number => {
    const match = matches.filter(value => value.id == id)[0];
    return match.boards[match.players[0]].player.score > match.boards[match.players[1]].player.score ? 0 : 1;
};

const min = (id: string): number => {
    const match = matches.filter(value => value.id == id)[0];
    return match.boards[match.players[0]].player.score > match.boards[match.players[1]].player.score ? 1 : 0;
};

const getKeyByValue = (object, value) => {
    return Object.keys(object).find(key => object[key] === value);
};

// Given a username, returns whether the user has unread messages
const hasNewMessages = (username: string): Promise<boolean> => {
    return Message.findOne({new: true, to: username})
        .then((message: MessageType) => {
            return message;
        });
};

// TODO for the entire project, add appropriate logging
app.post("/signin", (req: Request, res: Response) => {
    const {username, password} = req.body;

    User.findOne({username: username, password: hashed(password)})
        .then(async (user: UserType) => {
            if (user) {
                const token = jwt.sign({username: username, role: user.role}, secret);
                const hasMessages = await hasNewMessages(username);

                // TODO rename `newMessages` to `hasNewMessages`
                res.status(200).json({token, user, newMessages: hasMessages});
            } else {
                res.status(400).json({"error": "invalid credentials"});
            }
        }).catch((error: CallbackError) => res.status(500).json({error}));
});

const mustBeAdmin = (req: Request, res: Response, next: NextFunction) => {
    const {username} = req.body;
    User.findOne({username})
        .then((user: UserType) => {
            
            if (user.isModerator) {
                next();
            } else {
                res.status(401).json({error: "unauthorized"});
            }
        });
};

const mustAuth = (req: Request, res: Response, next: NextFunction) => {
    const header = req.headers.authorization;

    if (header) {
        const [_, token] = header.split(" ");
        jwt.verify(token, secret, (err, user) => {
            if (err) {
                res.sendStatus(403);
                return;
            }

            req.body.username = user.username;
            next();
        });
    } else {
        res.status(401).json({error: "unauthorized"});
    }
};

// Given a username, return it's UID
const getUserId = (username: string): Promise<Schema.Types.ObjectId> => {
    return User.findOne({username}).then((user: UserType) => user._id);
};

const isModerator = async (username: string): Promise<boolean> => {
    return User
        .findOne({username})
        .then((user: UserType) => user.isModerator);
};

// TODO support nested data structures, field notation should be "a.b.c"
const _with = <T extends Object>(obj: T | T[], fields: string[]): (Object | Object[]) => {
    if (Array.isArray(obj)) {
        const ret: any[] = [];
        obj.forEach(o => ret.push(_with(o, fields)));
        return ret;
    } else {
        const ret: any = {};
        fields.forEach(f => {
            ret[f] = obj[f];
        });
        return ret;
    }
};

// TODO write views for all models
const viewUser = (user: UserType) => _with(user, ["username", "matches", "wins", "looses", "isModerator"]);

// Return a list off all user of a given role
app.get("/users", mustAuth, async (req: Request, res: Response) => {
    const username = req.body.username;
    switch (req.query.role) {
    case "admin user":
    case "user admin":
        if (await isModerator(username)) {
            User.find({username: {$ne: username}})
                .then((users: UserType[]) => res.status(200).json({users: viewUser(users)}))
                .catch((error: CallbackError) => res.status(500).json({error}));
        } else {
            res.status(401).json({error: "unauthorized"});
        }
        break;
    case "admin":
        User.find({isModerator: true, username: {$ne: username}})
            .then((users: UserType[]) => res.status(200).json({users: viewUser(users)}))
            .catch((error: CallbackError) => res.status(500).json({error}));
        break;
    case "user":
        User.find({isModerator: false, username: {$ne: username}})
            .then((users: UserType[]) => res.status(200).json({users: viewUser(users)}))
            .catch((error: CallbackError) => res.status(500).json({error}));
        break;
    default:
        res.status(400).json({error: `role ${req.body.role} not supported`});
        break;
    }
});

app.get("/friend", mustAuth, (req: Request, res: Response) => {
    const {username} = req.body;

    User.findOne({username})
        .then((user: UserType) => {
            User.find({_id: {$in: user.friends}})
                .then((users: UserType[]) => res.status(200).json({users: viewUser(users)}))
                .catch((error: CallbackError) => res.status(500).json({error}));
        }).catch((error: CallbackError) => res.status(500).json({error}));
});

app.put("/friend/:friend", mustAuth, async (req: Request, res: Response) => {
    const {username} = req.body;
    const {friend} = req.params;
    getUserId(username).then((usernameId)=>{
        getUserId(friend).then((friendId)=>{
            User.updateOne({_id: usernameId}, {$push: {friends: friendId}}).then(()=>{
                User.updateOne({_id: friendId}, {$push: {friends: usernameId}}).then(()=>{
                    res.status(200).json({message: "ok"});
                }).catch((error: CallbackError) => res.status(500).json({error}));
            }).catch((error: CallbackError) => res.status(500).json({error}));
        }).catch((error: CallbackError) => res.status(500).json({error}));
    }).catch((error: CallbackError) => res.status(500).json({error}));
    
});

app.delete("/friend/:friend", mustAuth, async (req: Request, res: Response) => {
    const {username} = req.body;
    const {friend} = req.params;
    User.findOne({username: username})
        .then(async (user: UserType) => {
            const idFriend = user._id;
            User.findOne({username: friend})
                .then(async (friend: UserType) => {
                    if (friend) {
                        User.updateOne({username: username}, {$pull: {friends: friend._id}}).then(()=>{
                            User.updateOne({username: friend.username}, {$pull: {friends: idFriend}}).then(()=>{
                                res.status(200).json({message: "ok"});
                            }).catch((error: CallbackError) => res.status(500).json({error}));
    
                        }).catch((error: CallbackError) => res.status(500).json({error}));
                    } else {
                        res.status(500).json({message:"not found"});
                    }
                }).catch((error: CallbackError) => res.status(500).json({error}));
        }).catch((error: CallbackError) => res.status(500).json({error}));

    io.to(users[friend]).emit("friendRemoved", {friend: username});
});

app.post("/logout", mustAuth, (req: Request, res: Response) => {
    const {username} = req.body;

    console.log(`deleting user session for ${username}`);

    delete users[username];

    io.emit("updatePlayers", users);

    res.status(200).json({message: "ok"});
});

app.post("/matchId", mustAuth, (req: Request, res: Response) => {
    const {id} = req.body;

    if (matches.filter(value => value.id == id)[0]) {
        res.json({match: matches.filter(value => value.id == id)[0]});
    } else {
        res.status(400).json({message: "error"});
    }
});

app.post("/firstLogin", mustAuth, (req: Request, res: Response) => {
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
app.delete("/user/:username", mustAuth, mustBeAdmin, (req: Request, res: Response) => {
    const {username} = req.params;

    User.deleteOne({username: username}).then((data) => {
        Match.find({player1: username}).then((matches: MatchType[]) => {
            matches.forEach((m: MatchType) => {
                User.updateOne({username: m.player2}, {
                    $inc: {
                        matches: -1,
                        wins: m.winner == username ? 0 : -1,
                        looses: m.winner == username ? -1 : 0,
                    }
                }).catch((error: CallbackError) => res.status(500).json({error}));
            });
        }).catch((error: CallbackError) => res.status(500).json({error}));

        Match.find({player2: username}).then((matches: MatchType[]) => {
            matches.forEach((m: MatchType) => {
                User.updateOne({username: m.player1}, {
                    $inc: {
                        matches: -1,
                        wins: m.winner == username ? 0 : -1,
                        looses: m.winner.username ? -1 : 0,
                    }
                }).catch((error: CallbackError) => res.status(500).json({error}));
            });
        }).catch((error: CallbackError) => res.status(500).json({error}));

        Match.deleteMany({$or: [{player1: username}, {player2: username}]}).catch((error: CallbackError) => res.status(500).json({error}));

        User.find({isModerator: false})
            .then((users: UserType[]) => res.status(200).json({users}));
    }).catch((error: CallbackError) => res.status(500).json({error}));
});

app.put("/moderator", mustAuth, mustBeAdmin, async (req: Request, res: Response) => {
    const {username, password} = req.body;

    await new User({
        username,
        password: hashed(password),
        isModerator: true,
        isFirstLogin: true
    }).save().then(()=>{
        res.status(200).json({message: "ok"});
    }).catch((error: CallbackError) => res.status(500).json({error}));

    
});

// Return a lits of all current matches
app.get("/matches", mustAuth, (req: Request, res: Response) => {
    res.status(200).json({matches});
});
// Return a lits of all moderators
app.get("/moderators", mustAuth, (req: Request, res: Response) => {
    User.find({isModerator:true}).then((data)=>{
        res.status(200).json({data});
    }).catch((error: CallbackError) => res.status(500).json({error}));
    
});

// Return a list of all historical played matches by a player
app.post("/history", mustAuth, (req: Request, res: Response) => {
    const {username} = req.body;

    Match.find({$or: [{player1: username}, {player2: username}]})
        .then((matches: MatchType[]) => res.status(200).json({matches}))
        .catch((error: CallbackError) => res.status(500).json({error}));
});

app.post("/chat", mustAuth, async (req: Request, res: Response) => {
    const {username, friend, msg} = req.body;
    const time = new Date().toString();

    new Message({
        from: username,
        to: friend,
        message: msg,
        timestamp: time
    }).save().then(()=>{
        res.status(200).json({message: "ok"});
    }).catch((error: CallbackError) => res.status(500).json({error}));

    io.to(users[friend])
        .emit("privateMessage", {
            username: username,
            msg: msg,
            timestamp: time
        });

    
});
app.post("/chats", mustAuth, async (req: Request, res: Response) => {
    const {username, friend} = req.body;

    Message.find({
        $or: [{from: username, to: friend}, {
            from: friend,
            to: username
        }]
    }).then(async (messages: MessageType[]) => {
        await Message.updateMany({to: username}, {$set: {new: false}});
        res.status(200).json({messages});
    }).catch((error: CallbackError) => res.status(500).json({error}));
});

// Mark all unread messages as read
app.post("/readChat", mustAuth, async (req: Request, res: Response) => {
    const {username} = req.body;

    Message.updateMany({to: username}, {$set: {new: false}})
        .then(() => res.status(200).json({message: "ok"}))
        .catch((error: CallbackError) => res.status(500).json({error}));
});

const waitingPlayers: waitingPlayer[] = [];
const matches: match[] = [];

io.on("connection", (socket: any) => {
    socket.on("Move", async function (data) {
        const match = matches.filter(value => value.id == data.gameId)[0];

        match.boards = data.boards;
        match.whoPlay = data.opponent;

        if (match.boards[match.players[0]].player.score >= BOARD_SIZE || match.boards[match.players[1]].player.score >= BOARD_SIZE) {
            await new Match({
                player1: match.players[0],
                player2: match.players[1],
                score1: match.boards[match.players[0]].player.score,
                score2: match.boards[match.players[1]].player.score,
                winner: match.players[max(match.id)]
            }).save();

            await User.updateOne({username: match.players[max(match.id)]}, {$inc: {matches: 1, wins: 1}});
            await User.updateOne({username: match.players[min(match.id)]}, {$inc: {matches: 1, looses: 1}});
        }

        io.to(users[data.opponent]).emit("Move", data);
        io.to(`visitors-${data.gameId}`).emit("ListenGames", match);
    });

    socket.on("Board", function (data) {
        const match = matches.filter(value => value.id == data.gameId);

        match[0].boards[data.username] = data.board;

        if (Object.keys(match[0].boards).length == 2) {
            const randomElement = match[0].players[Math.floor(Math.random() * match[0].players.length)];

            if (randomElement == match[0].players[0]) {
                match[0].whoPlay = match[0].players[0];
                io.to(users[match[0].players[0]]).emit("Board", {
                    board: match[0].boards[match[0].players[1]],
                    username: match[0].players[1],
                    canPlay: true
                });
                io.to(users[match[0].players[1]]).emit("Board", {
                    board: match[0].boards[match[0].players[0]],
                    username: match[0].players[0],
                    canPlay: false
                });
            } else {
                match[0].whoPlay = match[0].players[1];
                io.to(users[match[0].players[0]]).emit("Board", {
                    board: match[0].boards[match[0].players[1]],
                    username: match[0].players[1],
                    canPlay: false
                });
                io.to(users[match[0].players[1]]).emit("Board", {
                    board: match[0].boards[match[0].players[0]],
                    username: match[0].players[0],
                    canPlay: true
                });
            }
        }
    });

    // TODO correctly update list of online users
    socket.on("login", (data) => {
        users[data.username] = socket.id;

        const game = matches.filter(value => value.players.includes(data.username))[0];

        if (game) {
            
            socket.join(game.id);
        }else{
            if(data.id){
                socket.join(`visitors-${data.gameId}`);
            }
        }

        io.emit("updatePlayers", users);
    });

    socket.on("friendRequest", function (data) {
        io.to(users[data.friend]).emit("friendRequest", data);
    });

    socket.on("matchRequest", function (data) {
        io.to(users[data.username]).emit("matchRequest", data);
    });

    socket.on("matchConfirm", function (data) {
        io.to(users[data.friend]).emit("matchConfirm", data);
    });

    socket.on("friendConfirm", function (data) {
        io.to(users[data.friend]).emit("friendConfirm", data);
    });

    // TODO refactor this mess
    socket.on("randomMatch", function (data) {
        setTimeout(() => {
            const game = matches.filter(value => value.members == 1)[0];
            const username = waitingPlayers.pop()?.name;
            if (username) {
                if (game) {
                    console.log("FORMAZIONE PARTITA!")
                    game.players[game.i] = username || "";
                    game.i++;
                    game.members++;
                    io.in(users[username + ""]).socketsJoin(game.id);
                    io.to(game.id).emit("new_member", {members: game.members, gameId: game.id});
                } else {
                    
                    console.log("Entra in partita "+username)
                    const game = new match();
                    game.id =randomUUID() ;
                    game.players[game.i] = username || "";
                    game.i++;
                    game.members++;
                    matches.push(game);
                    io.in(users[username + ""]).socketsJoin(game.id);
                    io.to(game.id).emit("new_member", {members: game.members, gameId: game.id});
                }
            }
        }, 30000);

        User.findOne({username: data.username})
            .then((user: UserType) => {
                waitingPlayers.push(new waitingPlayer({name: data.username, ratio: user.wins / user.matches}));
                waitingPlayers.sort((a, b) => a.ratio - b.ratio);
            });
    });

    // TODO more refactoring, match should have a bunch of methods to deal with this recurring pattern
    socket.on("friendlyMatch", (data) => {
        const game = matches.filter(value => value.players.includes(data.player1))[0];
        if (!game) {
            const game = new match();
            game.id = randomUUID();
            game.players[game.i] = data.player1;
            game.i++;
            game.players[game.i] = data.player2;
            game.i++;
            game.members = 2;
            socket.join(game.id);
            matches.push(game);
            io.to(users[data.player1])
              .to(users[data.player2])
              .emit("new_member", {members: game.members, gameId: game.id});
        } else {
            socket.join(game.id);
            io.to(users[data.player1])
              .to(users[data.player2])
              .emit("new_member", {members: game.members, gameId: game.id});
        }
    });

    socket.on("watchMatch", (data) => {
        if (data.gameId) {
            matches.filter(value => value.id == data.gameId)[0].visitor++;
            socket.join(`visitors-${data.gameId}`);
        }
    });

    socket.on("quitVisitor", (data) => {
        if (data.gameId) {
            matches.filter(value => value.id == data.gameId)[0].visitor--;
            socket.leave(`visitors-${data.gameId}`);
        }
    });

    socket.on("message", (data) => {
        io.to(users[data.to]).emit("message", data);
        io.to(`visitors-${data.gameId}`).emit("message", data);
    });

    socket.on("messageBroadcast", (data) => {
        io.to(`visitors-${data.gameId}`).emit("messageBroadcast", data);
    });

    socket.on("quitGame", async data => {
        const match = matches.filter(value => value.id == data.gameId)[0];
        if (match) {
            if (Object.keys(match.boards).length == 2) {
                (data.username == match.players[0])
                  ? match.boards[match.players[1]].player.score = BOARD_SIZE
                  : match.boards[match.players[0]].player.score = BOARD_SIZE;

                await new Match({
                    player1: match.players[0],
                    player2: match.players[1],
                    score1: match.boards[match.players[0]].player.score,
                    score2: match.boards[match.players[1]].player.score,
                    winner: match.players[max(match.id)]
                }).save();

                await User.updateOne({username: match.players[max(match.id)]}, {$inc: {matches: 1, wins: 1}});
                await User.updateOne({username: match.players[min(match.id)]}, {$inc: {matches: 1, looses: 1}});

                io.to("visitors" + match.id).emit("ListenGames", match);
                io.to(users[match.players[max(match.id)]]).emit("Move", {
                    canPlay: true,
                    boards: match.boards,
                    gameId: match.id,
                    opponent: data.username
                });
            } else {
                io.to(users[matches.filter(value => value.id = data.gameId)[0].players.filter(value => value != data.username)[0]]).emit("listenOpponentQuit");
            }

            const i = matches.indexOf(match);
            matches.splice(i, 1);
        } else {
            const player = waitingPlayers.filter(value => value.name == data.username)[0];
            if (player) {
                const i = waitingPlayers.indexOf(player);
                waitingPlayers.splice(i, 1);
            }
        }
    });

    socket.on("disconnect", async () => {
        const username = getKeyByValue(users, socket.id) || "";
        delete users[username];

        setTimeout(async () => {
            if (!users[username]) {
                const player = waitingPlayers.find(value => value.name == username);
                if (player) {
                    const i = waitingPlayers.indexOf(player);
                    waitingPlayers.splice(i, 1);
                } else {
                    const match = matches.find(value => value.players.includes(username));
                    if (match) {
                        if (Object.keys(match.boards).length == 2) {
                            (username == match.players[0])
                                ? match.boards[match.players[1]].player.score = BOARD_SIZE
                                : match.boards[match.players[0]].player.score = BOARD_SIZE;

                            await new Match({
                                player1: match.players[0],
                                player2: match.players[1],
                                score1: match.boards[match.players[0]].player.score,
                                score2: match.boards[match.players[1]].player.score,
                                winner: match.players[max(match.id)]
                            }).save();

                            await User.updateOne({username: match.players[max(match.id)]}, {
                                $inc: {
                                    matches: 1,
                                    wins: 1
                                }
                            });

                            await User.updateOne({username: match.players[min(match.id)]}, {
                                $inc: {
                                    matches: 1,
                                    looses: 1
                                }
                            });

                            io.to("visitors" + match.id).emit("ListenGames", match);
                            io.to(users[match.players[max(match.id)]]).emit("Move", {
                                canPlay: true,
                                boards: match.boards,
                                gameId: match.id,
                                opponent: username
                            });

                        } else {
                            io.to(users[match.players.find(value => value != username) || ""]).emit("listenOpponentQuit");
                        }

                        const i = matches.indexOf(match);
                        matches.splice(i, 1);
                    }
                }
            }
        }, 3000);
    });
});

server.listen(port, () => {
    console.log(`listening on ${port}`);
});
