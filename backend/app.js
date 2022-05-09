"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
exports.__esModule = true;
require('./tracing');
var config = require('config');
var appConfig = config.get('app');
var mongoConfig = config.get('mongo');
var jwtSecret = config.get('jwtSecret');
var port = appConfig.port;
// Express imports
var express = require('express');
var cors = require('cors');
// Express Initialization
var app = express();
app.use(cors());
app.use(express.json());
// HTTP server
var http = require('http');
var server = http.createServer(app);
var Server = require("socket.io").Server;
// Sockets
var io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["*"]
    }
});
// Crypto
var crypto = require('crypto');
var jwt = require('jsonwebtoken');
var secret = jwtSecret;
// Auto-load modules
var fs = require('fs');
var join = require('path').join;
var models = join(__dirname, 'models');
fs.readdirSync(models)
    .filter(function (file) { return ~file.indexOf('.js'); })
    .forEach(function (file) { return require(join(models, file)); });
// Mongo
var mongoose = require('mongoose');
try {
    mongoose.connect(mongoConfig.url);
}
catch (error) {
    console.log('no mongo connection');
}
var User = mongoose.model('User');
app.post('/signup', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, name, username, email, password, user, hashed, r;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _a = req.body, name = _a.name, username = _a.username, email = _a.email, password = _a.password;
                return [4 /*yield*/, User.exists({ username: username })];
            case 1:
                user = _b.sent();
                if (!!user) return [3 /*break*/, 3];
                hashed = crypto
                    .createHash("sha256")
                    .update(password)
                    .digest("hex");
                return [4 /*yield*/, new User({
                        name: name,
                        username: username,
                        email: email,
                        password: hashed
                    }).save()];
            case 2:
                r = _b.sent();
                res.status(200).json({ message: "ok" });
                return [3 /*break*/, 4];
            case 3:
                res.status(400).json({ message: "user exists" });
                _b.label = 4;
            case 4: return [2 /*return*/];
        }
    });
}); });
app.post('/signin', function (req, res) {
    var _a = req.body, username = _a.username, password = _a.password;
    var hashed = crypto
        .createHash("sha256")
        .update(password)
        .digest("hex");
    var user = User.find({ username: username, password: hashed });
    if (user) {
        var token = jwt.sign({ username: user.username, role: user.role }, secret);
        res.json({ token: token });
    }
    else {
        res.sendStatus(400);
    }
});
var authenticateJWT = function (req, res, next) {
    var header = req.headers.authorization;
    if (header) {
        var _a = header.split(' '), preamble = _a[0], token = _a[1];
        jwt.verify(token, secret, function (err, user) {
            if (err) {
                return res.sendStatus(403);
            }
            req.user = user;
            next();
        });
    }
    else {
        res.sendStatus(401);
    }
};
app.get('/foo', function (req, res) {
    res.send('Hello World!');
});
app.get('/', authenticateJWT, function (req, res) {
    res.send('Hello World!');
});
var logger = require('./logger').logger;
io.on('connection', function (socket) {
    logger.error({ message: 'user connected', labels: { 'key': 'value' } });
    socket.on('message', function (arg) {
        logger.error({ message: 'message received', labels: { 'key': 'value' } });
        console.log(arg);
    });
    socket.on('disconnect', function () {
        logger.error({ message: 'user disconnected', labels: { 'key': 'value' } });
    });
});
server.listen(port, function () {
    console.log("Example app listening on ".concat(port, "!"));
});
app.get('/chat', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var ChatClient, c;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                ChatClient = require('./chat').ChatClient;
                c = new ChatClient(1);
                c.put('Hello, World!', 3);
                return [4 /*yield*/, c.get(3)
                        .then(function (response) { return response.hits.hits.map(function (i) { return i._source.text; }); })
                        .then(function (items) { return res.json(items); })];
            case 1:
                _a.sent();
                return [2 /*return*/];
        }
    });
}); });
