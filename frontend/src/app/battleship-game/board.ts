import {Cell} from "./cell";
import {Player} from "./player";

export class Board {
    player: Player = new Player();
    tiles: Cell[][] = [];
    ships: number[] = [5, 4, 4, 3, 3, 3, 2, 2, 2, 2, 2];

    constructor(values: Object = {}) {
        Object.assign(this, values);
    }
}
