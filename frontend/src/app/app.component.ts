import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { faL } from '@fortawesome/free-solid-svg-icons';
import { Socket } from 'ngx-socket-io';
import { ToastrService } from 'ngx-toastr';
import { HighlightSpanKind } from 'typescript';
import { AppService } from './app.service';
import { BattleshipGameComponent } from './battleship-game/battleship-game.component';
import { BoardService } from './battleship-game/board.service';

import { ChatService } from './chat.service';
import { WebsocketService } from './websocket.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit, OnDestroy {
  static token: any;
  static isShown: boolean=false;
  static isVisitor:boolean=true;
  static gameId:any;
   isGame: boolean= false;
   gameAsVisitor:boolean=false;
   isHome: boolean= false;
   isFriends: boolean= false;
    matches:any;
   users:any;
   friends:any;
  static username: any;
  static getToken() {
    return this.token;
  }
  get logged() {
    return AppComponent.logged;
  }
  get isShown(){
    return AppComponent.isShown;
  }

  get AppComponent(){
    return AppComponent;
  }
  title = 'c4';
  static logged:boolean= false;
  name:string="";

  password:string="";
  email:string="";
  friendForm = new FormGroup({
    friend: new FormControl('', Validators.required)
  });

  
  constructor(private chatService: ChatService, private appService:AppService, private socket:WebsocketService) {
      
   }

  ngOnInit() {
    
    this.chatService.sendMessage('porcodio')
    this.socket.listenFriendRequest().subscribe((data:any)=>{
      if (confirm('Vuoi diventare mio amico?'+data.username)) {
        // Save it!
        console.log('SI!');
        this.appService.addFriends(AppComponent.token,{username:data.username,friend:AppComponent.username}).pipe().subscribe((data)=>{
          console.log("Amicizia inserita");
        })
      } else {
        // Do nothing!
        console.log('NO!');
      }
    });
    this.socket.matchConfirm().subscribe((data:any)=>{
        this.showGame();
        AppComponent.isVisitor=false;
    });
    this.socket.listenMatchRequest().subscribe((data:any)=>{
      if (confirm('Ti va di fare una partita? Sono '+data.opponent)) {
        // Save it!
        console.log('SI!');
        this.showGame();
        AppComponent.isVisitor=false;
        this.socket.sendConfirm({username:data.opponent})
      } else {
        // Do nothing!
        console.log('NO!');
      }
    })
    
  }
  
  static toggleShow(){
    this.isShown=!this.isShown;
  }
  showGame(){
    this.appService.getMatches(AppComponent.token).pipe().subscribe((data:any)=>{
      this.matches = data.matches;
      console.log(this.matches)
     });
    this.isGame=true;
    this.isHome=false;
    this.isFriends=false;
  }
  watchMatch(x:any){
    this.gameAsVisitor=true;
    console.log("ID del match: "+x);
    AppComponent.gameId=x;
    
  }
   showFriends(){
    
    
    
    this.isGame=false;
    this.isHome=false;
    this.isFriends=true;
    this.appService.allUsers(AppComponent.token).pipe().subscribe((data)=>{
      this.users = JSON.parse(JSON.stringify(data));
      this.users = Object.keys(this.users.users);
      console.log(this.users);
    });
    this.appService.friends(AppComponent.token,{username:AppComponent.username}).pipe().subscribe((data)=>{
      console.log("Il mio username "+AppComponent.username)
      this.friends = JSON.parse(JSON.stringify(data));
      console.log(this.friends);
    });
    this.socket.disconnect({username:AppComponent.username,gameId:BattleshipGameComponent.gameId,visitor:AppComponent.isVisitor});

  
  }
  sendMatchRequest(x:any){
    this.socket.sendMatchRequest({opponent:AppComponent.username,username:x});
  }
  showHome(){
   
    
    this.isGame=false;
    this.isHome=true;
    this.isFriends=false;
    this.socket.disconnect({username:AppComponent.username});
  }
  
  ngOnDestroy() {
  }
  getToken(){
    
  }
  onSubmitFriend(){
    this.socket.sendFriendRequest({username:AppComponent.username,friend:this.friendForm.get("friend")?.value});
  }
}
