import { BOOL_TYPE } from '@angular/compiler/src/output/output_ast';
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
  BOARD_SIZE: number = 10;

  player: string = "";
  boards: Foo = (JSON.parse(sessionStorage.getItem("boards")+"")!=null) ? JSON.parse(sessionStorage.getItem("boards")+"") : {};
  constructor() { }
  createBoard(size: number = 5,player:string): BoardService{
    let tiles:Cell[][] = [];
    let ships:number[]=[2,2,2,2,2,3,3,3,4,4,5];
    for(let i = 0;i<size;i++){
      tiles[i]=[];
      for(let j=0;j<size;j++){
        tiles[i][j] =new Cell({used: false, value: "", status:""});
    
      }
    }
    for (let i=0; i< ships.length;i++){
			tiles = this.randomShips(tiles, size, ships[i]);
		}
    let board = new Board ({
      player: new Player({name: player}),
      tiles: tiles
    });
    this.boards[player] = board;
    sessionStorage.setItem("boards",JSON.stringify(this.boards));
    return this;
  }
  randomShips(tiles: Cell[][], len:number,ship:number): Cell[][]{
		len = len -1;
		let ranRow:number = this.getRandomInt(0, len), ranCol:number = this.getRandomInt(0, len);
		if(tiles[ranRow][ranCol].value == "X"){
			return this.randomShips(tiles, len,ship);
		}else{
			tiles[ranRow][ranCol].value = "X";
			return tiles;
		}
	}
  canSetShip(x:number,tiles: Cell[][],r:number,c:number):number{
    
    if(r+x-1<=this.BOARD_SIZE || c+x-1<=this.BOARD_SIZE){
      let i=0;
      if(r+x-1<=this.BOARD_SIZE && c+x-1>this.BOARD_SIZE){
        while(i<x-1){
          if(tiles[r+i][c].value == "X"){
            return -1;
          }
          i++;
        }
        return 0;
      }else if(r+x-1>this.BOARD_SIZE && c+x-1<=this.BOARD_SIZE){
        while(i<x-1){
          if(tiles[r][c+i].value == "X"){
           return -1;
          }
         i++;
        }
        return 1;
      }else{
        let flag1=false;
        let flag2=false;
        while(i<x-1){
          if(tiles[r+i][c].value == "X"){
           flag1=true;
          }
         i++;
        }
        i=0;
        while(i<x-1){
          if(tiles[r+i][c+i].value == "X"){
           flag2=true;
          }
         i++;
        }
        if(flag1 && flag2){
          return -1;
        }else if(!flag1 && !flag2){
          return 2;
        }else if(!flag1){
          return 0;
        }else{
          return 1;
        }
      }
    }else{
      return -1;
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
