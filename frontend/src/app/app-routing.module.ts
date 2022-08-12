import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { BattleshipGameComponent } from './battleship-game/battleship-game.component';
import { ExpenseGuard } from './expense.guard';
import { FriendsComponent } from './friends/friends.component';
import { GameComponent } from './game/game.component';
import { HomeComponent } from './home/home.component';
import { LoginComponent } from './login/login.component';
import { MainComponent } from './main/main.component';
import { ModeratorComponent } from './moderator/moderator.component';

import { RegisterComponent } from './register/register.component';
import { WatchGameComponent } from './watch-game/watch-game.component';

const routes: Routes = [
  {path:'login',component:LoginComponent},
{path:'register',component:RegisterComponent},
{path:'playGame',component:BattleshipGameComponent,canActivate: [ExpenseGuard]},
{path:'moderator',component:ModeratorComponent,canActivate: [ExpenseGuard]},
{path:'watchGame',component:WatchGameComponent,canActivate: [ExpenseGuard]},
{path:'home',component:HomeComponent,canActivate: [ExpenseGuard],children:[
  {path:'main',component:MainComponent,canActivate: [ExpenseGuard]},
  {path:'friends',component:FriendsComponent,canActivate: [ExpenseGuard]},
  {path:'game',component:GameComponent,canActivate: [ExpenseGuard]},
]},
{path: '', redirectTo: '/login', pathMatch: 'full'},
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
