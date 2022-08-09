import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';
import { AppComponent } from './app.component';
import { HomeComponent } from './home/home.component';

@Injectable({
  providedIn: 'root'
})
export class ExpenseGuard implements CanActivate {
  constructor(private router: Router){}
  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): boolean | UrlTree {
    if(AppComponent.logged==true && AppComponent.isModerator==false){
      
      if(state.url=="/login" || state.url=="/moderator"){
        return this.router.parseUrl("/home/main");
      }else{
        return true;
      }

    }else if(AppComponent.logged==true && AppComponent.isModerator==true){
      if(state.url!="/moderator"){
        return this.router.parseUrl("/moderator");
      }else{
        return true;
      }

    }else{
      return this.router.parseUrl("/login");
    }
  }
  
}
