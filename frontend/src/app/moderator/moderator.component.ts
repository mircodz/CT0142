import { Component, HostListener, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { faKey, faUser } from '@fortawesome/free-solid-svg-icons';
import { Subscription } from 'rxjs';
import { AppComponent } from '../app.component';
import { AppService } from '../app.service';
import { HomeComponent } from '../home/home.component';
import { WebsocketService } from '../websocket.service';

@Component({
  selector: 'app-moderator',
  templateUrl: './moderator.component.html',
  styleUrls: ['./moderator.component.css']
})
export class ModeratorComponent implements OnInit {
  static isFirstLogin:boolean=false;
  moderatorForm = new FormGroup({
    password: new FormControl('', Validators.required)
  });
  addModeratorForm = new FormGroup({
    username: new FormControl('', Validators.required),
    password: new FormControl('', Validators.required)
  });
  
  faKey = faKey;
  faUser = faUser;
  constructor(private appService:AppService,private socket:WebsocketService,private route:Router) { }

  ngOnInit(): void {
  }
  onSubmit() {
    if(this.moderatorForm.get("passowrd")?.value != ""){
      this.appService.firstlogin(HomeComponent.token,{username:HomeComponent.username,password:this.moderatorForm.get("password")?.value}).pipe().subscribe((data)=>{
        ModeratorComponent.isFirstLogin=false;
      });
    }
  }
  onSubmitAddModerator(){
    if(this.addModeratorForm.get("username")?.value!="" && this.addModeratorForm.get("password")?.value!=""){
      this.appService.addModerator(HomeComponent.token,{modeator:HomeComponent.username,username:this.addModeratorForm.get("username")?.value,password:this.addModeratorForm.get("password")?.value}).pipe().subscribe((data)=>{
        console.log("Moderatore aggiunto!")
      })
    }
  }
  get ModeratorComoponent(){
    return ModeratorComponent;
  }
  @HostListener('unloaded')
  ngOnDestroy() {
    HomeComponent.token = "";
    AppComponent.logged=false;
  }
  
  
  logout(){
    this.appService.logout(HomeComponent.token,{username:HomeComponent.username}).pipe().subscribe(()=>{
      this.ngOnDestroy();
      sessionStorage.clear();
      this.route.navigate(['/','login']);
      
    })
    
  }

}
