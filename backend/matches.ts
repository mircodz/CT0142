import {Foo} from "./foo"
export class Match {
    members: number= 0;
    id: string ="";
    whoPlay: string ="";
    players:string[]=[];
    boards:Foo={}
    i: number=0;
    visitor:number=0;
    constructor(values: Object = {}){
        Object.assign(this, values);
    }
}