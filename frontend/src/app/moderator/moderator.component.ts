import {AfterContentChecked, Component, ElementRef, HostListener, OnDestroy, OnInit, ViewChild} from "@angular/core";
import {FormControl, FormGroup, Validators} from "@angular/forms";
import {Router} from "@angular/router";
import {faKey, faUser} from "@fortawesome/free-solid-svg-icons";
import {ToastrService} from "ngx-toastr";
import {Subscription} from "rxjs";
import {AppComponent} from "../app.component";
import {AppService} from "../app.service";
import {ChatService} from "../chat.service";
import {HomeComponent} from "../home/home.component";
import {WebsocketService} from "../websocket.service";

@Component({
    selector: "app-moderator",
    templateUrl: "./moderator.component.html",
    styleUrls: ["./moderator.component.css"]
})
export class ModeratorComponent implements OnInit, AfterContentChecked, OnDestroy {
    static isFirstLogin: boolean = AppService.getBoolean(sessionStorage.getItem("isFirstLogin"));
    users: any;
    user: any;
    player = "";
    subs: Subscription[] = [];
    messages: any[] = [];

    @ViewChild("chatWithPlayers")
        divToScroll!: ElementRef;

    msgForm = new FormGroup({
        msg: new FormControl("", Validators.required),
    });

    moderatorForm = new FormGroup({
        name: new FormControl("", Validators.required),
        email: new FormControl("", Validators.required),
        password: new FormControl("", Validators.required)
    });

    addModeratorForm = new FormGroup({
        username: new FormControl("", Validators.required),
        password: new FormControl("", Validators.required)
    });

    faKey = faKey;
    faUser = faUser;

    constructor(private appService: AppService,
                private chatService: ChatService,
                private socket: WebsocketService,
                private route: Router,
                private toaster: ToastrService) {
    }

    ngAfterContentChecked(): void {
        try {
            this.divToScroll.nativeElement.scrollTop = this.divToScroll.nativeElement.scrollHeight;
        } catch (error) {
            console.log(error);
        }
    }

    ngOnInit(): void {
        this.appService.getUsers(HomeComponent.token, 'user+admin').subscribe((data: any) => {
            this.users = data.users;
        });

        this.subs.push(
            this.chatService.listenPrivateMessage().subscribe((data: any) => {
                if (data.username == this.player) {
                    this.messages.push({
                        message: data.msg,
                        from: data.username,
                        to: HomeComponent.username,
                        timestamp: new Date(data.timestamp + "").toTimeString().substring(0, 5),
                        new: false
                    });
                } else {
                    this.toaster.info("You have received new message from " + data.username, "NEW MESSAGE!");
                }
                this.appService.readChat(HomeComponent.token, {username: HomeComponent.username});
            })
        );
    }

    chat(x: any) {
        this.player = x;
        this.appService.getChat(HomeComponent.token, {
            username: HomeComponent.username,
            friend: x
        }).pipe().subscribe((data: any) => {
            this.messages = data.messages;
            this.messages.forEach(value => {
                const time = new Date(value.timestamp);
                const now = new Date();

                if (now.getDate() != time.getDate() || now.getMonth() != time.getMonth()) {
                    value.timestamp = time.getDate() + "/" + time.getMonth();
                } else {
                    value.timestamp = time.toTimeString().substring(0, 5);
                }
            });
        });
    }

    sendMessage() {
        this.appService.chat(HomeComponent.token, {
            username: HomeComponent.username,
            friend: this.player,
            msg: this.msgForm.get("msg")?.value
        }).pipe().subscribe((data: any) => {
            this.messages.push({
                message: this.msgForm.get("msg")?.value,
                from: HomeComponent.username,
                to: this.player,
                timestamp: new Date().toTimeString().substring(0, 5)
            });
            this.msgForm.reset();
        });
    }

    onSubmit() {
        const password = this.moderatorForm.get("password")?.value;
        const name =  this.moderatorForm.get("name")?.value;
        const email =  this.moderatorForm.get("email")?.value;

        if (password != "" && name != "" && email != "") {
            this.appService
                .firstLogin(HomeComponent.token, {
                    username: HomeComponent.username,
                    password, name, email,
                }).pipe().subscribe((data) => {
                    ModeratorComponent.isFirstLogin = false;
                    sessionStorage.setItem("isFirstLogin", ModeratorComponent.isFirstLogin + "");
                });
        }
    }

    onSubmitAddModerator() {
        const username = this.addModeratorForm.get("username")?.value;
        const password = this.addModeratorForm.get("password")?.value;

        if (username != "" && password != "") {
            this.appService.addModerator(HomeComponent.token, {
                moderator: HomeComponent.username,
                username: username,
                password: password,
            });
        }
    }

    removeUser(username: string) {
        this.appService.deleteUser(HomeComponent.token, {
            moderator: HomeComponent.username,
            username: username
        }).pipe().subscribe((data: any) => {
            this.toaster.success("You deleted user " + username + "!", "User deleted!");
            this.users = data.users;
        });
    }

    get ModeratorComponent() {
        return ModeratorComponent;
    }

  @HostListener("unloaded")
    ngOnDestroy() {
        HomeComponent.token = "";
        AppComponent.logged = false;
        sessionStorage.setItem("logged", "false");
        this.subs.forEach(value => value.unsubscribe());
    }

  logout() {
      this.appService.logout(HomeComponent.token, {username: HomeComponent.username}).subscribe(() => {
          sessionStorage.clear();
          this.route.navigate(["/", "login"]);
      });
  }

  userInfo(username: string) {
      this.users.forEach((u: any) => {
          if (u.username == username) {
              this.user = u;
          }
      });
  }
}
