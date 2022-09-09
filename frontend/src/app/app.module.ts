import {BrowserAnimationsModule} from "@angular/platform-browser/animations";
import {BrowserModule} from "@angular/platform-browser";
import {FormsModule, ReactiveFormsModule} from "@angular/forms";
import {HashLocationStrategy, LocationStrategy} from "@angular/common";
import {HttpClientModule} from "@angular/common/http";
import {NgModule} from "@angular/core";

import {FontAwesomeModule} from "@fortawesome/angular-fontawesome";

import {NgbModule} from "@ng-bootstrap/ng-bootstrap";

import {SocketIoConfig, SocketIoModule} from "ngx-socket-io";
import {ToastrModule} from "ngx-toastr";

import {AppRoutingModule} from "./app-routing.module";
import {AppComponent} from "./app.component";
import {BattleshipGameComponent} from "./battleship-game/battleship-game.component";
import {LoginComponent} from "./login/login.component";
import {RegisterComponent} from "./register/register.component";
import {HomeComponent} from "./home/home.component";
import {ConfirmationDialogComponent} from "./confirmation-dialog/confirmation-dialog.component";
import {WatchGameComponent} from "./watch-game/watch-game.component";
import {ModeratorComponent} from "./moderator/moderator.component";
import {FriendsComponent} from "./friends/friends.component";
import {GameComponent} from "./game/game.component";
import {MainComponent} from "./main/main.component";
import {ChatComponent} from "./chat/chat.component";

const config: SocketIoConfig = {
    url: "http://localhost:6969",
    options: {}
};

@NgModule({
    declarations: [
        AppComponent,
        BattleshipGameComponent,
        LoginComponent,
        RegisterComponent,
        HomeComponent,
        ConfirmationDialogComponent,
        WatchGameComponent,
        ModeratorComponent,
        FriendsComponent,
        GameComponent,
        MainComponent,
        ChatComponent
    ],
    imports: [
        BrowserModule,
        AppRoutingModule,
        FormsModule,
        HttpClientModule,
        SocketIoModule.forRoot(config),
        ToastrModule.forRoot(),
        BrowserAnimationsModule,
        FontAwesomeModule,
        ReactiveFormsModule,
        NgbModule
    ],
    providers: [{provide: LocationStrategy, useClass: HashLocationStrategy}],
    bootstrap: [AppComponent]
})
export class AppModule {
}
