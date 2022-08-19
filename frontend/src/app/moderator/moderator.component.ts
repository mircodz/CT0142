import { AfterContentChecked, Component, ElementRef, HostListener, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { faKey, faUser } from '@fortawesome/free-solid-svg-icons';
import { ToastrService } from 'ngx-toastr';
import { Subscription } from 'rxjs';
import { AppComponent } from '../app.component';
import { AppService } from '../app.service';
import { ChatService } from '../chat.service';
import { HomeComponent } from '../home/home.component';
import { LoginComponent } from '../login/login.component';
import { WebsocketService } from '../websocket.service';

@Component({
  selector: 'app-moderator',
  templateUrl: './moderator.component.html',
  styleUrls: ['./moderator.component.css']
})
export class ModeratorComponent implements OnInit,AfterContentChecked,OnDestroy {
  static isFirstLogin:boolean=LoginComponent.getBoolean(sessionStorage.getItem("isFirstLogin"));;
  users:any;
  user:any;
  player:string="";
  subs:Subscription[]=[];
  messages:any[]=[];
  @ViewChild('chatWithPlayers')
  divToScroll!: ElementRef;
  msgForm = new FormGroup({
    msg: new FormControl('', Validators.required),
  });
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
  constructor(private appService:AppService,private chatService:ChatService,private socket:WebsocketService,private route:Router,private toastr: ToastrService) { }
  ngAfterContentChecked(): void {
    try {
      this.divToScroll.nativeElement.scrollTop=this.divToScroll.nativeElement.scrollHeight;
    } catch (error) {
      console.log(error);
    }
    
  }

  ngOnInit(): void {
    this.appService.getAllUsers(HomeComponent.token,{moderator:HomeComponent.username}).pipe().subscribe((data:any)=>{
      this.users=data.sub;
    });
    this.subs.push(
      this.chatService.listenPrivateMessage().subscribe((data:any)=>{
        if(data.username==this.player){
          this.messages.push({message:data.msg,from:data.username,to:HomeComponent.username,timestamp:new Date(data.timestamp+"").toTimeString().substring(0,5)});
        }
      })
    );
  }
  chat(x:any){
    this.player=x;
    this.appService.getChat(HomeComponent.token,{username:HomeComponent.username,friend:x}).pipe().subscribe((data:any)=>{
      this.messages=data.sub;
      this.messages.forEach(value =>{
        let time = new Date(value.timestamp);
        let now = new Date();
        if(now.getDate()!=time.getDate() || now.getMonth()!=time.getMonth()){
          value.timestamp=time.getDate()+"/"+time.getMonth();
        }else{
          value.timestamp=time.toTimeString().substring(0,5);
        }
        
      });
        console.log(data);
    });
  }
  sendMessage(){
    
    this.appService.chat(HomeComponent.token,{username:HomeComponent.username,friend:this.player,msg:this.msgForm.get("msg")?.value}).pipe().subscribe((data:any)=>{
      this.messages.push({message:this.msgForm.get("msg")?.value,from:HomeComponent.username,to:this.player,timestamp:new Date().toTimeString().substring(0,5)});
      this.msgForm.reset();
    })
  }
  onSubmit() {
    if(this.moderatorForm.get("password")?.value != "" && this.moderatorForm.get("name")?.value != "" && this.moderatorForm.get("email")?.value != ""){
      this.appService.firstlogin(HomeComponent.token,{username:HomeComponent.username,password:this.moderatorForm.get("password")?.value,name:this.moderatorForm.get("name")?.value,email:this.moderatorForm.get("email")?.value}).pipe().subscribe((data)=>{
        ModeratorComponent.isFirstLogin=false;
        sessionStorage.setItem("isFirstLogin",ModeratorComponent.isFirstLogin+"");
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
    this.subs.forEach(value => value.unsubscribe());
  }
  
  
  logout(){
    this.appService.logout(HomeComponent.token,{username:HomeComponent.username}).pipe().subscribe(()=>{
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
