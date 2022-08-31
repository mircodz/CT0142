import {Cell} from "./cell";
import {Player} from "./player";

export class Board {
    player: Player = new Player();
    tiles: Cell[][] = [];

    constructor(values: Object = {}) {
        Object.assign(this, values);
    }
}