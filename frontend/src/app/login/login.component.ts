import {Component, Injectable, OnInit} from "@angular/core";
import {FormControl, FormGroup, Validators} from "@angular/forms";
import {Router} from "@angular/router";

import {faKey, faUser} from "@fortawesome/free-solid-svg-icons";

import {ToastrService} from "ngx-toastr";

import {AppComponent} from "../app.component";
import {AppService} from "../app.service";
import {HomeComponent} from "../home/home.component";
import {ModeratorComponent} from "../moderator/moderator.component";
import {WebsocketService} from "../websocket.service";

@Component({
    selector: "app-login",
    templateUrl: "./login.component.html",
    styleUrls: ["./login.component.css"]
})
@Injectable({providedIn: "root"})
export class LoginComponent implements OnInit {
    loginForm = new FormGroup({
        username: new FormControl("", Validators.required),
        password: new FormControl("", Validators.required)
    });

    faUser = faUser;
    faKey = faKey;

    constructor(private appService: AppService,
                private socket: WebsocketService,
                private route: Router,
                private toaster: ToastrService) {
    }

    ngOnInit(): void {
    }

    onSubmit() {
        const username = this.loginForm.get("username")?.value;
        const password = this.loginForm.get("password")?.value;

        HomeComponent.username = this.loginForm.get("username")?.value;

        if (username != "" && password != "") {
            this.appService.login({username, password}).subscribe((response: any) => {
                HomeComponent.token = JSON.parse(JSON.stringify(response)).token;
                sessionStorage.setItem("token", JSON.parse(JSON.stringify(response)).token);

                // TODO create isModerator and isFirstLogin setters to avoid having to update the localStorage manually
                AppComponent.isModerator = response.user.isModerator;
                sessionStorage.setItem("isModerator", AppComponent.isModerator + "");
               
                this.socket.login({username: this.loginForm.get("username")?.value});
                
                ModeratorComponent.isFirstLogin = response.user.isFirstLogin;
                sessionStorage.setItem("isFirstLogin", ModeratorComponent.isFirstLogin + "");

                AppComponent.logged = true;
                sessionStorage.setItem("logged", "true");

                sessionStorage.setItem("username", response.user.username);

                if (response.newMessages) {
                    this.toaster.info("You have new messages!", "New Messages!");
                }

                this.route.navigate(["/", "home"]);
            }, error => {
                this.toaster.error("Invalid credentials");
            });
        }
    }
}
