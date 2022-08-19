import { Component, OnInit, ElementRef, HostListener, OnDestroy, ViewChild, AfterContentChecked } from '@angular/core';

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
import { ThisReceiver } from '@angular/compiler';
import { sys } from 'typescript';


// set game constants
const NUM_PLAYERS: number = 2;
const BOARD_SIZE: number = 10;
const SCORE_LIMIT: number = 32;

@Component({
  selector: 'app-battleship-game',
  templateUrl: './battleship-game.component.html',
  styleUrls: ['./battleship-game.component.css']
})



export class BattleshipGameComponent implements OnInit,OnDestroy,AfterContentChecked {
  msgForm = new FormGroup({
    msg: new FormControl('', Validators.required),
  });
  canPlay: boolean = AppService.getBoolean(sessionStorage.getItem("canPlay"));
  ready:boolean = AppService.getBoolean(sessionStorage.getItem("ready"));
  manual:boolean = AppService.getBoolean(sessionStorage.getItem("manual"));
  started:boolean = AppService.getBoolean(sessionStorage.getItem("started"));
  connected:boolean=(sessionStorage.getItem("connected")!=null) ? AppService.getBoolean(sessionStorage.getItem("connected")) : false;
  player: any = HomeComponent.username;
  static opponent:any =(sessionStorage.getItem("opponent")) ? sessionStorage.getItem("opponent") : "";
  players: number =(sessionStorage.getItem("players"))? Number.parseInt(sessionStorage.getItem("players")+""):  1;
  gameUrl: string = location.protocol + '//' + location.hostname + (location.port ? ':' + location.port: '');
  messages:any[]=(sessionStorage.getItem("messages")!=null) ? JSON.parse(sessionStorage.getItem("messages")+"") :[];
  static isFriendly:boolean=AppService.getBoolean(sessionStorage.getItem("isFriendly"));
  static isInvited:boolean=false;
  vertically:boolean=true;
  faPaper = faPaperPlane;
  @ViewChild('chatMatch')
  divToScroll!: ElementRef;
  constructor(private socket: WebsocketService,private boardService: BoardService,private toastr: ToastrService,private appService:AppService,private chatService:ChatService,private route:Router){
    
  }
  ngAfterContentChecked(): void {
    try {
      this.divToScroll.nativeElement.scrollTop=this.divToScroll.nativeElement.scrollHeight;
    } catch (error) {
      console.log(error)
    }
    
  }
  get BattleshipGameComponent(){
    return BattleshipGameComponent;
  }
  initConnection(): BattleshipGameComponent {
    console.log("Stampa la sessione del gioco : ");
    console.log(JSON.parse(sessionStorage.getItem("boards")+""));
    SubscriptionsService.subscriptions.push(
      this.socket.listenMembers().subscribe((data:any)=>{
        
        if(data.members<this.players){
          this.boards[this.player].player.score=SCORE_LIMIT;
        }else{
          this.players=data.members;
          sessionStorage.setItem("players",this.players+"");
        }
        console.log("HO RICEVUTO "+data.gameId);
        HomeComponent.gameId=data.gameId;
        sessionStorage.setItem("gameId",data.gameId+"");
        
        
      })
    );
    
    
    SubscriptionsService.subscriptions.push(
      this.chatService.listenMessage().subscribe((data:any)=>{
        this.messages.push(data);
        sessionStorage.setItem("messages",JSON.stringify(this.messages));
      })
    );
    SubscriptionsService.subscriptions.push(
      this.socket.listenMoves().subscribe((data:any)=>{
        this.canPlay = data.canPlay;
      this.boards[this.player] = data.boards[this.player];
      this.boards[BattleshipGameComponent.opponent] = data.boards[BattleshipGameComponent.opponent];
      sessionStorage.setItem("canPlay",this.canPlay+"");
      sessionStorage.setItem("boards",JSON.stringify(this.boards));  
      console.log("Ricevuta la mossa");
      console.log(data);
      console.log(this.player+" "+BattleshipGameComponent.opponent)
     
    })
  );
    SubscriptionsService.subscriptions.push(
      this.socket.listenQuit().subscribe((data:any)=>{
        this.toastr.warning("Your opponent quit the Game","Opponent quit!")
        this.route.navigate(["/home/game"]);
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

  sendBoard(){
    this.createBoards(HomeComponent.username)
    this.socket.sendBoard({board:this.boards[HomeComponent.username],username:HomeComponent.username,gameId:HomeComponent.gameId});
    this.ready=true;
    sessionStorage.setItem("ready",this.ready+"");
  }
  sendMyBoard(){
    this.socket.sendBoard({board:this.boards[HomeComponent.username],username:HomeComponent.username,gameId:HomeComponent.gameId});
    this.ready=true;
    sessionStorage.setItem("ready",this.ready+"");
  }
  isManual(){
    this.manual=true;
    sessionStorage.setItem("manual",this.manual+"");
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
    sessionStorage.setItem("canPlay",this.canPlay+"");
    this.boards[boardId].tiles[row][col].used = true;
    sessionStorage.setItem("boards",JSON.stringify(this.boards));
    this.socket.emitMoves(new Move({canPlay: true,boards:this.boards,gameId:HomeComponent.gameId,opponent:BattleshipGameComponent.opponent}));
    return this;
  }
  getboardService(){
    return this.boardService;
  }
  putShip(e:any,ship:any){
    let id = e.target.id.split(";");
    let row = Number.parseInt(id[0]), col = Number.parseInt(id[1]);
    console.log(ship);
    if(!this.boards[HomeComponent.username].tiles[row][col].canPut){

      this.toastr.error("You can't put here your ship.", "You can't put")
      return;
    }
    if(this.vertically){
      let i=0;
			while(i<ship){
        this.boards[HomeComponent.username].tiles[row][col+i].value = "X";
        i++;
      }
    }else{
      let i=0;
			while(i<ship){
        this.boards[HomeComponent.username].tiles[row+i][col].value = "X";
        i++;
      }
    }
    this.boards[HomeComponent.username].ships.pop();
    if(!this.vertically){
      for(let i = 0;i<10;i++){
        for(let j=0;j<10;j++){
          if(this.boardService.canSetShip(this.boards[HomeComponent.username].ships[this.boards[HomeComponent.username].ships.length-1],this.boards[HomeComponent.username].tiles,i,j)==0 || this.boardService.canSetShip(this.boards[HomeComponent.username].ships[this.boards[HomeComponent.username].ships.length-1],this.boards[HomeComponent.username].tiles,i,j)==2){
            this.boards[HomeComponent.username].tiles[i][j].canPut=true;
          }else{
            this.boards[HomeComponent.username].tiles[i][j].canPut=false;
          }
      
        }
      }
      
    }else{
      for(let i = 0;i<10;i++){
        for(let j=0;j<10;j++){
          if(this.boardService.canSetShip(this.boards[HomeComponent.username].ships[this.boards[HomeComponent.username].ships.length-1],this.boards[HomeComponent.username].tiles,i,j)==1 || this.boardService.canSetShip(this.boards[HomeComponent.username].ships[this.boards[HomeComponent.username].ships.length-1],this.boards[HomeComponent.username].tiles,i,j)==2){
            this.boards[HomeComponent.username].tiles[i][j].canPut=true;
          }else{
            this.boards[HomeComponent.username].tiles[i][j].canPut=false;
          }
      
        }
      }
    }
    return this;

  }
  mouseenter(r:any,c:any,ship:any){
    if(this.vertically){
      let i=0;
			while(i<ship){
        this.boards[HomeComponent.username].tiles[r+i][c].value = "X";
        i++;
      }
    }else{
      let i=0;
			while(i<ship){
        this.boards[HomeComponent.username].tiles[r][c+i].value = "X";
        i++;
      }
    }
  }
  mouseleave(r:any,c:any,ship:any){
    if(this.vertically){
      let i=0;
			while(i<ship){
        this.boards[HomeComponent.username].tiles[r+i][c].value = "";
        i++;
      }
    }else{
      let i=0;
			while(i<ship){
        this.boards[HomeComponent.username].tiles[r][c+i].value = "";
        i++;
      }
    }
  }
  canContinue(){
    for(let i = 0;i<10;i++){
      for(let j=0;j<10;j++){
        if(this.boards[HomeComponent.username].tiles[i][j].canPut){
          return true;
        }
    
      }
    }
    return false;
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
      }else if(this.boards[BattleshipGameComponent.opponent].player.score>=SCORE_LIMIT){
      
        return this.boards[BattleshipGameComponent.opponent];
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

  async ngOnInit():Promise<void>{
    if(!this.connected){
      this.boardService.createBoardManually(10,HomeComponent.username);
    }
    SubscriptionsService.subscriptions.push(
      this.socket.getBoard().subscribe((data:any)=>{
        console.log("Ricevuta la board di "+data.username+" "+data.board)
        this.boards[data.username]=data.board;
        sessionStorage.setItem("boards",JSON.stringify(this.boards));
        BattleshipGameComponent.opponent=data.username;
        console.log("IO SONO: "+this.player)
        sessionStorage.setItem("opponent",data.username);
        this.canPlay = data.canPlay;
        sessionStorage.setItem("canPlay",data.canPlay);
        this.started = true;
        sessionStorage.setItem("started",this.started+"");
      })
    );
    this.initConnection();
    if(!this.connected){
      
      if(BattleshipGameComponent.isFriendly){
        if(BattleshipGameComponent.isInvited){
          await new Promise(f => setTimeout(f, 1000));
          this.socket.friendlyMatch({player1:HomeComponent.username,player2:BattleshipGameComponent.opponent})
        }else{
          this.socket.friendlyMatch({player1:HomeComponent.username,player2:BattleshipGameComponent.opponent});
        }
        
      }else{
        
        this.socket.connection({username:HomeComponent.username});
      }
        
      
      
      
      this.connected=true;
      sessionStorage.setItem("connected",this.connected+"");
    
      
    }
    
      console.log("DIOCANEEE")
      
    
    
  }
  
  getKeys():string[]{
    return Object.keys(this.boards);
  }
  quitGame(){
    this.socket.disconnect({username:HomeComponent.username,gameId:HomeComponent.gameId});
    
    this.route.navigate(["/home/game"]);
  }
  @HostListener('unloaded')
  ngOnDestroy() {
    console.log('Items destroyed home game');
    this.canPlay = true;
    this.player = HomeComponent.username;
    BattleshipGameComponent.opponent ="";
    this.players = 1;
    this.connected=false;
    this.messages=[];
    this.started=false;
    this.ready=false;
    this.manual=false;
    HomeComponent.gameId="";
    SubscriptionsService.dispose();
    BattleshipGameComponent.isFriendly=false;
    BattleshipGameComponent.isInvited=false;
    this.boardService.ngOnDestroy();
    sessionStorage.removeItem("canPlay");
    sessionStorage.removeItem("connected");
    sessionStorage.removeItem("boards");
    sessionStorage.removeItem("players");
    sessionStorage.removeItem("opponent");
    sessionStorage.removeItem("isFriendly");
    sessionStorage.removeItem("ready");
    sessionStorage.removeItem("started");
    sessionStorage.removeItem("manual");

    
  }
  sendMessage(){
    
    this.chatService.sendMessage(this.msgForm.get("msg")?.value,this.player,BattleshipGameComponent.opponent,HomeComponent.gameId);
    this.messages.push({from:HomeComponent.username,to:BattleshipGameComponent.opponent,message:this.msgForm.get("msg")?.value});

    sessionStorage.setItem("messages",JSON.stringify(this.messages));
    this.msgForm.reset();
  }
  counter(i: number) {
    return new Array(i);
  }
  rotate(){
    this.vertically=!this.vertically;
    if(!this.vertically){
      for(let i = 0;i<10;i++){
        for(let j=0;j<10;j++){
          if(this.boardService.canSetShip(this.boards[HomeComponent.username].ships[this.boards[HomeComponent.username].ships.length-1],this.boards[HomeComponent.username].tiles,i,j)==0 || this.boardService.canSetShip(this.boards[HomeComponent.username].ships[this.boards[HomeComponent.username].ships.length-1],this.boards[HomeComponent.username].tiles,i,j)==2){
            this.boards[HomeComponent.username].tiles[i][j].canPut=true;
          }else{
            this.boards[HomeComponent.username].tiles[i][j].canPut=false;
          }
      
        }
      }
      
    }else{
      for(let i = 0;i<10;i++){
        for(let j=0;j<10;j++){
          if(this.boardService.canSetShip(this.boards[HomeComponent.username].ships[this.boards[HomeComponent.username].ships.length-1],this.boards[HomeComponent.username].tiles,i,j)==1 || this.boardService.canSetShip(this.boards[HomeComponent.username].ships[this.boards[HomeComponent.username].ships.length-1],this.boards[HomeComponent.username].tiles,i,j)==2){
            this.boards[HomeComponent.username].tiles[i][j].canPut=true;
          }else{
            this.boards[HomeComponent.username].tiles[i][j].canPut=false;
          }
      
        }
      }
    }
  }
  
  

}
