import { Component, HostListener, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { faKey, faUser } from '@fortawesome/free-solid-svg-icons';
import { ToastrService } from 'ngx-toastr';
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
  users:any;
  user:any;
  moderatorForm = new FormGroup({
    name: new FormControl('', Validators.required),
    email: new FormControl('', Validators.required),
    password: new FormControl('', Validators.required)
  });
  addModeratorForm = new FormGroup({
    username: new FormControl('', Validators.required),
    password: new FormControl('', Validators.required)
  });
  
  faKey = faKey;
  faUser = faUser;
  constructor(private appService:AppService,private socket:WebsocketService,private route:Router,private toastr: ToastrService) { }

  ngOnInit(): void {
    this.appService.getAllUsers(HomeComponent.token,{moderator:HomeComponent.username}).pipe().subscribe((data:any)=>{
      this.users=data.sub;
    });
  }
  onSubmit() {
    if(this.moderatorForm.get("password")?.value != "" && this.moderatorForm.get("name")?.value != "" && this.moderatorForm.get("email")?.value != ""){
      this.appService.firstlogin(HomeComponent.token,{username:HomeComponent.username,password:this.moderatorForm.get("password")?.value,name:this.moderatorForm.get("name")?.value,email:this.moderatorForm.get("email")?.value}).pipe().subscribe((data)=>{
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
  removeUser(x:any){
    this.appService.deleteUser(HomeComponent.token,{moderator:HomeComponent.username,username:x}).pipe().subscribe((data:any)=>{
        this.toastr.success("You deleted user "+x+"!","User deleted!");
        this.appService.getAllUsers(HomeComponent.token,{moderator:HomeComponent.username}).pipe().subscribe((data:any)=>{
        this.users=data.sub;
    });
    })
  }
  get ModeratorComoponent(){
    return ModeratorComponent;
  }
  @HostListener('unloaded')
  ngOnDestroy() {
    HomeComponent.token = "";
    AppComponent.logged=false;
    sessionStorage.setItem("logged","false");
  }
  
  
  logout(){
    this.appService.logout(HomeComponent.token,{username:HomeComponent.username}).pipe().subscribe(()=>{
      this.ngOnDestroy();
      sessionStorage.clear();
      this.route.navigate(['/','login']);
      
    })
    
  }
  userInfo(x:any){
    console.log(x)
    this.users.forEach((element:any) => {
      console.log("ELEMENTO ARRAY: "+element);
      if(element.username==x){
        this.user=element;
      }
    });
  }


}
