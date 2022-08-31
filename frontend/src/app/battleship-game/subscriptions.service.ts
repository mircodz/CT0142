import {Injectable} from "@angular/core";
import {Subscription} from "rxjs";

@Injectable({
    providedIn: "root"
})
export class SubscriptionsService {
    static subscriptions:Subscription[]=[];
    constructor() { }

    static dispose(){
        SubscriptionsService.subscriptions.forEach(subscription =>subscription.unsubscribe());
        SubscriptionsService.subscriptions=[];
    }
}
