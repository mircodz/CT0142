export class Player {
    id: number = 1;
    score: number = 0;

    constructor(values: Object = {}){
        Object.assign(this, values);
    }
}
