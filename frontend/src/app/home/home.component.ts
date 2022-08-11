import { Component, HostListener, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Route, Router } from '@angular/router';
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
  static gameId:any=sessionStorage.getItem("gameId");
  static gameAsVisitor:boolean=false;
  static username: any=sessionStorage.getItem("username");

  get AppComponent(){
    return AppComponent;
  }
  get HomeComponent(){
    return HomeComponent;
  }
  friendForm = new FormGroup({
    friend: new FormControl('', Validators.required)
  });

  
  constructor(private chatService: ChatService, private appService:AppService, private socket:WebsocketService,private confirmationDialogService: ConfirmationDialogService,private route:Router) {
      
   }

  ngOnInit() {
    
  
    
    this.subscriptions.push(
      this.socket.listenFriendRequest().subscribe((data:any)=>{
        this.confirmationDialogService.confirm('Richiesta di amicizia da '+data.username, 'Vuoi diventare mio amico?')
            .then((confirmed) => {
              if(confirmed){
                console.log('SI!');
                this.appService.addFriends(HomeComponent.token,{username:data.username,friend:HomeComponent.username}).pipe().subscribe(()=>{
                  console.log("Amicizia inserita");
                })
              }
              }).catch(() => console.log('NO!'));
      })
    );
    this.subscriptions.push(
      this.socket.matchConfirm().subscribe((data:any)=>{
        this.route.navigate(["/home/game/playGame"]);
      })
    );
    this.subscriptions.push(
    this.socket.listenMatchRequest().subscribe((data:any)=>{
      this.confirmationDialogService.confirm('Richiesta di partita da '+data.username, 'Vuoi fare una partita?')
            .then((confirmed) => {
              if(confirmed){
                console.log('SI!');
                this.route.navigate(["/home/game/playGame"]);
                this.socket.sendConfirm({username:data.opponent});
              }
              
            }).catch(()=> console.log('NO!'));
      
          }));
    
  }
  
  
  
  logout(){
    this.subscriptions.push(
      this.appService.logout(HomeComponent.token,{username:HomeComponent.username}).pipe().subscribe(()=>{
        
        this.socket.disconnect({username:HomeComponent.username,gameId:HomeComponent.gameId});
        AppComponent.logged=false;
        sessionStorage.setItem("logged",false+"");

        sessionStorage.clear();
        console.log("Stampa la sessione del gioco dopo i logout : ");
    console.log(JSON.parse(sessionStorage.getItem("boards")+""));
        this.route.navigate(['/','login']);
        
      })
    );
  }
  dispose(){
    this.subscriptions.forEach(subscription =>subscription.unsubscribe());
  }

}
