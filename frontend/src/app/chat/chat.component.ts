import {AfterViewChecked, Component, ElementRef, HostListener, OnDestroy, OnInit, ViewChild} from "@angular/core";
import {FormControl, FormGroup, Validators} from "@angular/forms";
import {Subscription} from "rxjs";
import {AppService} from "../app.service";
import {ChatService} from "../chat.service";
import {FriendsComponent} from "../friends/friends.component";
import {HomeComponent} from "../home/home.component";

@Component({
    selector: "app-chat",
    templateUrl: "./chat.component.html",
    styleUrls: ["./chat.component.css"]
})
export class ChatComponent implements OnInit, AfterViewChecked, OnDestroy {
    msgForm = new FormGroup({
        msg: new FormControl("", Validators.required),
    });
    msgFormModerator = new FormGroup({
        msg: new FormControl("", Validators.required),
    });
    subs: Subscription[] = [];
    moderator = "";
    messagesModerator: any[] = [];
    messages: any[] = [];
    moderators: any[] = [];
    friend = "";
  @ViewChild("chatWithFriends")
      divToScroll!: ElementRef;
  @ViewChild("chatWithModerators")
      divToScroll2!: ElementRef;

  constructor(private chatService: ChatService, private appService: AppService) {
  }

  get FriendsComponent() {
      return FriendsComponent;
  }

  ngAfterViewChecked(): void {
      try {
          this.divToScroll.nativeElement.scrollTop = this.divToScroll.nativeElement.scrollHeight;
          this.divToScroll2.nativeElement.scrollTop = this.divToScroll2.nativeElement.scrollHeight;
      } catch (error) {
          console.log(error);
      }
  }

  @HostListener("unloaded")
  ngOnDestroy(): void {
      this.subs.forEach(value => value.unsubscribe());
  }

  ngOnInit(): void {
      this.subs.push(
          this.chatService.listenPrivateMessage().subscribe((data: any) => {
              if (this.moderator == data.username) {
                  this.messagesModerator.push({
                      message: data.msg,
                      from: data.username,
                      to: HomeComponent.username,
                      timestamp: new Date(data.timestamp + "").toTimeString().substring(0, 5),
                      new: false
                  });
              } else if (this.friend == data.username) {
                  this.messages.push({
                      message: data.msg,
                      from: data.username,
                      to: HomeComponent.username,
                      timestamp: new Date(data.timestamp + "").toTimeString().substring(0, 5),
                      new: false
                  });
              }
              this.appService.readChat(HomeComponent.token, {username: HomeComponent.username});
          })
      );

      this.appService.getModerators(HomeComponent.token).pipe().subscribe((data: any) => {
          this.moderators = data.sub;
      });

      this.appService.friends(HomeComponent.token, {username: HomeComponent.username}).pipe().subscribe((data: any) => {
          FriendsComponent.friends = [];
          data.forEach((element: any) => {
              FriendsComponent.friends.push(element.username);
          });
      });
  }

  chat(x: string) {
      console.log("Il valore è:");
      console.log(x);
      this.appService.getChat(HomeComponent.token, {
          username: HomeComponent.username,
          friend: x
      }).pipe().subscribe((data: any) => {
          console.log(data);
          if (this.moderators.filter(value => value.username == x)[0]) {
              this.moderator = x;
              this.messagesModerator = data.messages;
              this.messagesModerator.forEach(value => {
                  const time = new Date(value.timestamp);
                  const now = new Date();
                  if (now.getDate() != time.getDate() || now.getMonth() != time.getMonth()) {
                      value.timestamp = time.getDate() + "/" + time.getMonth();
                  } else {
                      value.timestamp = time.toTimeString().substring(0, 5);
                  }
              });
          } else if (FriendsComponent.friends.filter(value => value == x)[0]) {
              this.friend = x;
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
          } else if (x == "-") {
              this.friend = "";
              this.messages = [];
          } else if (x == "--") {
              this.moderator = "";
              this.messagesModerator = [];
          }
      });
  }

  sendMessage() {
      this.appService.chat(HomeComponent.token, {
          username: HomeComponent.username,
          friend: this.friend,
          msg: this.msgForm.get("msg")?.value
      }).pipe().subscribe((data: any) => {
          this.messages.push({
              message: this.msgForm.get("msg")?.value,
              from: HomeComponent.username,
              to: this.friend,
              timestamp: new Date().toTimeString().substring(0, 5)
          });
          this.msgForm.reset();
      });
  }

  sendMessageModerator() {
      this.appService.chat(HomeComponent.token, {
          username: HomeComponent.username,
          friend: this.moderator,
          msg: this.msgFormModerator.get("msg")?.value
      }).pipe().subscribe((data: any) => {
          this.messagesModerator.push({
              message: this.msgFormModerator.get("msg")?.value,
              from: HomeComponent.username,
              to: this.moderator,
              timestamp: new Date().toTimeString().substring(0, 5)
          });
          this.msgFormModerator.reset();
      });
  }
}
