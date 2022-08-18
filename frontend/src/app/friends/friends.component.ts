import { AfterViewChecked, AfterViewInit, Component, ElementRef, HostListener, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { retry, Subscription, timestamp } from 'rxjs';
import { AppService } from '../app.service';
import { HomeComponent } from '../home/home.component';
import { ToastrService } from 'ngx-toastr';
import { WebsocketService } from '../websocket.service';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ChatService } from '../chat.service';

@Component({
  selector: 'app-friends',
  templateUrl: './friends.component.html',
  styleUrls: ['./friends.component.css']
})
export class FriendsComponent implements OnInit,AfterViewChecked,OnDestroy {
  msgForm = new FormGroup({
    msg: new FormControl('', Validators.required),
  });
  msgFormModerator = new FormGroup({
    msg: new FormControl('', Validators.required),
  });
  static users:any =[];
  friend:string="";
  moderator:string="";
  static friends:string[]=[];
  moderators:any[]=[];
  subs:Subscription[]=[];
  messages:any[]=[];
  messagesModerator:any[]=[];
  @ViewChild('chatWithFriends')
  divToScroll!: ElementRef;
  @ViewChild('chatWithModerators')
  divToScroll2!: ElementRef;
  constructor(private appService:AppService,private socket:WebsocketService,private toastr:ToastrService,private elementRef:ElementRef,private chatService:ChatService) { }
  ngAfterViewChecked(): void {
    try {
      this.divToScroll.nativeElement.scrollTop=this.divToScroll.nativeElement.scrollHeight;
    this.divToScroll2.nativeElement.scrollTop=this.divToScroll2.nativeElement.scrollHeight;
    } catch (error) {
      console.log(error);
    }
    

    
    
  }

  ngOnInit(): void {
    
    this.appService.allUsers(HomeComponent.token).pipe().subscribe((data)=>{
      FriendsComponent.users = JSON.parse(JSON.stringify(data));
      FriendsComponent.users = Object.keys(FriendsComponent.users.users);
    });
    this.appService.getModerators(HomeComponent.token).pipe().subscribe((data:any)=>{
      this.moderators=data.sub;
    })
  
  
    this.appService.friends(HomeComponent.token,{username:HomeComponent.username}).pipe().subscribe((data:any)=>{
      console.log("AMICI")
      console.log(data);
      data.forEach((element:any) => {
        FriendsComponent.friends.push(element.username);
      });
      console.log("FUNZIA")
      
    })
    this.subs.push(
      this.chatService.listenPrivateMessage().subscribe((data:any)=>{
        
          if(this.moderator==data.username){
            this.messagesModerator.push({message:data.msg,from:data.username,to:HomeComponent.username,timestamp:new this.Date(data.timestamp+"").toTimeString().substring(0,5)});
          }else if (this.friend==data.username){
            this.messages.push({message:data.msg,from:data.username,to:HomeComponent.username,timestamp:new this.Date(data.timestamp+"").toTimeString().substring(0,5)});
          }
          
        
      })
    );
  
  
    
    
  }
  get FriendsComponent(){
    return FriendsComponent;
  }
  get Date(){
    return Date;
  }
  get HomeComponent(){
    return HomeComponent;
  }
  chat(x:any){
    
    console.log("Il valore è:");
    console.log(x);
    this.appService.getChat(HomeComponent.token,{username:HomeComponent.username,friend:x}).pipe().subscribe((data:any)=>{
      if(this.moderators.filter(value=>value.username==x)[0]){
        this.moderator=x;
        this.messagesModerator=data.sub;
        this.messagesModerator.forEach(value =>{
        let time = new this.Date(value.timestamp);
        let now = new this.Date();
        if(now.getDate()!=time.getDate() || now.getMonth()!=time.getMonth()){
          value.timestamp=time.getDate()+"/"+time.getMonth();
        }else{
          value.timestamp=time.toTimeString().substring(0,5);
        }
        
      });
      }else if(FriendsComponent.friends.filter(value =>value==x)[0]){
        this.friend=x;
        this.messages=data.sub;
        this.messages.forEach(value =>{
        let time = new this.Date(value.timestamp);
        let now = new this.Date();
        if(now.getDate()!=time.getDate() || now.getMonth()!=time.getMonth()){
          value.timestamp=time.getDate()+"/"+time.getMonth();
        }else{
          value.timestamp=time.toTimeString().substring(0,5);
        }
        
      });
      }else if(x=="-"){
        this.friend="";
        this.messages=[];
      }else if(x=="--"){
        this.moderator="";
        this.messagesModerator=[];
      }
    });
  }
  sendMessage(){
    
    this.appService.chat(HomeComponent.token,{username:HomeComponent.username,friend:this.friend,msg:this.msgForm.get("msg")?.value}).pipe().subscribe((data:any)=>{
      this.messages.push({message:this.msgForm.get("msg")?.value,from:HomeComponent.username,to:this.friend,timestamp:new Date().toTimeString().substring(0,5)});
      this.msgForm.reset();
    })
  }
  sendMessageModerator(){
    
    this.appService.chat(HomeComponent.token,{username:HomeComponent.username,friend:this.moderator,msg:this.msgFormModerator.get("msg")?.value}).pipe().subscribe((data:any)=>{
      this.messagesModerator.push({message:this.msgFormModerator.get("msg")?.value,from:HomeComponent.username,to:this.moderator,timestamp:new Date().toTimeString().substring(0,5)});
      this.msgFormModerator.reset();
    })
  }
  deleteFriend(x:any){
    this.appService.deleteFriend(HomeComponent.token,{username:HomeComponent.username,friend:x}).pipe().subscribe((data:any)=>{
      if(FriendsComponent.friends.indexOf(x)!=-1){
          FriendsComponent.friends.splice(FriendsComponent.friends.indexOf(x),1);
      }
      this.toastr.warning(x+" is not your friend!","FRIEND REMOVED");
    })
  }
  get friendsOnline(){
    let friendsOnline:any[]=[];
    try {
      FriendsComponent.users.forEach((x: string) => {
        FriendsComponent.friends.forEach((y:string) =>{
            if(x===y){
              
              friendsOnline.push(x);
            }
        });
      });
      return friendsOnline;
    } catch (error) {
      return undefined;
    }
    
  }
  sendFriendsRequest(x:any){
    this.socket.sendFriendRequest({username:HomeComponent.username,friend:x});
  }
  sendMatchRequest(x:any){
    this.socket.sendMatchRequest({opponent:HomeComponent.username,username:x});
  }
  get usersNotFriends(){
    let usersNotFriends:any[]=[];
    let flag=false;
    try{
      FriendsComponent.users.forEach((x: string) => {
        flag=false;
        FriendsComponent.friends.forEach((y:string) =>{
            if(x===y){
              flag=true;
            }
        });
        if(flag==false){
          usersNotFriends.push(x);
        }
      });
      return usersNotFriends;
    }catch(err){
      return FriendsComponent.users;
    }
  }
  @HostListener('unloaded')
  ngOnDestroy() {
    FriendsComponent.friends = [];
    FriendsComponent.users = [];
    this.subs.forEach(value => value.unsubscribe());
    
  }
  

}
