import { Injectable } from '@angular/core';
import { Socket } from 'ngx-socket-io';
import { ignoreElements, map } from 'rxjs';


import { Board } from './board';
import { Move } from './move';



@Injectable({
  providedIn: 'root'
})

export class WebsocketService {
  members: number = 0;
  constructor(private socket:Socket) {
    
   }
  
  emitMoves(move:Move){
    this.socket.emit('Move', move);
  }

  listenMoves(){
    return this.socket.fromEvent("Move");
  }
  listenMembers(){
    return this.socket.fromEvent("new_member");
  }
  sendBoard(board:Board){
    this.socket.emit('Board', board);
  }
  getBoard(){
    return this.socket.fromEvent("Board");
  }
  joinMember(){
    this.socket.emit("new_member");
  }
  disconnect(){
    this.socket.emit("disconnect");
  }
}
