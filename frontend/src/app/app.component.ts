import { ResourceLoader } from '@angular/compiler';
import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { faL } from '@fortawesome/free-solid-svg-icons';
import { Socket } from 'ngx-socket-io';
import { ToastrService } from 'ngx-toastr';
import { Subscription } from 'rxjs';
import { HighlightSpanKind } from 'typescript';
import { AppService } from './app.service';
import { BattleshipGameComponent } from './battleship-game/battleship-game.component';
import { BoardService } from './battleship-game/board.service';

import { ChatService } from './chat.service';
import { HomeComponent } from './home/home.component';
import { LoginComponent } from './login/login.component';
import { WebsocketService } from './websocket.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  
  static logged:boolean= AppService.getBoolean(sessionStorage.getItem("logged")) || false;
  static isModerator:boolean=AppService.getBoolean(sessionStorage.getItem("isModerator")) || false;
  title: any;
  constructor(
    private route: ActivatedRoute,private socket:WebsocketService
  ) {}
  get logged() {
    return AppComponent.logged;
  }
  get AppComponent(){
    return AppComponent;
  }
  ngOnInit(): void {
    if(this.logged==true){
      this.socket.login({username:HomeComponent.username});
    }
  }
  
}
