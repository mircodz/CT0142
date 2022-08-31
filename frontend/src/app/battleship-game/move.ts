import {Foo} from "./foo";

export class Move {
    score = 0;
    canPlay = false;
    boards: Foo = {};
    gameId = 0;

    constructor(values: Object = {}) {
        Object.assign(this, values);
    }
}
