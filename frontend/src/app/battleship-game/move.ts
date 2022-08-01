import { Board } from "./board";
import { Foo } from "./foo";

export class Move {
   
    score: number = 0;
    canPlay: boolean = false;
    boards: Foo = {};
    gameId:number=0;
    constructor(values: Object = {}){
        Object.assign(this, values);
    }
}