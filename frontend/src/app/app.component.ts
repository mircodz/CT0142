import {Component, OnInit} from "@angular/core";
import {ActivatedRoute} from "@angular/router";
import {AppService} from "./app.service";
import {HomeComponent} from "./home/home.component";
import {WebsocketService} from "./websocket.service";

@Component({
    selector: "app-root",
    templateUrl: "./app.component.html",
    styleUrls: ["./app.component.css"]
})
export class AppComponent implements OnInit {
    static logged: boolean = AppService.getBoolean(sessionStorage.getItem("logged")) || false;
    static isModerator: boolean = AppService.getBoolean(sessionStorage.getItem("isModerator")) || false;
    static title = "battleship";

    constructor(private route: ActivatedRoute, private socket: WebsocketService) {
    }

    get logged() {
        return AppComponent.logged;
    }

    get AppComponent() {
        return AppComponent;
    }

    ngOnInit(): void {
        if (this.logged) {
            this.socket.login({username: HomeComponent.username});
        }
    }
}
