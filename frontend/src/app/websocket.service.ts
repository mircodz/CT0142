import { Injectable } from '@angular/core';
import { Socket } from 'ngx-socket-io';
import { ignoreElements, map } from 'rxjs';
import { AppComponent } from './app.component';


import { Board } from './battleship-game/board';
import { Move } from './battleship-game/move';



@Injectable({
  providedIn: 'root'
})

export class WebsocketService {
  members: number = 0;
  constructor(private socket:Socket) {
    
   }

  connection(data:any){
    this.socket.emit("inGame",data);
  }
  
  emitMoves(move:Move){
    this.socket.emit('Move', move);
  }
  login(user:any){
    this.socket.emit("login",user);
  }
  listenMoves(){
    return this.socket.fromEvent("Move");
  }
  listenMembers(){
    return this.socket.fromEvent("new_member");
  }
  sendBoard(data:any){
    this.socket.emit('Board', data);
  }
  getBoard(){
    return this.socket.fromEvent("Board");
  }
  getBoards(){
    return this.socket.fromEvent("ListenGames");
  }
  joinMember(){
    this.socket.emit("new_member");
  }
  disconnect(data:any){
    this.socket.emit("quitGame",data);
  }
  listeQuit(){
    return this.socket.fromEvent("quitGame");
  }
  sendFriendRequest(data:any){
    this.socket.emit("friendRequest",data);
  }
  listenFriendRequest(){
    return this.socket.fromEvent("friendRequest");
  }
  sendMatchRequest(data:any){
    this.socket.emit("matchRequest",data);
  }
  listenMatchRequest(){
    return this.socket.fromEvent("matchRequest");
  }
  matchConfirm(){
    return this.socket.fromEvent("matchConfirm");
  }
  sendConfirm(data:any){
    this.socket.emit("matchConfirm",data);
  }
  sendReady(data:any){
    this.socket.emit("ready",data);
  }
  
}
