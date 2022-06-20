import { Component, OnInit, ElementRef } from '@angular/core';

import { ToastrService } from 'ngx-toastr';

import { Board } from './board';
import { BoardService } from './board.service';
;
import { Move } from './move';

import { WebsocketService } from '../websocket.service';


// set game constants
const NUM_PLAYERS: number = 2;
const BOARD_SIZE: number = 6;

@Component({
  selector: 'app-battleship-game',
  templateUrl: './battleship-game.component.html',
  styleUrls: ['./battleship-game.component.css']
})



export class BattleshipGameComponent implements OnInit {
  canPlay: boolean = true;
  player: number = -1;
  check: string = "";
  players: number = 0;
  gameId: string = '';
  score: number=0;
  gameUrl: string = location.protocol + '//' + location.hostname + (location.port ? ':' + location.port: '');
  constructor(private socket: WebsocketService,private boardService: BoardService,private toastr: ToastrService){
    this.createBoards();
    this.initConnection();
    
  }
  initConnection(): BattleshipGameComponent {
    
   
    this.socket.joinMember();
    this.socket.listenMembers().subscribe((data:any)=>{

      this.players=data;
      if(this.player!=0){
        this.player = this.players-1;
        if (this.players == 2) {
          this.canPlay = false;
        }
        
        this.socket.sendBoard(this.boards[this.player]);
        

      }
      let i =-1;
      if(this.player==0){
        i=1;
      }else if(this.player==1){
        i=0;
      }
      this.socket.getBoard().subscribe((data:any)=>{
        this.boards[i]=data;
        if(this.player==0){
          this.socket.sendBoard(this.boards[0]);
        }
      });
    });
      
    
    
    
    
    
    return this;
  }
  setPlayer(players:number = 0) : BattleshipGameComponent {
    
    return this;
  }
  get validPlayer(): boolean {
    return (this.players >= NUM_PLAYERS) && (this.player < NUM_PLAYERS);
  }
  fireTorpedo(e:any) : BattleshipGameComponent | undefined {
    
    let id = e.target.id,
      boardId = id.substring(1,2),
      row = id.substring(2,3), col = id.substring(3,4),
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
    
    this.emit(new Move({canPlay: true, score: this.score,board:this.boards[boardId]}));
    return this;
  }

  checkValidHit(boardId: number, tile: any) : boolean {
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

  createBoards() : BattleshipGameComponent {
    for (let i = 0; i < NUM_PLAYERS; i++)
      this.boardService.createBoard(BOARD_SIZE);
    
    return this;
  }
  get winner () : Board | undefined {
    return this.boards.find(board => board.player.score >= BOARD_SIZE);
  }

  get boards () : Board[] {
    return this.boardService.getBoards();
  }

  ngOnInit():void{
    
    
    this.socket.listenMoves().subscribe((data:any)=>{
      this.canPlay = data.canPlay;
      this.boards[this.player] = data.board;
      this.boards[this.player].player.score = this.score;
      if(this.player==0){
        this.boards[1].player.score=data.score;
      }else{
        this.boards[0].player.score=data.score;
      }
      
    });
    
    
    
    
  }
  ngAfterViewInit() {
    
  }
  emit(carattere:Move):void{
    
    this.socket.emitMoves(carattere);
  }


}
