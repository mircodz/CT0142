import {Injectable} from "@angular/core";
import {HttpClient, HttpHeaders} from "@angular/common/http";

type RoleType =
  "user" |
  "admin" |
  "user+admin" |
  "admin+user"

@Injectable({
    providedIn: "root"
})
export class AppService {
    // TODO update service and fetch JWT from local storage, avoiding polluting method signatures
    // TODO type all parameters and return types

    // TODO read address from configuration file
    static address = "http://localhost:6969";

    constructor(private http: HttpClient) {
    }

    static getBoolean(value: any) {
        switch (value) {
        case true:
        case "true":
        case 1:
        case "1":
        case "on":
        case "yes":
            return true;
        default:
            return false;
        }
    }

    private static getOptions(token: string) {
        return {
            headers: new HttpHeaders({
                "authorization": "Bearer " + token,
                "cache-control": "no-cache",
                "Content-Type": "application/json"
            })
        };
    }

    register(user: any) {
        return this.http.post(AppService.address + "/signup", user).pipe();
    }

    login(user: any) {
        return this.http.post(AppService.address + "/signin", user).pipe();
    }

    friends(jwt: string) {
      return this.http.get(AppService.address + "/friend", AppService.getOptions(jwt)).pipe();
    }

    addFriends(jwt: string, friend: any) {
        return this.http.put(AppService.address + `/friend/${friend}`, {}, AppService.getOptions(jwt)).pipe();
    }

    deleteFriend(jwt: string, friend: string) {
        return this.http.delete(AppService.address + `/friend/${friend}`, AppService.getOptions(jwt)).pipe();
    }

    getUsers(jwt: string, role: RoleType) {
        return this.http.get(AppService.address + `/users?role=${role}`, AppService.getOptions(jwt)).pipe();
    }

    chat(jwt: string, data: any) {
        return this.http.post(AppService.address + "/chat", data, AppService.getOptions(jwt));
    }

    readChat(jwt: string, data: any) {
        return this.http.post(AppService.address + "/readChat", data, AppService.getOptions(jwt)).pipe();
    }

    getChat(jwt: string, data: any) {
        return this.http.post(AppService.address + "/getChat", data, AppService.getOptions(jwt));
    }

    // TODO refactor endpoint
    getModerators(jwt: string) {
        return this.http.get(AppService.address + "/moderators", AppService.getOptions(jwt));
    }

    getMatches(jwt: string) {
        return this.http.get(AppService.address + "/matches", AppService.getOptions(jwt));
    }

    getMatchId(jwt: string, data: any) {
        return this.http.post(AppService.address + "/matchId", data, AppService.getOptions(jwt));
    }

    // TODO refactor endpoint
    getHistorical(jwt: string, data: any) {
        return this.http.post(AppService.address + "/history", data, AppService.getOptions(jwt)).pipe();
    }

    logout(jwt: string, data: any) {
        return this.http.post(AppService.address + "/logout", data, AppService.getOptions(jwt)).pipe();
    }

    firstLogin(jwt: string, data: any) {
        return this.http.post(AppService.address + "/firstLogin", data, AppService.getOptions(jwt));
    }

    deleteUser(jwt: string, username: string) {
        return this.http.delete(AppService.address + `/user/${username}`, AppService.getOptions(jwt)).pipe();
    }

    addModerator(jwt: string, data: any) {
        return this.http.put(AppService.address + "/moderator", data, AppService.getOptions(jwt)).pipe();
    }
}
