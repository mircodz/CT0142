import { AfterContentChecked, Component, ElementRef, HostListener, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { Subscription } from 'rxjs';
import { AppService } from '../app.service';
import { BattleshipGameComponent } from '../battleship-game/battleship-game.component';
import { Board } from '../battleship-game/board';
import { BoardService } from '../battleship-game/board.service';
import { Foo } from '../battleship-game/foo';
import { Move } from '../battleship-game/move';
import { ChatService } from '../chat.service';
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
export class WatchGameComponent implements OnInit,OnDestroy,AfterContentChecked {

  msgForm = new FormGroup({
    msg: new FormControl('', Validators.required),
  });
  player: any = (sessionStorage.getItem("player")) ? sessionStorage.getItem("player"): "";
  subscriptions: Subscription[]=[];
  matches:any= JSON.parse(sessionStorage.getItem("matches")+"");
  opponent:any =(sessionStorage.getItem("opponent")) ? sessionStorage.getItem("opponent") : "";
  whoPlay:any=(sessionStorage.getItem("whoPlay")) ? sessionStorage.getItem("whoPlay"): "";
  players: number =(sessionStorage.getItem("players"))? Number.parseInt(sessionStorage.getItem("players")+""):  0;
  gameUrl: string = location.protocol + '//' + location.hostname + (location.port ? ':' + location.port: '');
  messages:any[]=(sessionStorage.getItem("messages")!=null) ? JSON.parse(sessionStorage.getItem("messages")+"") :[];
  messagesMatch:any[]=(sessionStorage.getItem("messagesMatch")!=null) ? JSON.parse(sessionStorage.getItem("messagesMatch")+"") :[];
  @ViewChild('chat')
  divToScroll!: ElementRef;
  @ViewChild('chatBroadcast')
  divToScroll2!: ElementRef;
  constructor(private socket: WebsocketService,private boardService: BoardService,private toastr: ToastrService,private appService:AppService,private route:Router,private chatService:ChatService){
    
  
  }
  ngAfterContentChecked(): void {
    try {
      this.divToScroll.nativeElement.scrollTop=this.divToScroll.nativeElement.scrollHeight;
    this.divToScroll2.nativeElement.scrollTop=this.divToScroll2.nativeElement.scrollHeight;
    } catch (error) {
      console.log(error);
    }
    
  }
  get BattleshipGameComponent(){
    return BattleshipGameComponent;
  }
  watchMatch(x:any){
    HomeComponent.gameAsVisitor=true;
    sessionStorage.setItem("gameAsVisitor","true");
    HomeComponent.gameId=x;
    sessionStorage.setItem("gameId",x);
    this.subscriptions.push(this.chatService.listenMessageBroadcast().subscribe((data:any)=>{
      this.messages.push(data);
      sessionStorage.setItem("messages",JSON.stringify(this.messages));
    }));
    this.socket.watchMatch({gameId:HomeComponent.gameId});
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
        console.log("AGGIORNAMENTI PARTIA ");
        console.log(data);
        let chiavi=Object.keys(data.boards);
        
        this.boards[chiavi[0]]=data.boards[chiavi[0]];
        this.boards[chiavi[1]]=data.boards[chiavi[1]];
        sessionStorage.setItem("boards",JSON.stringify(this.boards));
        this.whoPlay = data.whoPlay;
        sessionStorage.setItem("whoPlay",this.whoPlay);
        

      })
    );
      
    
  }
  initConnection(): WatchGameComponent {
    this.socket.watchMatch({gameId:HomeComponent.gameId});
    this.subscriptions.push(
      this.appService.getMatches(HomeComponent.token).pipe().subscribe((data:any)=>{
        console.log("LE PARTITE:")
        console.log(data);
        this.matches = data.matches;
        sessionStorage.setItem("matches",JSON.stringify(this.matches));
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
  exitGame(){
    this.socket.disconnectVisitor({username:HomeComponent.username,gameId:HomeComponent.gameId});
    this.route.navigate(["/home/game"]);
  }

  get boards () : Foo {
    return this.boardService.getBoards();
  }

  ngOnInit():void{
     this.initConnection();
     this.subscriptions.push(
      this.chatService.listenMessage().subscribe((data:any)=>{
        this.messagesMatch.push(data);
        sessionStorage.setItem("messagesMatch",JSON.stringify(this.messagesMatch));
      })
    );
  }
  
  getKeys():string[]{
    return Object.keys(this.boards);
  }
  @HostListener('unloaded')
  ngOnDestroy() {
    console.log('Items destroyed');
    this.player = "";
    
    this.opponent ="";
    this.whoPlay="";
    this.players = 1;
    this.messages=[];
    this.messagesMatch=[]
    HomeComponent.gameAsVisitor=false;
    HomeComponent.gameId="";
    this.boardService.ngOnDestroy();
    this.dispose();
    this.subscriptions=[]
    sessionStorage.removeItem("boards");
    sessionStorage.removeItem("players");
    sessionStorage.removeItem("opponent");
    sessionStorage.removeItem("player");
    sessionStorage.removeItem("gameAsVisitor");
    sessionStorage.removeItem("messages");
    sessionStorage.removeItem("messagesMatch");
    
    
  }
  dispose(){
    this.subscriptions.forEach(subscription =>subscription.unsubscribe());
  }
  sendMessage(){
    
    this.chatService.sendMessagetoBroadcast(this.msgForm.get("msg")?.value,HomeComponent.username,HomeComponent.gameId);


    this.msgForm.reset();
  }
  

}
