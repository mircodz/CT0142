import { Component, OnInit } from '@angular/core';
import { AppService } from '../app.service';
import { HomeComponent } from '../home/home.component';
@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css']
})
export class ChatComponent implements OnInit {

  constructor(private appService:AppService) { }

  ngOnInit(): void {
    this.appService.chat(HomeComponent.token,{username:HomeComponent.username,friend:"filippo"}).pipe().subscribe((data:any)=>{
      console.log(data);
    });
  
  }

}
