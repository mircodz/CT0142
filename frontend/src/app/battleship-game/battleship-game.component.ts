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
  canPlay: boolean = true;
  player: any = (sessionStorage.getItem("player")) ? sessionStorage.getItem("player"):  HomeComponent.username;
  subscriptions: Subscription[]=[];
  opponent:any =(sessionStorage.getItem("opponent")) ? sessionStorage.getItem("opponent") : "";
  whoPlay:any=(sessionStorage.getItem("whoPlay")) ? sessionStorage.getItem("whoPlay"): "";
  players: number =(sessionStorage.getItem("players"))? Number.parseInt(sessionStorage.getItem("players")+""):  0;
  gameUrl: string = location.protocol + '//' + location.hostname + (location.port ? ':' + location.port: '');
  constructor(private socket: WebsocketService,private boardService: BoardService,private toastr: ToastrService,private appService:AppService){
    if(HomeComponent.isVisitor==false){
      this.createBoards(HomeComponent.username);
    }else{
      this.socket.disconnect({username:HomeComponent.username,gameId:HomeComponent.gameId,visitor:HomeComponent.isVisitor});
    }
    this.initConnection();
    
  }
  get BattleshipGameComponent(){
    return BattleshipGameComponent;
  }
  initConnection(): BattleshipGameComponent {
    console.log(HomeComponent.isVisitor)
    if(HomeComponent.isVisitor==false){
      this.socket.joinMember();
      this.socket.sendBoard({board:this.boards[HomeComponent.username],username:HomeComponent.username});
      this.subscriptions.push(
        this.socket.listenMembers().subscribe((data:any)=>{
          
          if(data.members<this.players){
            this.boards[this.player].player.score=SCORE_LIMIT;
          }else{
            this.players=data.members;
            sessionStorage.setItem("players",this.players+"");
          }
          HomeComponent.gameId=data.gameId;
          console.log("QUESTO e' IL MIO ID DI GIOCO "+data.gameId);
          sessionStorage.setItem("gameId",data.gameId+"");
          
        })
      );
      this.subscriptions.push(
        this.socket.getBoard().subscribe((data:any)=>{
          this.boards[data.username]=data.board;
          sessionStorage.setItem("boards",JSON.stringify(this.boards));
          this.opponent=data.username;
          sessionStorage.setItem("opponent",data.username);
          this.canPlay = data.canPlay;
          sessionStorage.setItem("canPlay",data.canPlay);
        })
      );
      
    
      this.subscriptions.push(
        this.socket.listeQuit().subscribe((data:any)=>{
          this.ngOnDestroy();
        })
      );
    }else{
      this.subscriptions.push(
        this.appService.getMatchId(HomeComponent.token,{id:HomeComponent.gameId}).pipe().subscribe((data:any)=>{
      
          let chiavi=Object.keys(data.match.boards);
          this.player=chiavi[0];
          sessionStorage.setItem("player",chiavi[0]);
          this.opponent=chiavi[1];
          sessionStorage.setItem("opponent",chiavi[1]);
          this.boards[chiavi[0]]=data.match.boards[chiavi[0]];
          this.boards[chiavi[1]]=data.match.boards[chiavi[1]];
          sessionStorage.setItem("boards",JSON.stringify(data.match.boards));
          this.players=2;
          sessionStorage.setItem("players",2+"");
          this.whoPlay = data.match.whoPlay;
          sessionStorage.setItem("whoPlay",this.whoPlay);
        })
      );
      this.subscriptions.push(
        this.socket.getBoards().subscribe((data:any)=>{
          
          let chiavi=Object.keys(data.boards);
          
          this.boards[chiavi[0]]=data.boards[chiavi[0]];
          this.boards[chiavi[1]]=data.boards[chiavi[1]];
          sessionStorage.setItem("boards",JSON.stringify(this.boards));
          this.whoPlay = data.whoPlay;
          sessionStorage.setItem("whoPlay",this.whoPlay);
          console.log("AGGIORNAMENTI PARTIA "+this.boards[chiavi[0]].player.score+" "+this.boards[chiavi[0]].player.score+"\n")

        })
      );
      
    }
    
    
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
      console.log(boardId)
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
    if(HomeComponent.isVisitor == true) {
      this.toastr.error("You can't play!", "You are only a visitor.");
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
    if(HomeComponent.isVisitor==false){
    this.socket.connection({username:HomeComponent.username,visitor:HomeComponent.isVisitor,gameId:HomeComponent.gameId});
    this.subscriptions.push(
      this.socket.listenMoves().subscribe((data:any)=>{
        this.canPlay = data.canPlay;
        this.boards[this.player] = data.boards[this.player];
        this.boards[this.opponent] = data.boards[this.opponent];
   
        //this.boards[this.opponent].player.score=data.score;
        sessionStorage.setItem("canPlay",this.canPlay+"");
        sessionStorage.setItem("boards",JSON.stringify(this.boards));
        
        
      })
    );
  }
    
    
    
    
  }
  
  getKeys():string[]{
    return Object.keys(this.boards);
  }
  @HostListener('unloaded')
  ngOnDestroy() {
    console.log('Items destroyed');
    this.canPlay = true;
    this.player = "";
    this.subscriptions=[]
    this.opponent ="";
    this.whoPlay="";
    this.players = 0;
    this.boardService.ngOnDestroy();
    this.dispose();
    this.createBoards(HomeComponent.username);
    this.initConnection();
    this.ngOnInit();
    
  }
  dispose(){
    this.subscriptions.forEach(subscription =>subscription.unsubscribe());
  }
  

}
