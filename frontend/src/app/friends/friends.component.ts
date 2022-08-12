import { Component, HostListener, OnInit } from '@angular/core';
import { retry, Subscription } from 'rxjs';
import { AppService } from '../app.service';
import { HomeComponent } from '../home/home.component';
import { ToastrService } from 'ngx-toastr';
import { WebsocketService } from '../websocket.service';

@Component({
  selector: 'app-friends',
  templateUrl: './friends.component.html',
  styleUrls: ['./friends.component.css']
})
export class FriendsComponent implements OnInit {

  static users:any =[];
  static friends:any=[] ;
  constructor(private appService:AppService,private socket:WebsocketService,private toastr:ToastrService) { }

  ngOnInit(): void {
    this.appService.allUsers(HomeComponent.token).pipe().subscribe((data)=>{
      FriendsComponent.users = JSON.parse(JSON.stringify(data));
      FriendsComponent.users = Object.keys(FriendsComponent.users.users);
    })
  
  
    this.appService.friends(HomeComponent.token,{username:HomeComponent.username}).pipe().subscribe((data)=>{
      FriendsComponent.friends = JSON.parse(JSON.stringify(data));
    })
  
  
    this.socket.listenUpdateFriends().subscribe((data:any)=>{
      FriendsComponent.friends = JSON.parse(JSON.stringify(data));
    })
  
  
    this.socket.listenUpdateUsers().subscribe((data:any)=>{
      FriendsComponent.users=Object.keys(data);;
    })
    
  }
  get FriendsComponent(){
    return FriendsComponent;
  }
  deleteFriend(x:any){
    this.appService.deleteFriend(HomeComponent.token,{username:HomeComponent.username,friend:x}).pipe().subscribe((data:any)=>{
      this.toastr.warning(x+" is not your friend!","FRIEND REMOVED");
    })
  }
  get friendsOnline(){
    let friendsOnline:any[]=[];
    try {
      FriendsComponent.users.forEach((x: string) => {
        FriendsComponent.friends.forEach((y:any) =>{
            if(x===y.username){
              
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
        FriendsComponent.friends.forEach((y:any) =>{
            if(x===y.username){
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
    
  }
  

}
