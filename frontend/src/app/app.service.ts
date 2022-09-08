import {Injectable} from "@angular/core";
import {HttpClient, HttpHeaders} from "@angular/common/http";

@Injectable({
    providedIn: "root"
})
export class AppService {
    // TODO update service and fetch JWT from local storage, avoiding polluting method signatures
    // TODO type all parameters and return types
    // TODO return callback function instead of having to call `.pipe.stream` each time

    address = "http://localhost:6969";

    private static getOptions(token: string) {
        return {
            headers: new HttpHeaders({
                authorization: "Bearer " + token,
                "cache-control": "no-cache",
                "Content-Type": "application/json"
            })
        };
    }

    constructor(private http: HttpClient) {
    }

    register(user: any) {
        return this.http.post(this.address + "/signup", user).pipe();
    }

    login(user: any) {
        return this.http.post(this.address +  "/signin", user).pipe();
    }

    addFriends(jwt: string, user: any) {
        return this.http.post(this.address + "/addFriends", user, AppService.getOptions(jwt));
    }

    friends(jwt: string, user: any) {
        return this.http.post(this.address + "/friend", user, AppService.getOptions(jwt));
    }

    getAllUsers(jwt: string, data: any) {
        return this.http.post(this.address + "/getAllUsers", data, AppService.getOptions(jwt)).pipe();
    }

    deleteFriend(jwt: string, data: any) {
        return this.http.post(this.address + "/deleteFriend", data, AppService.getOptions(jwt));
    }

    allUsers(jwt: string) {
        return this.http.get(this.address + "/allUsers", AppService.getOptions(jwt));
    }

    chat(jwt: string, data: any) {
        return this.http.post(this.address+ "/chat", data, AppService.getOptions(jwt));
    }

    readChat(jwt: string, data: any) {
        return this.http.post(this.address +"/readChat", data, AppService.getOptions(jwt)).pipe();
    }

    getChat(jwt: string, data: any) {
        return this.http.post(this.address + "/getChat", data, AppService.getOptions(jwt));
    }

    getModerators(jwt: string) {
        return this.http.get(this.address+"/getModerators", AppService.getOptions(jwt));
    }

    getMatches(jwt: string) {
        return this.http.get(this.address+"/matches", AppService.getOptions(jwt));
    }

    getMatchId(jwt: string, data: any) {
        return this.http.post(this.address+"/matchId", data, AppService.getOptions(jwt));
    }

    getHistorical(jwt: string, data: any) {
        return this.http.post(this.address+"/history", data, AppService.getOptions(jwt)).pipe();
    }

    logout(jwt: string, data: any) {
        return this.http.post(this.address+"/logout", data, AppService.getOptions(jwt)).pipe();
    }

    firstLogin(jwt: string, data: any) {
        return this.http.post(this.address+"/firstLogin", data, AppService.getOptions(jwt));
    }

    deleteUser(jwt: string, data: any) {
        return this.http.post(this.address+"/deleteUser", data, AppService.getOptions(jwt));
    }

    addModerator(jwt: string, data: any) {
        return this.http.post(this.address+"/addModerator", data, AppService.getOptions(jwt)).pipe();
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
}
