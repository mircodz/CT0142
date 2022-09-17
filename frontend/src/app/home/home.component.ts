import {Component, OnDestroy, OnInit} from "@angular/core";
import {FormControl, FormGroup, Validators} from "@angular/forms";
import {Router} from "@angular/router";
import {ToastrService} from "ngx-toastr";
import {Subscription} from "rxjs";
import {AppComponent} from "../app.component";
import {AppService} from "../app.service";
import {BattleshipGameComponent} from "../battleship-game/battleship-game.component";
import {ChatService} from "../chat.service";
import {ConfirmationDialogService} from "../confirmation-dialog/confirmation-dialog.service";
import {FriendsComponent} from "../friends/friends.component";
import {WebsocketService} from "../websocket.service";

import {faShip} from "@fortawesome/free-solid-svg-icons";

@Component({
    selector: "app-home",
    templateUrl: "./home.component.html",
    styleUrls: ["./home.component.css"]
})
export class HomeComponent implements OnInit, OnDestroy {
    static token: any = sessionStorage.getItem("token");
    static gameId: any = sessionStorage.getItem("gameId");
    static gameAsVisitor: boolean = AppService.getBoolean(sessionStorage.getItem("gameAsVisitor"));
    static username: any = sessionStorage.getItem("username");
    subs: Subscription[] = [];
    friendForm = new FormGroup({
        friend: new FormControl("", Validators.required)
    });

    faShip = faShip;

    constructor(private chatService: ChatService, private appService: AppService, private socket: WebsocketService, private confirmationDialogService: ConfirmationDialogService, private route: Router, private toastr: ToastrService) {

    }

    get AppComponent() {
        return AppComponent;
    }

    get HomeComponent() {
        return HomeComponent;
    }

    ngOnDestroy(): void {
        console.log("Sono entrato");
        this.subs.forEach(sub => sub.unsubscribe());

    }

    ngOnInit() {
        this.subs.push(
            this.chatService.listenPrivateMessage().subscribe((data: any) => {
                this.toastr.info("You have received new message from " + data.username, "NEW MESSAGE!");
            })
        );

        this.subs.push(
            this.socket.listenFriendRequest().pipe().subscribe((data: any) => {
                console.log("Ho ricevuto la richiesta");
                console.log(data);
                this.confirmationDialogService.confirm("Richiesta di amicizia da " + data.username, "Vuoi diventare mio amico?")
                    .then((confirmed) => {
                        if (confirmed) {
                            console.log(data.username);
                            if (FriendsComponent.friends == undefined) {
                              FriendsComponent.friends = [];
                            }
                            FriendsComponent.friends.push({username:data.username});
                            console.log("SI!");
                          console.log(HomeComponent.token);
                          this.appService.addFriends(HomeComponent.token, data.username)
                              .subscribe(() => {
                                console.log("Amicizia inserita");
                            });
                            this.socket.sendConfirmFriend({friend: data.username, username: HomeComponent.username, confirmed: true});
                        } else {
                            this.socket.sendConfirmFriend({
                                friend: data.username,
                                username: HomeComponent.username,
                                confirmed: false
                            });
                        }
                    });
            }));

        this.subs.push(
            this.socket.matchConfirm().pipe().subscribe((data: any) => {
                console.log("GUARDA COSA E' ARRIVATO AMICO");
                console.log(data);
                if (data.confirmed) {
                    this.toastr.success(data.username + " has accepted your game request!", "GAME REQUEST ACCEPTED!");
                    BattleshipGameComponent.isFriendly = true;
                    BattleshipGameComponent.isInvited = true;
                    sessionStorage.setItem("isFriendly", true + "");
                    this.route.navigate(["/playGame"]);
                } else {
                    this.toastr.error(data.username + " has rejected your game request!", "GAME REQUEST REJECTED!");
                }

            }));

        this.subs.push(
            this.socket.friendConfirm().pipe().subscribe((data: any) => {
                if (data.confirmed) {
                    FriendsComponent.friends.push(data.username);
                    this.toastr.success(data.username + " has accepted your friend request!", "FRIEND REQUEST ACCEPTED!");
                } else {
                    this.toastr.error(data.username + " has rejected your friend request!", "FRIEND REQUEST REJECTED!");
                }

            }));

        this.subs.push(
            this.socket.listenMatchRequest().pipe().subscribe((data: any) => {

                this.confirmationDialogService.confirm("Richiesta di partita da " + data.opponent, "Vuoi fare una partita?")
                    .then((confirmed) => {
                        if (confirmed) {
                            console.log("SI!");
                            this.socket.sendConfirmMatch({friend: data.opponent, username: data.username, confirmed: true});
                            BattleshipGameComponent.isFriendly = true;
                            BattleshipGameComponent.opponent = data.opponent;
                            sessionStorage.setItem("isFriendly", true + "");
                            this.route.navigate(["/playGame"]);
                        } else {
                            this.socket.sendConfirmMatch({friend: data.opponent, username: data.username, confirmed: false});
                        }

                    });

            }));

        this.subs.push(
            this.socket.listenFriendRemoved().pipe().subscribe((data: any) => {
                if (FriendsComponent.friends.indexOf(data.friend) != -1) {
                    FriendsComponent.friends.splice(FriendsComponent.friends.indexOf(data.friend), 1);
                }

                this.toastr.warning(data.friend + " is not your friend!", "FRIEND REMOVED");
            }));

        this.subs.push(
            this.socket.listenUpdateFriends().subscribe((data: any) => {
                FriendsComponent.friends = JSON.parse(JSON.stringify(data));
            }));

        this.subs.push(
            this.socket.listenUpdateUsers().subscribe((data: any) => {
                FriendsComponent.users = Object.keys(data);
            }));
    }

    logout() {
        this.appService.logout(HomeComponent.token, {username: HomeComponent.username}).subscribe(() => {
            AppComponent.logged = false;
            sessionStorage.setItem("logged", false + "");
            sessionStorage.clear();
            console.log("Stampa la sessione del gioco dopo i logout : ");
            console.log(JSON.parse(sessionStorage.getItem("boards") + ""));
            this.route.navigate(["/", "login"]);
        });

    }

}
