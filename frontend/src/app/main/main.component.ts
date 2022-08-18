import { Component, OnInit } from '@angular/core';
import { AppService } from '../app.service';
import { HomeComponent } from '../home/home.component';

@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.css']
})
export class MainComponent implements OnInit {
  historical:any;
  constructor(private appService:AppService) { }
  get HomeComponent(){
    return HomeComponent;
  }
  ngOnInit(): void {
    this.appService.getHistorical(HomeComponent.token,{username:HomeComponent.username}).pipe().subscribe((data:any)=>{
      console.log("RICEVO LA LISTA")
      this.historical = data.sub;
    });
    
  }

}
