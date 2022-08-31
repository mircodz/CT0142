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

    constructor(private http: HttpClient) {
    }

    register(user: any) {
        return this.http.post(this.address + "/signup", user);
    }

    login(user: any) {
        return this.http.post(this.address +  "/signin", user);
    }

    getOptions(token: string) {
        return {
            headers: new HttpHeaders({
                authorization: "Bearer " + token,
                "cache-control": "no-cache",
                "Content-Type": "application/json"
            })
        };
    }

    addFriends(jwt: string, user: any) {
        return this.http.post(this.address + "/addFriends", user, this.getOptions(jwt));
    }

    friends(jwt: string, user: any) {
        return this.http.post(this.address + "/friend", user, this.getOptions(jwt));
    }

    getAllUsers(jwt: string, data: any) {
        return this.http.post(this.address + "/getAllUsers", data, this.getOptions(jwt));
    }

    deleteFriend(jwt: string, data: any) {
        return this.http.post(this.address + "/deleteFriend", data, this.getOptions(jwt));
    }

    allUsers(jwt: string) {
        return this.http.get(this.address + "/allUsers", this.getOptions(jwt));
    }

    chat(jwt: string, data: any) {
        return this.http.post(this.address+ "/chat", data, this.getOptions(jwt));
    }

    readChat(jwt: string, data: any) {
        return this.http.post(this.address +"/readChat", data, this.getOptions(jwt));
    }

    getChat(jwt: string, data: any) {
        return this.http.post(this.address + "/getChat", data, this.getOptions(jwt));
    }

    getModerators(jwt: string) {
        return this.http.get(this.address+"/getModerators", this.getOptions(jwt));
    }

    getMatches(jwt: string) {
        return this.http.get(this.address+"/matches", this.getOptions(jwt));
    }

    getMatchId(jwt: string, data: any) {
        return this.http.post(this.address+"/matchId", data, this.getOptions(jwt));
    }

    getHistorical(jwt: string, data: any) {
        return this.http.post(this.address+"/getHistoricalMatches", data, this.getOptions(jwt));
    }

    logout(jwt: string, data: any) {
        return this.http.post(this.address+"/logout", data, this.getOptions(jwt));
    }

    firstLogin(jwt: string, data: any) {
        return this.http.post(this.address+"/firstLogin", data, this.getOptions(jwt));
    }

    deleteUser(jwt: string, data: any) {
        return this.http.post(this.address+"/deleteUser", data, this.getOptions(jwt));
    }

    addModerator(jwt: string, data: any) {
        return this.http.post(this.address+"/addModerator", data, this.getOptions(jwt));
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
