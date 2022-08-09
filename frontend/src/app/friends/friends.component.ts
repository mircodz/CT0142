import { Component, HostListener, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { AppService } from '../app.service';
import { HomeComponent } from '../home/home.component';
import { WebsocketService } from '../websocket.service';

@Component({
  selector: 'app-friends',
  templateUrl: './friends.component.html',
  styleUrls: ['./friends.component.css']
})
export class FriendsComponent implements OnInit {

  users:any =[];
  friends:any=[] ;
  constructor(private appService:AppService,private socket:WebsocketService) { }

  ngOnInit(): void {
    this.appService.allUsers(HomeComponent.token).pipe().subscribe((data)=>{
      this.users = JSON.parse(JSON.stringify(data));
      this.users = Object.keys(this.users.users);
    })
  
  
    this.appService.friends(HomeComponent.token,{username:HomeComponent.username}).pipe().subscribe((data)=>{
      this.friends = JSON.parse(JSON.stringify(data));
    })
  
  
    this.socket.listenUpdateFriends().subscribe((data:any)=>{
      this.friends = JSON.parse(JSON.stringify(data));
    })
  
  
    this.socket.listenUpdateUsers().subscribe((data:any)=>{
      this.users=Object.keys(data);;
    })
    
  }
  get friendsOnline(){
    let friendsOnline:any[]=[];
    try {
      this.users.forEach((x: string) => {
        this.friends.forEach((y:any) =>{
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
      this.users.forEach((x: string) => {
        flag=false;
        this.friends.forEach((y:any) =>{
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
      return this.users;
    }
  }
  @HostListener('unloaded')
  ngOnDestroy() {
    this.friends = [];
    this.users = [];
    
  }
  

}
