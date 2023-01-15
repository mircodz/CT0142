export class Player {
    name = "";
    score = 0;

    constructor(values: Object = {}){
        Object.assign(this, values);
    }
}
