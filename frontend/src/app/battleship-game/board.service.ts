import {HostListener, Injectable, OnDestroy} from "@angular/core";
import {Board} from "./board";
import {Cell} from "./cell";
import {Foo} from "./foo";
import {Player} from "./player";

@Injectable({
    providedIn: "root"
})

export class BoardService implements OnDestroy {
    private static BOARD_SIZE = 10;

    player = "";
    index_checked: string[] = [];
    boards: Foo = (JSON.parse(sessionStorage.getItem("boards") + "") != null) ? JSON.parse(sessionStorage.getItem("boards") + "") : {};

    constructor() {
    }

    createBoard(size = 10, player: string): BoardService {
        let tiles: Cell[][] = [];
        const ships: number[] = [5, 4, 4, 3, 3, 3, 2, 2, 2, 2, 2];

        for (let i = 0; i < size; i++) {
            tiles[i] = [];
            for (let j = 0; j < size; j++) {
                tiles[i][j] = new Cell({used: false, value: "", status: ""});
            }
        }

        for (let i = 0; i < ships.length; i++) {
            const result = this.randomShips(tiles, size, ships[i]);
            if (BoardService.checkIfEqual(result, tiles)) {
                return this.createBoard(10, player);
            } else {
                tiles = result;
            }
        }

        this.boards[player] = new Board({
            player: new Player({name: player}),
            tiles: tiles
        });

        sessionStorage.setItem("boards", JSON.stringify(this.boards));
        return this;
    }

    createBoardManually(size = 10, player: string): BoardService {
        const tiles: Cell[][] = [];
        for (let i = 0; i < size; i++) {
            tiles[i] = [];
            for (let j = 0; j < size; j++) {
                tiles[i][j] = new Cell({used: false, value: "", status: ""});
            }
        }

        for (let i = 0; i < size; i++) {
            for (let j = 0; j < size; j++) {
                tiles[i][j].canPut = this.canSetShip(2, tiles, i, j) == 0 || this.canSetShip(2, tiles, i, j) == 2;
            }
        }

        this.boards[player] = new Board({
            player: new Player({name: player}),
            tiles: tiles
        });

        sessionStorage.setItem("boards", JSON.stringify(this.boards));
        return this;
    }

    randomShips(tiles2: Cell[][], len: number, ship: number): Cell[][] {
        len = len - 1;
        const tiles = BoardService.copyOf(tiles2);
        let ranRow: number = BoardService.getRandomInt(0, len);
        let ranCol: number = BoardService.getRandomInt(0, len);

        if (this.index_checked.length >= 99) {
            this.index_checked = [];
            return tiles;
        }

        while (this.index_checked.includes(ranRow + " " + ranCol)) {
            ranRow = BoardService.getRandomInt(0, len);
            ranCol = BoardService.getRandomInt(0, len);
        }

        this.index_checked.push(ranRow + " " + ranCol);
        if (this.canSetShip(ship, tiles, ranRow, ranCol) == -1) {
            return this.randomShips(tiles, len + 1, ship);
        } else if (this.canSetShip(ship, tiles, ranRow, ranCol) == 0) {
            let i = 0;
            while (i < ship) {
                tiles[ranRow + i][ranCol].value = "X";
                i++;
            }
            return tiles;
        } else if (this.canSetShip(ship, tiles, ranRow, ranCol) == 1) {
            let i = 0;
            while (i < ship) {
                tiles[ranRow][ranCol + i].value = "X";
                i++;
            }
            return tiles;
        } else {
            if (BoardService.getRandomInt(0, 1)) {
                let i = 0;
                while (i < ship) {
                    tiles[ranRow][ranCol + i].value = "X";
                    i++;
                }
            } else {
                let i = 0;
                while (i < ship) {
                    tiles[ranRow + i][ranCol].value = "X";
                    i++;
                }
            }
            return tiles;
        }
    }

    canSetShip(x: number, tiles: Cell[][], r: number, c: number): number {
        if (r + x - 1 < BoardService.BOARD_SIZE || c + x - 1 < BoardService.BOARD_SIZE) {
            let i = 0;
            if (r + x - 1 < BoardService.BOARD_SIZE && c + x - 1 >= BoardService.BOARD_SIZE) {
                while (i < x) {
                    if (tiles[r + i][c].value == "X" || !BoardService.checkIndex(r + i, c, tiles)) {
                        return -1;
                    }
                    i++;
                }
                return 0;
            } else if (r + x - 1 >= BoardService.BOARD_SIZE && c + x - 1 < BoardService.BOARD_SIZE) {
                while (i < x) {
                    if (tiles[r][c + i].value == "X" || !BoardService.checkIndex(r, c + i, tiles)) {
                        return -1;
                    }
                    i++;
                }
                return 1;
            } else {
                let flag1 = false;
                let flag2 = false;
                while (i < x) {
                    if (tiles[r + i][c].value == "X" || !BoardService.checkIndex(r + i, c, tiles)) {
                        flag1 = true;
                    }
                    i++;
                }
                i = 0;
                while (i < x) {
                    if (tiles[r][c + i].value == "X" || !BoardService.checkIndex(r, c + i, tiles)) {
                        flag2 = true;
                    }
                    i++;
                }
                if (flag1 && flag2) {
                    return -1;
                } else if (!flag1 && !flag2) {
                    return 2;
                } else if (!flag1) {
                    return 0;
                } else {
                    return 1;
                }
            }
        } else {
            return -1;
        }
    }

    private static checkIndex(r: number, c: number, tiles: Cell[][]) {
        if (r == 0 || c == 0) {
            if (r == 0 && c != 0 && c < BoardService.BOARD_SIZE - 1) {
                return (tiles[r + 1][c].value != "X") && (tiles[r][c + 1].value != "X") && (tiles[r][c - 1].value != "X") && (tiles[r + 1][c - 1].value != "X") && (tiles[r + 1][c + 1].value != "X");
            } else if (c == 0 && r != 0 && r < BoardService.BOARD_SIZE - 1) {
                return (tiles[r + 1][c].value != "X") && (tiles[r][c + 1].value != "X") && (tiles[r - 1][c].value != "X") && (tiles[r - 1][c + 1].value != "X") && (tiles[r + 1][c + 1].value != "X");
            } else if (c == 0 && r == BoardService.BOARD_SIZE - 1) {
                return (tiles[r][c + 1].value != "X") && (tiles[r - 1][c].value != "X") && (tiles[r - 1][c + 1].value != "X");
            } else if (r == 0 && c == BoardService.BOARD_SIZE - 1) {
                return (tiles[r + 1][c].value != "X") && (tiles[r][c - 1].value != "X") && (tiles[r + 1][c - 1].value != "X");
            } else {
                return (tiles[r + 1][c].value != "X") && (tiles[r][c + 1].value != "X") && (tiles[r + 1][c + 1].value != "X");
            }
        } else if (r == BoardService.BOARD_SIZE - 1 && c < BoardService.BOARD_SIZE - 1) {
            return (tiles[r - 1][c].value != "X") && (tiles[r][c - 1].value != "X") && (tiles[r - 1][c - 1].value != "X") && (tiles[r - 1][c + 1].value != "X") && (tiles[r][c + 1].value != "X");
        } else if (c == BoardService.BOARD_SIZE - 1 && r < BoardService.BOARD_SIZE - 1) {
            return (tiles[r - 1][c].value != "X") && (tiles[r][c - 1].value != "X") && (tiles[r - 1][c - 1].value != "X") && (tiles[r + 1][c - 1].value != "X") && (tiles[r + 1][c].value != "X");
        } else if (r == BoardService.BOARD_SIZE - 1 && c == BoardService.BOARD_SIZE - 1) {
            return (tiles[r - 1][c].value != "X") && (tiles[r][c - 1].value != "X") && (tiles[r - 1][c - 1].value != "X");
        } else {
            return (tiles[r + 1][c].value != "X") && (tiles[r][c + 1].value != "X") && (tiles[r][c - 1].value != "X") && (tiles[r + 1][c - 1].value != "X") && (tiles[r + 1][c + 1].value != "X") && (tiles[r - 1][c - 1].value != "X") && (tiles[r - 1][c].value != "X") && (tiles[r - 1][c + 1].value != "X");
        }
    }

    private static getRandomInt(min: number, max: number) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    private static checkIfEqual(tiles1: Cell[][], tiles2: Cell[][]) {
        for (let i = 0; i < BoardService.BOARD_SIZE; i++) {
            for (let j = 0; j < BoardService.BOARD_SIZE; j++) {
                if (tiles1[i][j].value != tiles2[i][j].value) {
                    return false;
                }
            }
        }
        return true;
    }

    private static copyOf(tiles1: Cell[][]) {
        const tiles2: Cell[][] = [];
        for (let i = 0; i < BoardService.BOARD_SIZE; i++) {
            tiles2[i] = [];
            for (let j = 0; j < BoardService.BOARD_SIZE; j++) {
                tiles2[i][j] = new Cell({value: tiles1[i][j].value, status: tiles1[i][j].status, used: tiles1[i][j].used});
            }
        }
        return tiles2;
    }

    getBoards(): Foo {
        return this.boards;
    }

    @HostListener("unloaded")
    ngOnDestroy() {
        console.log("Items destroyed board service");
        Object.keys(this.boards).forEach((x) =>
            delete this.boards[x]
        );
        this.index_checked = [];
    }
}
