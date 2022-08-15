import { Injectable } from '@angular/core';

import { Socket } from 'ngx-socket-io';

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  constructor(private socket: Socket) { }

  sendMessage(msg: string,from:string,to:string,gameId:any) {
    this.socket.emit('message', {message: msg,from:from,to:to,gameId:gameId});
  }
  listenMessage(){
    return this.socket.fromEvent("message");
  }
  listenMessageBroadcast(){
    return this.socket.fromEvent("messageBroadcast");
  }
  sendMessagetoBroadcast(msg: string,from:string,id_game:any) {
    this.socket.emit('messageBroadcast', {message: msg,from:from,gameId:id_game});
  }
}
