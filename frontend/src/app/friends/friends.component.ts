import {Component, ElementRef, HostListener, OnDestroy, OnInit} from "@angular/core";
import {Subscription} from "rxjs";
import {AppService} from "../app.service";
import {HomeComponent} from "../home/home.component";
import {ToastrService} from "ngx-toastr";
import {WebsocketService} from "../websocket.service";
import {ChatService} from "../chat.service";

@Component({
    selector: "app-friends",
    templateUrl: "./friends.component.html",
    styleUrls: ["./friends.component.css"]
})
export class FriendsComponent implements OnInit, OnDestroy {

    static users: any = [];


    static friends: string[] = [];
    friendsInfo: any[] = [];

    subs: Subscription[] = [];

    friendStats: any;


    constructor(private appService: AppService, private socket: WebsocketService, private toastr: ToastrService, private elementRef: ElementRef, private chatService: ChatService) {
    }


    ngOnInit(): void {

        this.appService.allUsers(HomeComponent.token).pipe().subscribe((data) => {
            FriendsComponent.users = JSON.parse(JSON.stringify(data));
            FriendsComponent.users = Object.keys(FriendsComponent.users.users);
        });


        this.appService.friends(HomeComponent.token, {username: HomeComponent.username}).pipe().subscribe((data: any) => {
            console.log("AMICI");
            this.friendsInfo = data;
            console.log(data);
            FriendsComponent.friends = [];
            data.forEach((element: any) => {
                FriendsComponent.friends.push(element.username);
            });
            console.log("FUNZIA");

        });


    }

    friendsStats(x: any) {

        this.friendStats = this.friendsInfo.filter(value => value.username == x)[0];
    }

    get FriendsComponent() {
        return FriendsComponent;
    }

    get Date() {
        return Date;
    }

    get HomeComponent() {
        return HomeComponent;
    }


    deleteFriend(x: any) {
        this.appService.deleteFriend(HomeComponent.token, {
            username: HomeComponent.username,
            friend: x
        }).pipe().subscribe((data: any) => {
            if (FriendsComponent.friends.indexOf(x) != -1) {
                FriendsComponent.friends.splice(FriendsComponent.friends.indexOf(x), 1);
            }
            this.toastr.warning(x + " is not your friend!", "FRIEND REMOVED");
        });
    }

    get friendsOnline() {
        const friendsOnline: any[] = [];
        try {
            FriendsComponent.users.forEach((x: string) => {
                FriendsComponent.friends.forEach((y: string) => {
                    if (x === y) {

                        friendsOnline.push(x);
                    }
                });
            });
            return friendsOnline;
        } catch (error) {
            return undefined;
        }

    }

    sendFriendsRequest(x: any) {
        this.socket.sendFriendRequest({username: HomeComponent.username, friend: x});
    }

    sendMatchRequest(x: any) {
        this.socket.sendMatchRequest({opponent: HomeComponent.username, username: x});
    }

    get usersNotFriends() {
        const usersNotFriends: any[] = [];
        let flag = false;
        try {
            FriendsComponent.users.forEach((x: string) => {
                flag = false;
                FriendsComponent.friends.forEach((y: string) => {
                    if (x === y) {
                        flag = true;
                    }
                });
                if (flag == false) {
                    usersNotFriends.push(x);
                }
            });
            return usersNotFriends;
        } catch (err) {
            return FriendsComponent.users;
        }
    }

  @HostListener("unloaded")
    ngOnDestroy() {
        this.subs.forEach(value => value.unsubscribe());

    }


}
