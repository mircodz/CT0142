export class Cell {
    used = false;
    value = "";
    status = "";

    // eslint-disable-next-line @typescript-eslint/ban-types
    constructor(values: Object = {}) {
        Object.assign(this, values);
    }
}