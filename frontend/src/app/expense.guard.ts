import {Injectable} from "@angular/core";
import {ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot, UrlTree} from "@angular/router";
import {AppComponent} from "./app.component";

@Injectable({
    providedIn: "root"
})
export class ExpenseGuard implements CanActivate {
    constructor(private router: Router) {
    }

    canActivate(
        route: ActivatedRouteSnapshot,
        state: RouterStateSnapshot): boolean | UrlTree {
        if (AppComponent.logged && !AppComponent.isModerator) {
            if (state.url == "/login" || state.url == "/moderator" || state.url == "/home") {
                return this.router.parseUrl("/home/main");
            } else {
                return true;
            }
        } else if (AppComponent.logged && AppComponent.isModerator) {
            if (state.url != "/moderator") {
                return this.router.parseUrl("/moderator");
            } else {
                return true;
            }
        } else {
            return this.router.parseUrl("/login");
        }
    }

}
