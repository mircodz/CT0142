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
    // TODO this should probably go into the Angular store
    static users: string[] = [];
    static friends: any[] = [];

    friendsInfo: any[] = [];
    subs: Subscription[] = [];
    friendStats: any;

    constructor(private appService: AppService, private socket: WebsocketService, private toastr: ToastrService, private elementRef: ElementRef, private chatService: ChatService) {
    }

    ngOnInit(): void {
        
    }

    get FriendsComponent() {
        return FriendsComponent;
    }

    get HomeComponent() {
        return HomeComponent;
    }

    setFriendStats(username: string) {
      this.friendStats = FriendsComponent.friends.filter(value => value.username == username)[0];
     
    }

    deleteFriend(username: string) {
        this.appService.deleteFriend(HomeComponent.token, username).subscribe((data: any) => {
            const index = FriendsComponent.friends.map(f => f.username).indexOf(username);
            if (index != -1) {
                FriendsComponent.friends.splice(index, 1);
            }

            this.toastr.warning(username + " is not your friend anymore!", "Friend Removed");
        });
    }

    // Currently friend requests are not asynchronous, for a friend request to be accepted, the recipient must be online. There is also no way to attach messages to the request.
    // TODO model pending friend requests in data store, modal for attachment
    sendFriendsRequest(username: string) {
        this.socket.sendFriendRequest({username: HomeComponent.username, friend: username});
    }

    sendMatchRequest(username: string) {
        this.socket.sendMatchRequest({opponent: HomeComponent.username, username: username});
    }

    get usersNotFriends() {
      return FriendsComponent.users
            .filter((f: any) => FriendsComponent.friends.map(u => u.username).indexOf(f) == -1);
    }

    @HostListener("unloaded")
    ngOnDestroy() {
        this.subs.forEach(value => value.unsubscribe());
    }
}
