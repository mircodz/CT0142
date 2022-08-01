import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';

import { faUser, faKey } from '@fortawesome/free-solid-svg-icons';


import { AppComponent } from '../app.component';
import { AppService } from '../app.service';
import { WebsocketService } from '../websocket.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  loginForm = new FormGroup({
    username: new FormControl('', Validators.required),
    password: new FormControl('', Validators.required)
  });
  
  faUser = faUser;
  faKey = faKey;

  constructor(private appService:AppService, private socket:WebsocketService) { }

  ngOnInit(): void { 
    console.log("VEDIAMO SE FUNZIONA! "+sessionStorage.getItem("logged")+" Mentre qui segna "+AppComponent.logged);
  }

  onSubmit() {
    AppComponent.username= this.loginForm.get("username")?.value;
    if(this.loginForm.get("username")?.value != "" && this.loginForm.get("password")?.value != ""){
      this.appService.login({username:this.loginForm.get("username")?.value,password:this.loginForm.get("password")?.value}).pipe().subscribe((data)=>{
        console.log(data);
        AppComponent.token=JSON.parse(JSON.stringify(data)).token;
        sessionStorage.setItem("token",JSON.parse(JSON.stringify(data)).token);
        this.socket.login({username:this.loginForm.get("username")?.value});
        
        AppComponent.logged=true;
        sessionStorage.setItem("logged","true");
        sessionStorage.setItem("username",this.loginForm.get("username")?.value);

      });
    }
  }
  toggleShow(){
    AppComponent.toggleShow();
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
