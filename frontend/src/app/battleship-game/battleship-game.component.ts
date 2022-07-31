import { Component, OnInit, ElementRef, HostListener, OnDestroy } from '@angular/core';

import { ToastrService } from 'ngx-toastr';

import { Board } from './board';
import { BoardService } from './board.service';
;
import { Move } from './move';

import { WebsocketService } from '../websocket.service';
import { AppComponent } from '../app.component';
import { Foo } from './foo';


// set game constants
const NUM_PLAYERS: number = 2;
const BOARD_SIZE: number = 6;

@Component({
  selector: 'app-battleship-game',
  templateUrl: './battleship-game.component.html',
  styleUrls: ['./battleship-game.component.css']
})



export class BattleshipGameComponent implements OnInit,OnDestroy {
  canPlay: boolean = true;
  player: any = AppComponent.username;
  opponent:any ="";
  check: string = "";
  players: number = 0;
  static gameId: number = 0;
  score: number=0;
  gameUrl: string = location.protocol + '//' + location.hostname + (location.port ? ':' + location.port: '');
  constructor(private socket: WebsocketService,private boardService: BoardService,private toastr: ToastrService){
    if(AppComponent.isVisitor==false){
      this.createBoards(AppComponent.username);
    }
    this.initConnection();
    
  }
  get BattleshipGameComponent(){
    return BattleshipGameComponent;
  }
  initConnection(): BattleshipGameComponent {
    console.log(AppComponent.isVisitor)
    if(AppComponent.isVisitor==false){
      this.socket.joinMember();
      this.socket.sendBoard({board:this.boards[AppComponent.username],username:AppComponent.username});
      this.socket.listenMembers().subscribe((data:any)=>{
        this.players=data.members;
        BattleshipGameComponent.gameId=data.gameId;
        console.log("Numero di giocatori: "+this.players);
        
      });
      this.socket.getBoard().subscribe((data:any)=>{
        this.boards[data.username]=data.board;
        this.opponent=data.username;
        this.canPlay = data.canPlay;
        console.log("Ricevuta la board di "+data.username)
        console.log("Lista di giocatori "+Object.keys(this.boards))
      });
      
    
    
      this.socket.listeQuit().subscribe((data:any)=>{
        this.ngOnDestroy();
      });
    }else{
      this.socket.getBoards().subscribe((data:any)=>{
        console.log(data);
        let chiavi=Object.keys(data);
        this.player=chiavi[0];
        this.opponent=chiavi[1];
        this.boards[chiavi[0]]=data[chiavi[0]];
        this.boards[chiavi[1]]=data[chiavi[1]];
        this.players=2;

      });
      this.socket.connection({username:AppComponent.username,visitor:AppComponent.isVisitor,gameId:AppComponent.gameId});
      
    }
    
    
    return this;
  }
  setPlayer(players:number = 0) : BattleshipGameComponent {
    
    return this;
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
      this.score++;
      this.boards[this.player].player.score = this.score;
    } else {
      this.toastr.info("Keep trying.", "OOPS! YOU MISSED THIS TIME");
      this.boards[boardId].tiles[row][col].status = 'fail'
    }
    this.canPlay = false;
    this.boards[boardId].tiles[row][col].used = true;
    
    this.emit(new Move({canPlay: true, score: this.score,board:this.boards[boardId],gameId:BattleshipGameComponent.gameId}));
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
    if(AppComponent.isVisitor == true) {
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
    if(this.boards[this.player]!=undefined){
      if(this.boards[this.player].player.score>=BOARD_SIZE){
        return this.boards[this.player];
      }else{
        return undefined;
      }
    }
    else if(this.boards[this.opponent]!=undefined){ 
      if(this.boards[this.opponent].player.score>=BOARD_SIZE){
        return this.boards[this.opponent];
      }else{
        return undefined;
      }
    }else{
      return undefined;
    }
    
  }

  get boards () : Foo {
    return this.boardService.getBoards();
  }

  ngOnInit():void{
    if(AppComponent.isVisitor==false){
    this.socket.connection({username:AppComponent.username,visitor:AppComponent.isVisitor,gameId:BattleshipGameComponent.gameId});
    this.socket.listenMoves().subscribe((data:any)=>{
      this.canPlay = data.canPlay;
      this.boards[this.player] = data.board;
      this.boards[this.player].player.score = this.score;
      this.boards[this.opponent].player.score=data.score;
      
      
    });
  }
    
    
    
    
  }
  ngAfterViewInit() {
    
  }
  getKeys():string[]{
    return Object.keys(this.boards);
  }
  emit(carattere:Move):void{
    
    this.socket.emitMoves(carattere);
  }
  @HostListener('unloaded')
  ngOnDestroy() {
    console.log('Items destroyed');
    this.boardService.ngOnDestroy();
  }
  

}
