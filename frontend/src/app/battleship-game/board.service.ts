import { BOOL_TYPE } from '@angular/compiler/src/output/output_ast';
import { HostListener, Injectable, OnDestroy } from '@angular/core';
import { AppComponent } from '../app.component';
import { HomeComponent } from '../home/home.component';
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
  index_checked:string[]=[];
  boards: Foo = (JSON.parse(sessionStorage.getItem("boards")+"")!=null) ? JSON.parse(sessionStorage.getItem("boards")+"") : {};
  constructor() { }
  createBoard(size: number = 10,player:string): BoardService{
    let tiles:Cell[][] = [];
    let ships:number[]=[5,4,4,3,3,3,2,2,2,2,2];
    for(let i = 0;i<size;i++){
      tiles[i]=[];
      for(let j=0;j<size;j++){
        tiles[i][j] =new Cell({used: false, value: "", status:""});
    
      }
    }
    for (let i=0; i< ships.length;i++){
			let result = this.randomShips(tiles, size, ships[i]);
      if(this.checkIfEqual(result,tiles)){
        return this.createBoard(10,player);
      }else{
        tiles=result;
      }
		}
    let board = new Board ({
      player: new Player({name: player}),
      tiles: tiles
    });
    this.boards[player] = board;
    sessionStorage.setItem("boards",JSON.stringify(this.boards));
    return this;
  }
  createBoardManually(size: number = 10,player:string): BoardService{
    let tiles:Cell[][] = [];
    let ships:number[]=[5,4,4,3,3,3,2,2,2,2,2];
    for(let i = 0;i<size;i++){
      tiles[i]=[];
      for(let j=0;j<size;j++){
        tiles[i][j] =new Cell({used: false, value: "", status:""});
    
      }
    }
    for(let i = 0;i<size;i++){
      for(let j=0;j<size;j++){
        if(this.canSetShip(2,tiles,i,j)==1  || this.canSetShip(2,tiles,i,j)==2){
          tiles[i][j].canPut=true;
        }else{
          tiles[i][j].canPut=false;
        }
    
      }
    }
    let board = new Board ({
      player: new Player({name: player}),
      tiles: tiles
    });
    this.boards[player] = board;
    sessionStorage.setItem("boards",JSON.stringify(this.boards));
    return this;
  }
  randomShips(tiles2: Cell[][], len:number,ship:number): Cell[][]{
		len = len -1;
    let tiles = this.copyOf(tiles2);
		let ranRow:number = this.getRandomInt(0, len), ranCol:number = this.getRandomInt(0, len);
    if(this.index_checked.length>=99){
      this.index_checked=[];
      return tiles;
    }
    while(this.index_checked.includes(ranRow+" "+ranCol)){
      ranRow = this.getRandomInt(0, len);
      ranCol = this.getRandomInt(0, len);
    }
    
    this.index_checked.push(ranRow+" "+ranCol);
		if(this.canSetShip(ship,tiles,ranRow,ranCol)==-1){
			return this.randomShips(tiles, len+1,ship);
		}else if (this.canSetShip(ship,tiles,ranRow,ranCol)==0){
    
      let i=0;
			while(i<ship){
        tiles[ranRow+i][ranCol].value = "X";
        i++;
      }
     
      
    
      
			return tiles;
		}else if (this.canSetShip(ship,tiles,ranRow,ranCol)==1){
      let i=0;
			while(i<ship){
        tiles[ranRow][ranCol+i].value = "X";
        i++;
      }
      
			return tiles;
		}else{
      if(this.getRandomInt(0,1)){
        let i=0;
			  while(i<ship){
          tiles[ranRow][ranCol+i].value = "X";
          i++;
        }
      }else{
        let i=0;
			  while(i<ship){
          tiles[ranRow+i][ranCol].value = "X";
          i++;
        }
      }
    
      return tiles;
    }
	}
  canSetShip(x:number,tiles: Cell[][],r:number,c:number):number{
   
    if(r+x-1<this.BOARD_SIZE || c+x-1<this.BOARD_SIZE){
      let i=0;
      if(r+x-1<this.BOARD_SIZE && c+x-1>=this.BOARD_SIZE){
        while(i<x){
          if(tiles[r+i][c].value == "X" || !this.checkIndex(r+i,c,tiles)){
            return -1;
          }
          i++;
        }
        return 0;
      }else if(r+x-1>=this.BOARD_SIZE && c+x-1<this.BOARD_SIZE){
        while(i<x){
          if(tiles[r][c+i].value == "X" || !this.checkIndex(r,c+i,tiles)){
           return -1;
          }
         i++;
        }
        return 1;
      }else{
        let flag1=false;
        let flag2=false;
        while(i<x){
          if(tiles[r+i][c].value == "X" || !this.checkIndex(r+i,c,tiles)){
           flag1=true;
          }
         i++;
        }
        i=0;
        while(i<x){
          if(tiles[r][c+i].value == "X"|| !this.checkIndex(r,c+i,tiles)){
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
  checkIndex(r:number,c:number,tiles: Cell[][]){
    
    if(r==0 || c==0){
      
      if(r==0 && c!=0 && c<this.BOARD_SIZE-1){
        if((tiles[r+1][c].value!='X') && (tiles[r][c+1].value!='X') && (tiles[r][c-1].value!='X') && (tiles[r+1][c-1].value!='X')&& (tiles[r+1][c+1].value!='X')){
          return true;
        }else{
          return false;
        }
      }else if(c==0 && r!=0 && r<this.BOARD_SIZE-1){
        if((tiles[r+1][c].value!='X') && (tiles[r][c+1].value!='X') && (tiles[r-1][c].value!='X') && (tiles[r-1][c+1].value!='X')&& (tiles[r+1][c+1].value!='X')){
          return true;
        }else{
          return false;
        }
      }else if(c==0 && r==this.BOARD_SIZE-1){
        if((tiles[r][c+1].value!='X') && (tiles[r-1][c].value!='X') && (tiles[r-1][c+1].value!='X')){
          return true;
        }else{
          return false;
        }
      }else if(r==0 && c==this.BOARD_SIZE-1){
        if((tiles[r+1][c].value!='X') && (tiles[r][c-1].value!='X') && (tiles[r+1][c-1].value!='X')){
          return true;
        }else{
          return false;
        }
      }else{
        
        if((tiles[r+1][c].value!='X') && (tiles[r][c+1].value!='X') && (tiles[r+1][c+1].value!='X')){
          return true;
        }else{
          return false;
        }
      }
    }else if(r==this.BOARD_SIZE-1 && c<this.BOARD_SIZE-1){
      if((tiles[r-1][c].value!='X') && (tiles[r][c-1].value!='X') && (tiles[r-1][c-1].value!='X')&& (tiles[r-1][c+1].value!='X')&& (tiles[r][c+1].value!='X')){
        return true;
      }else{
        return false;
      }
    }else if(c==this.BOARD_SIZE-1 && r<this.BOARD_SIZE-1){
      if((tiles[r-1][c].value!='X') && (tiles[r][c-1].value!='X') && (tiles[r-1][c-1].value!='X')&& (tiles[r+1][c-1].value!='X')&& (tiles[r+1][c].value!='X')){
        return true;
      }else{
        return false;
      }
    }else if(r==this.BOARD_SIZE-1 && c==this.BOARD_SIZE-1){ 
      if((tiles[r-1][c].value!='X') && (tiles[r][c-1].value!='X') && (tiles[r-1][c-1].value!='X')){   
        return true;
      }else{
        return false;
      }
    }else{
      if((tiles[r+1][c].value!='X') && (tiles[r][c+1].value!='X') && (tiles[r][c-1].value!='X') && (tiles[r+1][c-1].value!='X')&& (tiles[r+1][c+1].value!='X')&& (tiles[r-1][c-1].value!='X')&& (tiles[r-1][c].value!='X')&& (tiles[r-1][c+1].value!='X')){
        return true;
      }else{
        return false;
      }
    }
  }
	getRandomInt(min:number, max:number){
		return Math.floor(Math.random()*(max-min +1))+min;
	}
  checkIfEqual(tiles1:Cell[][],tiles2:Cell[][]){
    for(let i = 0;i<this.BOARD_SIZE;i++){
      for(let j=0;j<this.BOARD_SIZE;j++){
        if(tiles1[i][j].value!=tiles2[i][j].value){
            return false;
        }
    
      }
    }
    return true;
  }
  copyOf(tiles1:Cell[][]){
    let tiles2:Cell[][]=[];
    
    for(let i = 0;i<this.BOARD_SIZE;i++){
      tiles2[i]=[];
      for(let j=0;j<this.BOARD_SIZE;j++){
        tiles2[i][j]=new Cell({value:tiles1[i][j].value,status:tiles1[i][j].status,used:tiles1[i][j].used});
    
      }
    }
    return tiles2;
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
    this.index_checked=[];
    
  }
}
