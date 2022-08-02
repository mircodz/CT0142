import { Component, HostListener, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { Subscription } from 'rxjs';
import { AppComponent } from '../app.component';
import { AppService } from '../app.service';
import { BattleshipGameComponent } from '../battleship-game/battleship-game.component';
import { ChatService } from '../chat.service';
import { ConfirmationDialogService } from '../confirmation-dialog/confirmation-dialog.service';
import { LoginComponent } from '../login/login.component';
import { WebsocketService } from '../websocket.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  subscriptions: Subscription[]=[];
  static token: any = sessionStorage.getItem("token");
  static isVisitor:boolean=true;
  static gameId:any=sessionStorage.getItem("gameId");
  isGame: boolean= LoginComponent.getBoolean(sessionStorage.getItem("isGame")) || false;
  static gameAsVisitor:boolean=false;
  
  isFriends: boolean= LoginComponent.getBoolean(sessionStorage.getItem("isFriends")) || false;
  isHome: boolean= (this.isGame==false && this.isFriends==false) ? true: LoginComponent.getBoolean(sessionStorage.getItem("isHome")) || false;;
  matches:any= JSON.parse(sessionStorage.getItem("matches")+"");
  users:any = JSON.parse(sessionStorage.getItem("users")+"");
  friends:any = JSON.parse(sessionStorage.getItem("friends")+"");
  historical:any = JSON.parse(sessionStorage.getItem("historical")+"");
  
  static username: any=sessionStorage.getItem("username");
  title = 'c4';
  
  name:string="";

  password:string="";
  email:string="";


  get AppComponent(){
    return AppComponent;
  }
  get HomeComponent(){
    return HomeComponent;
  }
  friendForm = new FormGroup({
    friend: new FormControl('', Validators.required)
  });

  
  constructor(private chatService: ChatService, private appService:AppService, private socket:WebsocketService,private confirmationDialogService: ConfirmationDialogService) {
      
   }

  ngOnInit() {
    this.subscriptions.push(this.appService.getHistorical(HomeComponent.token,{username:HomeComponent.username}).pipe().subscribe((data:any)=>{
      this.historical = data.sub;
      
    }));
    this.chatService.sendMessage('porcodio');
    this.subscriptions.push(
      this.socket.listenUpdateUsers().subscribe((data:any)=>{
        console.log(data)
        this.users=Object.keys(data);
        sessionStorage.setItem("users",JSON.stringify(this.users));
      })
    );
    this.subscriptions.push(
      this.socket.listenFriendRequest().subscribe((data:any)=>{
        this.confirmationDialogService.confirm('Richiesta di amicizia da '+data.username, 'Vuoi diventare mio amico?')
            .then((confirmed) => {
              console.log('SI!');
            this.appService.addFriends(HomeComponent.token,{username:data.username,friend:HomeComponent.username}).pipe().subscribe(()=>{
              console.log("Amicizia inserita");
            })}
            ).catch(() => console.log('NO!'));
      })
    );
    this.subscriptions.push(
      this.socket.matchConfirm().subscribe((data:any)=>{
          this.showGame();
          HomeComponent.isVisitor=false;
          sessionStorage.setItem("isVisitor","false");
      })
    );
    this.subscriptions.push(
    this.socket.listenMatchRequest().subscribe((data:any)=>{
      this.confirmationDialogService.confirm('Richiesta di partita da '+data.username, 'Vuoi fare una partita?')
            .then((confirmed) => {
              console.log('SI!');
              this.showGame();
              HomeComponent.isVisitor=false;
              sessionStorage.setItem("isVisitor","false");
              this.socket.sendConfirm({username:data.opponent});
            }).catch(()=> console.log('NO!'));
      
          }));
    
  }
  
  
  showGame(){
    this.subscriptions.push(
    this.appService.getMatches(HomeComponent.token).pipe().subscribe((data:any)=>{
      this.matches = data.matches;
      sessionStorage.setItem("matches",JSON.stringify(this.matches));
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
    HomeComponent.gameAsVisitor=true;
    sessionStorage.setItem("gameAsVisitor","true");
    HomeComponent.gameId=x;
    sessionStorage.setItem("gameId",x);
    this.socket.connection({username:HomeComponent.username,visitor:HomeComponent.isVisitor,gameId:HomeComponent.gameId});
      
    
  }
  setVisitor(){
    HomeComponent.isVisitor=true;
    sessionStorage.setItem("isVisitor","true");
  }
  setGamer(){
    HomeComponent.isVisitor=false;
    sessionStorage.setItem("isVisitor","false");
  }
   showFriends(){
    
    
    
    this.isGame=false;
    this.isHome=false;
    this.isFriends=true;
    sessionStorage.setItem("isGame","false");
    sessionStorage.setItem("isHome","false");
    sessionStorage.setItem("isFriends","true");
    this.subscriptions.push(
      this.appService.allUsers(HomeComponent.token).pipe().subscribe((data)=>{
        this.users = JSON.parse(JSON.stringify(data));
        this.users = Object.keys(this.users.users);
        console.log(this.users)
        sessionStorage.setItem("users",JSON.stringify(this.users));
      })
    );
    this.subscriptions.push(
      this.appService.friends(HomeComponent.token,{username:HomeComponent.username}).pipe().subscribe((data)=>{
        console.log("Il mio username "+HomeComponent.username)
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
    this.socket.disconnect({username:HomeComponent.username,gameId:HomeComponent.gameId,visitor:HomeComponent.isVisitor});

  
  }
  sendMatchRequest(x:any){
    this.socket.sendMatchRequest({opponent:HomeComponent.username,username:x});
  }
  showHome(){
   
    
    this.isGame=false;
    this.isHome=true;
    this.isFriends=false;
    sessionStorage.setItem("isGame","false");
    sessionStorage.setItem("isHome","true");
    sessionStorage.setItem("isFriends","false");
    this.socket.disconnect({username:HomeComponent.username,gameId:HomeComponent.gameId,visitor:HomeComponent.isVisitor});
  }
  @HostListener('unloaded')
  ngOnDestroy() {
    this.dispose();
    this.subscriptions=[];
    HomeComponent.token = "";
    HomeComponent.isVisitor = true;
    HomeComponent.gameId =undefined;
    this.isGame = false;
    HomeComponent.gameAsVisitor=false;
    this.isFriends = false;
    this.isHome = false;
    this.matches = undefined;
    this.friends = [];
    this.users = undefined;
    AppComponent.logged=false;
  }
  get friendsOnline(){
    let friendsOnline:any[]=[];
    try {
      this.users.forEach((x: string) => {
        this.friends.forEach((y:any) =>{
          console.log(x.toString()+ " "+y.toString());
            if(x===y.username){
              
              friendsOnline.push(x);
            }
        });
      });
      return friendsOnline;
    } catch (error) {
      return undefined;
    }
    
  }
  get usersNotFriends(){
    let usersNotFriends:any[]=[];
    let flag=false;
    try{
      this.users.forEach((x: string) => {
        flag=false;
        this.friends.forEach((y:any) =>{
            if(x===y.username){
              flag=true;
            }
        });
        if(flag==false){
          usersNotFriends.push(x);
        }
      });
      return usersNotFriends;
    }catch(err){
      return this.users;
    }
  }
  sendFriendsRequest(x:any){
    this.socket.sendFriendRequest({username:HomeComponent.username,friend:x});
  }
  logout(){
    this.subscriptions.push(
      this.appService.logout(HomeComponent.token,{username:HomeComponent.username}).pipe().subscribe(()=>{
        
        this.ngOnDestroy();
        console.log("SCOPRIREMO LA VERITA':"+this.users);
        sessionStorage.clear()
        
      })
    );
  }
  dispose(){
    this.subscriptions.forEach(subscription =>subscription.unsubscribe());
  }

}
