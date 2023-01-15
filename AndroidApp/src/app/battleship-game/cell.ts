export class Cell {
    used = false;
    value = "";
    status = "";
    canPut = true;

    constructor(values: Object = {}) {
        Object.assign(this, values);
    }
}
