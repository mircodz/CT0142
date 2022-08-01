import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { faL } from '@fortawesome/free-solid-svg-icons';
import { Socket } from 'ngx-socket-io';
import { ToastrService } from 'ngx-toastr';
import { Subscription } from 'rxjs';
import { HighlightSpanKind } from 'typescript';
import { AppService } from './app.service';
import { BattleshipGameComponent } from './battleship-game/battleship-game.component';
import { BoardService } from './battleship-game/board.service';

import { ChatService } from './chat.service';
import { LoginComponent } from './login/login.component';
import { WebsocketService } from './websocket.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit, OnDestroy {
  subscriptions: Subscription[]=[];
  static token: any = sessionStorage.getItem("token");
  static isShown: boolean=false;
  static isVisitor:boolean= LoginComponent.getBoolean((sessionStorage.getItem("isVisitor")==null) ? true : sessionStorage.getItem("isVisitor")) && true;
  static gameId:any=sessionStorage.getItem("gameId");
  isGame: boolean= LoginComponent.getBoolean(sessionStorage.getItem("isGame")) || false;
  static gameAsVisitor:boolean=false;
  isHome: boolean= LoginComponent.getBoolean(sessionStorage.getItem("isHome")) || false;;
  isFriends: boolean= LoginComponent.getBoolean(sessionStorage.getItem("isFriends")) || false;;
  matches:any= JSON.parse(sessionStorage.getItem("matches")+"");
  users:any = JSON.parse(sessionStorage.getItem("users")+"");
  friends:any = JSON.parse(sessionStorage.getItem("friends")+"");
  
  static username: any=sessionStorage.getItem("username");
  title = 'c4';
  static logged:boolean= LoginComponent.getBoolean(sessionStorage.getItem("logged")) || false;
  name:string="";

  password:string="";
  email:string="";

  get logged() {
    return AppComponent.logged;
  }
  get isShown(){
    return AppComponent.isShown;
  }

  get AppComponent(){
    return AppComponent;
  }
  
  friendForm = new FormGroup({
    friend: new FormControl('', Validators.required)
  });

  
  constructor(private chatService: ChatService, private appService:AppService, private socket:WebsocketService) {
      
   }

  ngOnInit() {
    
    this.chatService.sendMessage('porcodio');
    this.subscriptions.push(
      this.socket.listenUpdateUsers().subscribe((data)=>{
        this.users=data;
      })
    );
    this.subscriptions.push(
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
      })
    );
    this.subscriptions.push(
      this.socket.matchConfirm().subscribe((data:any)=>{
          this.showGame();
          AppComponent.isVisitor=false;
          sessionStorage.setItem("isVisitor","false");
      })
    );
    this.subscriptions.push(
    this.socket.listenMatchRequest().subscribe((data:any)=>{
      if (confirm('Ti va di fare una partita? Sono '+data.opponent)) {
        // Save it!
        console.log('SI!');
        this.showGame();
        AppComponent.isVisitor=false;
        sessionStorage.setItem("isVisitor","false");
        this.socket.sendConfirm({username:data.opponent});
      } else {
        // Do nothing!
        console.log('NO!');
      }
    })
    );
    
  }
  
  static toggleShow(){
    this.isShown=!this.isShown;
    
    
  }
  showGame(){
    this.subscriptions.push(
    this.appService.getMatches(AppComponent.token).pipe().subscribe((data:any)=>{
      this.matches = data.matches;
      sessionStorage.setItem("matches",JSON.stringify(data.matches));
     })
    );
    this.isGame=true;
    this.isHome=false;
    this.isFriends=false;
    sessionStorage.setItem("isGame","true");
    sessionStorage.setItem("isHome","false");
    sessionStorage.setItem("isFriends","false");
    
  }
  watchMatch(x:any){
    AppComponent.gameAsVisitor=true;
    sessionStorage.setItem("gameAsVisitor","true");
    AppComponent.gameId=x;
    sessionStorage.setItem("gameId",x);
    this.socket.connection({username:AppComponent.username,visitor:AppComponent.isVisitor,gameId:AppComponent.gameId});
      
    
  }
   showFriends(){
    
    
    
    this.isGame=false;
    this.isHome=false;
    this.isFriends=true;
    sessionStorage.setItem("isGame","false");
    sessionStorage.setItem("isHome","false");
    sessionStorage.setItem("isFriends","true");
    this.subscriptions.push(
      this.appService.allUsers(AppComponent.token).pipe().subscribe((data)=>{
        this.users = JSON.parse(JSON.stringify(data));
        this.users = Object.keys(this.users.users);
        sessionStorage.setItem("users",JSON.stringify(this.users));
      })
    );
    this.subscriptions.push(
      this.appService.friends(AppComponent.token,{username:AppComponent.username}).pipe().subscribe((data)=>{
        console.log("Il mio username "+AppComponent.username)
        this.friends = JSON.parse(JSON.stringify(data));
        sessionStorage.setItem("friends",JSON.stringify(this.friends));
      })
    );
    this.subscriptions.push(
      this.socket.listenUpdateFriends().subscribe((data:any)=>{
        this.friends = JSON.parse(JSON.stringify(data));
        sessionStorage.setItem("friends",JSON.stringify(this.friends));
      })
    );
    this.socket.disconnect({username:AppComponent.username,gameId:BattleshipGameComponent.gameId,visitor:AppComponent.isVisitor});

  
  }
  sendMatchRequest(x:any){
    this.socket.sendMatchRequest({opponent:AppComponent.username,username:x});
  }
  showHome(){
   
    
    this.isGame=false;
    this.isHome=true;
    this.isFriends=false;
    sessionStorage.setItem("isGame","false");
    sessionStorage.setItem("isHome","true");
    sessionStorage.setItem("isFriends","false");
    this.socket.disconnect({username:AppComponent.username,gameId:BattleshipGameComponent.gameId,visitor:AppComponent.isVisitor});
  }
  @HostListener('unloaded')
  ngOnDestroy() {
    this.dispose();
  }
  get friendsOnline(){
    let friendsOnline:any[]=[];
    this.users.forEach((x: any) => {
      this.friends.forEach((y:any) =>{
          if(x==y){
            friendsOnline.push(x);
          }
      });
    });
    return friendsOnline;
  }
  onSubmitFriend(){
    this.socket.sendFriendRequest({username:AppComponent.username,friend:this.friendForm.get("friend")?.value});
  }
  logout(){
    this.subscriptions.push(
      this.appService.logout(AppComponent.token,{username:AppComponent.username}).pipe().subscribe(()=>{
        
        this.ngOnDestroy();
        
        sessionStorage.clear()
        
      })
    );
  }
  dispose(){
    this.subscriptions.forEach(subscription =>subscription.unsubscribe());
  }
}
