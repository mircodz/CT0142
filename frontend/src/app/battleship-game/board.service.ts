import { HostListener, Injectable, OnDestroy } from '@angular/core';
import { AppComponent } from '../app.component';
import { Board } from './board';
import { Cell } from './cell';
import { Foo } from './foo';
import { Player } from './player';

@Injectable({
  providedIn: 'root'
})

export class BoardService implements OnDestroy {
  
  player: string = "";
  boards: Foo = (JSON.parse(sessionStorage.getItem("boards")+"")!=null) ? JSON.parse(sessionStorage.getItem("boards")+"") : {};
  constructor() { }
  createBoard(size: number = 5,player:string): BoardService{
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
      player: new Player({name: player}),
      tiles: tiles
    });
    this.boards[player] = board;
    sessionStorage.setItem("boards",JSON.stringify(this.boards));
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
	getBoards(): Foo{
		return this.boards;
	}
  @HostListener('unloaded')
  ngOnDestroy() {
    console.log('Items destroyed');
    Object.keys(this.boards).forEach((x)=>
      delete this.boards[x]
    );
    
    
  }
}
