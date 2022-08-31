import {Foo} from "./foo";

export class match {
    members = 0;
    id = "";
    whoPlay = "";
    players: string[] = [];
    boards: Foo = {};
    i = 0;
    visitor = 0;

    // eslint-disable-next-line @typescript-eslint/ban-types
    constructor(values: Object = {}) {
        Object.assign(this, values);
    }
}