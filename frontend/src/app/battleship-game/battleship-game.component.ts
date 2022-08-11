import { Component, OnInit, ElementRef, HostListener, OnDestroy } from '@angular/core';

import { ToastrService } from 'ngx-toastr';

import { Board } from './board';
import { BoardService } from './board.service';
;
import { Move } from './move';

import { WebsocketService } from '../websocket.service';
import { AppComponent } from '../app.component';
import { Foo } from './foo';
import { AppService } from '../app.service';
import { Subscription } from 'rxjs';
import { HomeComponent } from '../home/home.component';
import { ChatService } from '../chat.service';
import { faPaperPlane } from '@fortawesome/free-solid-svg-icons';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { json } from 'express';
import { JsonPipe } from '@angular/common';
import { SubscriptionsService } from './subscriptions.service';
import { LoginComponent } from '../login/login.component';
import { Router } from '@angular/router';


// set game constants
const NUM_PLAYERS: number = 2;
const BOARD_SIZE: number = 10;
const SCORE_LIMIT: number = 32;

@Component({
  selector: 'app-battleship-game',
  templateUrl: './battleship-game.component.html',
  styleUrls: ['./battleship-game.component.css']
})



export class BattleshipGameComponent implements OnInit,OnDestroy {
  msgForm = new FormGroup({
    msg: new FormControl('', Validators.required),
  });
  canPlay: boolean = (sessionStorage.getItem("canPlay")!=null) ? LoginComponent.getBoolean(sessionStorage.getItem("canPlay")) : true;
  connected:boolean=(sessionStorage.getItem("connected")!=null) ? LoginComponent.getBoolean(sessionStorage.getItem("connected")) : false;
  player: any = HomeComponent.username;
  opponent:any =(sessionStorage.getItem("opponent")) ? sessionStorage.getItem("opponent") : "";
  players: number =(sessionStorage.getItem("players"))? Number.parseInt(sessionStorage.getItem("players")+""):  0;
  gameUrl: string = location.protocol + '//' + location.hostname + (location.port ? ':' + location.port: '');
  messages:any[]=[];
  faPaper = faPaperPlane;
  constructor(private socket: WebsocketService,private boardService: BoardService,private toastr: ToastrService,private appService:AppService,private chatService:ChatService,private route:Router){
    if(!this.connected){
      this.createBoards(HomeComponent.username);
    }
  }
  get BattleshipGameComponent(){
    return BattleshipGameComponent;
  }
  initConnection(): BattleshipGameComponent {
    console.log("Stampa la sessione del gioco : ");
    console.log(JSON.parse(sessionStorage.getItem("boards")+""));
    this.socket.joinMember();
    this.socket.sendBoard({board:this.boards[HomeComponent.username],username:HomeComponent.username});
  
    SubscriptionsService.subscriptions.push(
      this.socket.listenMembers().subscribe((data:any)=>{
        
        if(data.members<this.players){
          this.boards[this.player].player.score=SCORE_LIMIT;
        }else{
          this.players=data.members;
          sessionStorage.setItem("players",this.players+"");
        }
        HomeComponent.gameId=data.gameId;
        sessionStorage.setItem("gameId",data.gameId+"");
        
      })
    );
    SubscriptionsService.subscriptions.push(
      this.socket.getBoard().subscribe((data:any)=>{
        console.log("Ricevuta la board di "+data.username+" "+data.board)
        this.boards[data.username]=data.board;
        sessionStorage.setItem("boards",JSON.stringify(this.boards));
        this.opponent=data.username;
        sessionStorage.setItem("opponent",data.username);
        this.canPlay = data.canPlay;
        sessionStorage.setItem("canPlay",data.canPlay);
      })
    );
    SubscriptionsService.subscriptions.push(
      this.chatService.listenMessage().subscribe((data:any)=>{
        this.messages.push(data);
      })
    );
  
    SubscriptionsService.subscriptions.push(
      this.socket.listeQuit().subscribe((data:any)=>{
  
        this.ngOnDestroy();
      })
    );
    
    
    
    return this;
  }
  get HomeComponent(){
    return HomeComponent;
  }

  get validPlayer(): boolean {
    return (this.players >= NUM_PLAYERS);
  }
  fireTorpedo(e:any) : BattleshipGameComponent | undefined {
    
    let id = e.target.id.split(";"),
      boardId = id[0];
      let row = Number.parseInt(id[1]), col = Number.parseInt(id[2]),
      tile = this.boards[boardId].tiles[row][col];
    
    if (!this.checkValidHit(boardId, tile)) {
      return;
    }

    if (tile.value == "X") {
      this.toastr.success("You got this.", "HURRAAA! YOU SANK A SHIP!");
      this.boards[boardId].tiles[row][col].status = 'win';
      this.boards[this.player].player.score ++;
    } else {
      this.toastr.info("Keep trying.", "OOPS! YOU MISSED THIS TIME");
      this.boards[boardId].tiles[row][col].status = 'fail'
    }
    this.canPlay = false;
    this.boards[boardId].tiles[row][col].used = true;
    sessionStorage.setItem("boards",JSON.stringify(this.boards));
    this.socket.emitMoves(new Move({canPlay: true,boards:this.boards,gameId:HomeComponent.gameId,opponent:this.opponent}));
    return this;
  }

  checkValidHit(boardId: string, tile: any) : boolean {
    if (boardId == this.player) {
      this.toastr.error("Don't commit suicide.", "You can't hit your own board.")
      return false;
    }
    if (this.winner) {
      this.toastr.error("Game is over");
      return false;
    }
    if (!this.canPlay) {
      this.toastr.error("A bit too eager.", "It's not your turn to play.");
      return false;
    }
    if(tile.used == true) {
      this.toastr.error("Don't waste your torpedos.", "You already shot here.");
      return false;
    }
    return true;
  }

  createBoards(player:string) : BattleshipGameComponent {
    this.boardService.createBoard(BOARD_SIZE,player);
    
    return this;
  }
  get winner () : Board | undefined {
    
    try {
      if(this.boards[this.player].player.score>=SCORE_LIMIT){
      
        return this.boards[this.player];
      }else if(this.boards[this.opponent].player.score>=SCORE_LIMIT){
      
        return this.boards[this.opponent];
      }else{
        return undefined;
      }
    } catch (error) {
      return undefined;
    }
    
  }

  get boards () : Foo {
    return this.boardService.getBoards();
  }

  ngOnInit():void{
    this.initConnection();
    if(!this.connected){
      this.socket.connection({username:HomeComponent.username,visitor:false,gameId:HomeComponent.gameId});
      this.connected=true;
      sessionStorage.setItem("connected",this.connected+"");
    
    }
      console.log("DIOCANEEE")
      SubscriptionsService.subscriptions.push(
        this.socket.listenMoves().subscribe((data:any)=>{
          this.canPlay = data.canPlay;
        this.boards[this.player] = data.boards[this.player];
        this.boards[this.opponent] = data.boards[this.opponent];
        sessionStorage.setItem("canPlay",this.canPlay+"");
        sessionStorage.setItem("boards",JSON.stringify(this.boards));  
        console.log("Ricevuta la board ");
        console.log(data);
       
      })
    );
    
    
  }
  
  getKeys():string[]{
    return Object.keys(this.boards);
  }
  quitGame(){
    this.ngOnDestroy();
    this.socket.disconnect({username:HomeComponent.username,gameId:HomeComponent.gameId});
    this.route.navigate(["/home/game"]);
    console.log(AppComponent.logged)
  }
  @HostListener('unloaded')
  ngOnDestroy() {
    console.log('Items destroyed');
    this.canPlay = true;
    this.player = "";
    this.opponent ="";
    this.players = 1;
    this.connected=false;
    this.messages=[];
    SubscriptionsService.dispose();
    this.boardService.ngOnDestroy();
    this.createBoards(HomeComponent.username);
    
  }
  sendMessage(){
    
    this.chatService.sendMessage(this.msgForm.get("msg")?.value,this.player,this.opponent,HomeComponent.gameId);
    this.msgForm.reset();
  }
  
  

}
