import {Component, OnInit} from "@angular/core";
import {Subscription} from "rxjs";
import { AppService } from "../app.service";
import { HomeComponent } from "../home/home.component";

import {Router} from "@angular/router";

@Component({
    selector: "app-game",
    templateUrl: "./game.component.html",
    styleUrls: ["./game.component.css"]
})
export class GameComponent implements OnInit {
    matches: any;
    visitor:boolean=false;
    constructor(private appService: AppService,private route: Router) {
    }

    ngOnInit(): void {
        this.appService.getMatches(HomeComponent.token).pipe().subscribe((data: any) => {
            this.matches = data.matches.filter((value: { boards: any; }) => value.boards.length==2);
        })
        
    }
    watchMatch(x:string){
        HomeComponent.gameId=x;
        sessionStorage.setItem("gameId", x);
        this.route.navigate(["/watchGame"]);
    }
    showMatches(){
        this.appService.getMatches(HomeComponent.token).pipe().subscribe((data: any) => {
            console.log(data.matches[0].boards.length);
            console.log(data.matches[0].boards)
            this.matches = data.matches.filter((value: {
                players: any; boards: any; }) => value.boards[value.players[0]] &&  value.boards[value.players[1]] );
        })
        this.visitor = !this.visitor;
    }

}
