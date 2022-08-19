import { Component, Injectable, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterEvent, RouterLink, RouterModule, RouterOutlet } from '@angular/router';

import { faUser, faKey, faPaperPlane } from '@fortawesome/free-solid-svg-icons';



import { AppComponent } from '../app.component';
import { AppService } from '../app.service';
import { HomeComponent } from '../home/home.component';
import { ModeratorComponent } from '../moderator/moderator.component';
import { WebsocketService } from '../websocket.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
@Injectable({providedIn: 'root'})
export class LoginComponent implements OnInit {
  loginForm = new FormGroup({
    username: new FormControl('', Validators.required),
    password: new FormControl('', Validators.required)
  });
  
  faUser = faUser;
  faKey = faKey;
 

  constructor(private appService:AppService, private socket:WebsocketService,private route:Router) { }

  ngOnInit(): void { 

  }

  onSubmit() {
    HomeComponent.username= this.loginForm.get("username")?.value;
    if(this.loginForm.get("username")?.value != "" && this.loginForm.get("password")?.value != ""){
      this.appService.login({username:this.loginForm.get("username")?.value,password:this.loginForm.get("password")?.value}).pipe().subscribe((data:any)=>{
        HomeComponent.token=JSON.parse(JSON.stringify(data)).token;
        sessionStorage.setItem("token",JSON.parse(JSON.stringify(data)).token);
        this.socket.login({username:this.loginForm.get("username")?.value});
        this.route.navigate(["/","home"]);
        AppComponent.isModerator=data.sub.isModerator;
        sessionStorage.setItem("isModerator",AppComponent.isModerator+"");
        ModeratorComponent.isFirstLogin=data.sub.isFirstLogin;
        sessionStorage.setItem("isFirstLogin",ModeratorComponent.isFirstLogin+"");
        AppComponent.logged=true;
        sessionStorage.setItem("logged","true");
        sessionStorage.setItem("username",this.loginForm.get("username")?.value);

      });
    }
  }
  
  static getBoolean(value:any){
    switch(value){
         case true:
         case "true":
         case 1:
         case "1":
         case "on":
         case "yes":
             return true;
         default: 
             return false;
     }
 }
}
