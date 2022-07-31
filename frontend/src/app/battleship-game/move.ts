import { Board } from "./board";

export class Move {
   
    score: number = 0;
    canPlay: boolean = false;
    board: Board = new Board();
    gameId:number=0;
    constructor(values: Object = {}){
        Object.assign(this, values);
    }
}