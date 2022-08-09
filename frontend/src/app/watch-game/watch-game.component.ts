import { Component, HostListener, OnInit } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { Subscription } from 'rxjs';
import { AppService } from '../app.service';
import { BattleshipGameComponent } from '../battleship-game/battleship-game.component';
import { Board } from '../battleship-game/board';
import { BoardService } from '../battleship-game/board.service';
import { Foo } from '../battleship-game/foo';
import { Move } from '../battleship-game/move';
import { HomeComponent } from '../home/home.component';
import { WebsocketService } from '../websocket.service';

const NUM_PLAYERS: number = 2;
const BOARD_SIZE: number = 10;
const SCORE_LIMIT: number = 32;

@Component({
  selector: 'app-watch-game',
  templateUrl: './watch-game.component.html',
  styleUrls: ['./watch-game.component.css']
})
export class WatchGameComponent implements OnInit {

  canPlay: boolean = true;
  player: any = (sessionStorage.getItem("player")) ? sessionStorage.getItem("player"): "";
  subscriptions: Subscription[]=[];
  matches:any= JSON.parse(sessionStorage.getItem("matches")+"");
  opponent:any =(sessionStorage.getItem("opponent")) ? sessionStorage.getItem("opponent") : "";
  whoPlay:any=(sessionStorage.getItem("whoPlay")) ? sessionStorage.getItem("whoPlay"): "";
  players: number =(sessionStorage.getItem("players"))? Number.parseInt(sessionStorage.getItem("players")+""):  0;
  gameUrl: string = location.protocol + '//' + location.hostname + (location.port ? ':' + location.port: '');
  constructor(private socket: WebsocketService,private boardService: BoardService,private toastr: ToastrService,private appService:AppService){
    
  
  }
  get BattleshipGameComponent(){
    return BattleshipGameComponent;
  }
  watchMatch(x:any){
    HomeComponent.gameAsVisitor=true;
    sessionStorage.setItem("gameAsVisitor","true");
    HomeComponent.gameId=x;
    sessionStorage.setItem("gameId",x);
    this.socket.connection({username:HomeComponent.username,visitor:true,gameId:HomeComponent.gameId});
      
    
  }
  initConnection(): WatchGameComponent {
    this.subscriptions.push(
      this.appService.getMatches(HomeComponent.token).pipe().subscribe((data:any)=>{
        this.matches = data.matches;
        sessionStorage.setItem("matches",JSON.stringify(this.matches));
       })
      );
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
    return this;
  }
  get HomeComponent(){
    return HomeComponent;
  }

  get validPlayer(): boolean {
    return (this.players >= NUM_PLAYERS);
  }
  fireTorpedo(e:any) : WatchGameComponent | undefined {
    
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
    this.toastr.error("You can't play!", "You are only a visitor.");
    return false;
   
  }

  createBoards(player:string) : WatchGameComponent {
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
    this.players = 1;
    this.boardService.ngOnDestroy();
    this.dispose();
    
    
  }
  dispose(){
    this.subscriptions.forEach(subscription =>subscription.unsubscribe());
  }
  

}
