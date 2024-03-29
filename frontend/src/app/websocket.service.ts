import {Injectable} from "@angular/core";
import {Socket} from "ngx-socket-io";

import {Board} from "./battleship-game/board";
import {Move} from "./battleship-game/move";


@Injectable({
    providedIn: "root"
})

export class WebsocketService {
    members = 0;

    constructor(private socket: Socket) {
    }

    connection(data: any) {
        this.socket.emit("randomMatch", data);
    }

    watchMatch(data: any) {
        this.socket.emit("watchMatch", data);
    }

    emitMoves(move: Move) {
        this.socket.emit("Move", move);
    }

    login(user: any) {
        this.socket.emit("login", user);
    }

    listenMoves() {
        return this.socket.fromEvent("Move");
    }

    listenMembers() {
        return this.socket.fromEvent("new_member");
    }

    friendlyMatch(data: any) {
        this.socket.emit("friendlyMatch", data);
    }

    sendBoard(data: any) {
        this.socket.emit("Board", data);
    }

    getBoard() {
        return this.socket.fromEvent("Board");
    }

    getBoards() {
        return this.socket.fromEvent("ListenGames");
    }

    joinMember() {
        this.socket.emit("new_member");
    }

    disconnect(data: any) {
        this.socket.emit("quitGame", data);
    }

    disconnectVisitor(data: any) {
        this.socket.emit("quitVisitor", data);
    }

    listenQuit() {
        return this.socket.fromEvent("listenOpponentQuit");
    }

    sendFriendRequest(data: any) {
        this.socket.emit("friendRequest", data);
    }

    listenFriendRequest() {
        return this.socket.fromEvent("friendRequest");
    }

    sendMatchRequest(data: any) {
        this.socket.emit("matchRequest", data);
    }

    listenMatchRequest() {
        return this.socket.fromEvent("matchRequest");
    }

    matchConfirm() {
        return this.socket.fromEvent("matchConfirm");
    }

    friendConfirm() {
        return this.socket.fromEvent("friendConfirm");
    }

    sendConfirmMatch(data: any) {
        this.socket.emit("matchConfirm", data);
    }

    sendConfirmFriend(data: any) {
        this.socket.emit("friendConfirm", data);
    }

    sendReady(data: any) {
        this.socket.emit("ready", data);
    }

    listenUpdateUsers() {
        return this.socket.fromEvent("updatePlayers");
    }

    listenUpdateFriends() {
        return this.socket.fromEvent("updateFriends");
    }

    listenFriendRemoved() {
        return this.socket.fromEvent("friendRemoved");
    }

}
