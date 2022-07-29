import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormGroup } from '@angular/forms';
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
  static isGame: boolean= false;
  static isHome: boolean= false;
  static isFriends: boolean= false;
  static getToken() {
    return this.token;
  }
  get logged() {
    return AppComponent.logged;
  }
  get isShown(){
    return AppComponent.isShown;
  }
  get isHome(){
	return AppComponent.isHome;
  }

  get isGame(){
	return AppComponent.isGame;
  }

  get isFriends(){
	return AppComponent.isFriends;
  }
  get AppComponent(){
    return AppComponent;
  }
  title = 'c4';
  static logged:boolean= false;
  name:string="";
  username:string="";
  password:string="";
  email:string="";

  
  constructor(private chatService: ChatService, private appService:AppService, private socket:WebsocketService) {
   
   }

  ngOnInit() {
    
    this.chatService.sendMessage('porcodio')

    
  }
  register(){
    this.appService.register({name:this.name,username:this.username,email:this.email,password:this.password}).pipe().subscribe();
  }
  static toggleShow(){
    this.isShown=!this.isShown;
  }
  static showGame(){
	this.isGame=true;
	this.isHome=false;
	this.isFriends=false;
  }
  static showFriends(){
	this.isGame=false;
	this.isHome=false;
	this.isFriends=true;
  }
  static showHome(){
	this.isGame=false;
	this.isHome=true;
	this.isFriends=false;
  }
  login(){
    this.appService.login({username:this.username,password:this.password}).pipe().subscribe((data)=>{
      
      AppComponent.token=JSON.parse(JSON.stringify(data)).token;
      
    });
  }
  ngOnDestroy() {
  }
  getToken(){
    
  }
}
