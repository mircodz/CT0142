export class Player {
    name: string = "";
    score: number = 0;

    constructor(values: Object = {}){
        Object.assign(this, values);
    }
}
