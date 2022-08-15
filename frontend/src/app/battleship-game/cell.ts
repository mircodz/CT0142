export class Cell {
    used: boolean= false;
    value: string ="";
    status: string="";
    canPut:boolean=true;
    constructor(values: Object = {}){
        Object.assign(this, values);
    }
}