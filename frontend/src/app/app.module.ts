import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ToastrModule } from 'ngx-toastr';
import { SocketIoModule, SocketIoConfig } from 'ngx-socket-io';
import { BattleshipGameComponent } from './battleship-game/battleship-game.component';
import { environment } from 'src/environments/environment';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { LoginComponent } from './login/login.component';
import { RegisterComponent } from './register/register.component';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { HomeComponent } from './home/home.component';
import { ConfirmationDialogComponent } from './confirmation-dialog/confirmation-dialog.component';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { WatchGameComponent } from './watch-game/watch-game.component';
import { ModeratorComponent } from './moderator/moderator.component';
import { FriendsComponent } from './friends/friends.component';
import { RouterModule } from '@angular/router';
import { HashLocationStrategy, LocationStrategy } from '@angular/common';
import { GameComponent } from './game/game.component';
import { MainComponent } from './main/main.component';
let localhost:any='localhost';
const config: SocketIoConfig = {
	url: 'http://'+ localhost+':6969',// socket server url;
	options: {}
}


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
    MainComponent
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
export class AppModule { }
