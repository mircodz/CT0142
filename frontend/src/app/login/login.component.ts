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
  logged = false;
  faUser = faUser;
  faKey = faKey;

  constructor(private appService:AppService, private socket:WebsocketService) { }

  ngOnInit(): void { }

  onSubmit() {
    this.appService.login({username:this.loginForm.get("username")?.value,password:this.loginForm.get("password")?.value}).pipe().subscribe((data)=>{
      AppComponent.token=JSON.parse(JSON.stringify(data)).token;
      
      AppComponent.logged=true;
    });
  }
  toggleShow(){
    AppComponent.toggleShow();
  }
}
