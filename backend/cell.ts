export class Cell {
    used: boolean= false;
    value: string ="";
    status: string="";
    constructor(values: Object = {}){
        Object.assign(this, values);
    }
}