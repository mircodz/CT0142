import { Injectable } from '@angular/core';
import { Board } from './board';
import { Cell } from './cell';
import { Player } from './player';

@Injectable({
  providedIn: 'root'
})
export class BoardService {
  
  playerId: number = 0;
  boards: Board[] = [];
  constructor() { }
  createBoard(size: number = 5): BoardService{
    let tiles:Cell[][] = [];
    for(let i = 0;i<size;i++){
      tiles[i]=[];
      for(let j=0;j<size;j++){
        tiles[i][j] =new Cell({used: false, value: "", status:""});
    
      }
    }
    for (let i=0; i< size *2;i++){
			tiles = this.randomShips(tiles, size);
		}
    let board = new Board ({
      player: new Player({id: this.playerId++}),
      tiles: tiles
    });
    this.boards.push(board);
    return this;
  }
  randomShips(tiles: Cell[][], len:number): Cell[][]{
		len = len -1;
		let ranRow:number = this.getRandomInt(0, len), ranCol:number = this.getRandomInt(0, len);
		if(tiles[ranRow][ranCol].value == "X"){
			return this.randomShips(tiles, len);
		}else{
			tiles[ranRow][ranCol].value = "X";
			return tiles;
		}
	}
	getRandomInt(min:number, max:number){
		return Math.floor(Math.random()*(max-min +1))+min;
	}
	getBoards(): Board[]{
		return this.boards;
	}
}
