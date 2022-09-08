import {AfterContentChecked, Component, ElementRef, HostListener, OnDestroy, OnInit, ViewChild} from "@angular/core";

import {ToastrService} from "ngx-toastr";

import {Board} from "./board";
import {BoardService} from "./board.service";

import {Move} from "./move";

import {WebsocketService} from "../websocket.service";
import {Foo} from "./foo";
import {AppService} from "../app.service";
import {HomeComponent} from "../home/home.component";
import {ChatService} from "../chat.service";
import {faPaperPlane} from "@fortawesome/free-solid-svg-icons";
import {FormControl, FormGroup, Validators} from "@angular/forms";
import {SubscriptionsService} from "./subscriptions.service";
import {Router} from "@angular/router";

// set game constants
const NUM_PLAYERS = 2;
const BOARD_SIZE = 10;
const SCORE_LIMIT = 32;

@Component({
    selector: "app-battleship-game",
    templateUrl: "./battleship-game.component.html",
    styleUrls: ["./battleship-game.component.css"]
})


export class BattleshipGameComponent implements OnInit, OnDestroy, AfterContentChecked {
    static opponent: any = (sessionStorage.getItem("opponent")) ? sessionStorage.getItem("opponent") : "";
    static isFriendly: boolean = AppService.getBoolean(sessionStorage.getItem("isFriendly"));
    static isInvited = false;

    msgForm = new FormGroup({
        msg: new FormControl("", Validators.required),
    });

    canPlay: boolean = AppService.getBoolean(sessionStorage.getItem("canPlay"));
    ready: boolean = AppService.getBoolean(sessionStorage.getItem("ready"));
    manual: boolean = AppService.getBoolean(sessionStorage.getItem("manual"));
    started: boolean = AppService.getBoolean(sessionStorage.getItem("started"));
    connected: boolean = (sessionStorage.getItem("connected") != null) ? AppService.getBoolean(sessionStorage.getItem("connected")) : false;
    player: any = HomeComponent.username;
    players: number = (sessionStorage.getItem("players")) ? Number.parseInt(sessionStorage.getItem("players") + "") : 1;
    gameUrl: string = location.protocol + "//" + location.hostname + (location.port ? ":" + location.port : "");
    messages: any[] = (sessionStorage.getItem("messages") != null) ? JSON.parse(sessionStorage.getItem("messages") + "") : [];
    vertically = true;
    faPaper = faPaperPlane;
  @ViewChild("chatMatch")
      divToScroll!: ElementRef;

  constructor(private socket: WebsocketService, private boardService: BoardService, private toaster: ToastrService, private appService: AppService, private chatService: ChatService, private route: Router) {
  }

  get BattleshipGameComponent() {
      return BattleshipGameComponent;
  }

  get HomeComponent() {
      return HomeComponent;
  }

  get validPlayer(): boolean {
      return (this.players >= NUM_PLAYERS);
  }

  get winner(): Board | undefined {
      try {
          if (this.boards[this.player].player.score >= SCORE_LIMIT) {
              return this.boards[this.player];
          } else if (this.boards[BattleshipGameComponent.opponent].player.score >= SCORE_LIMIT) {
              return this.boards[BattleshipGameComponent.opponent];
          } else {
              return undefined;
          }
      } catch (error) {
          return undefined;
      }
  }

  get boards(): Foo {
      return this.boardService.getBoards();
  }

  ngAfterContentChecked(): void {
      try {
          this.divToScroll.nativeElement.scrollTop = this.divToScroll.nativeElement.scrollHeight;
      } catch (error) {
          console.log(error);
      }
  }

  initConnection(): BattleshipGameComponent {
      SubscriptionsService.subscriptions.push(
          this.socket.listenMembers().subscribe((data: any) => {
              if (data.members < this.players) {
                  this.boards[this.player].player.score = SCORE_LIMIT;
              } else {
                  this.players = data.members;
                  sessionStorage.setItem("players", this.players + "");
              }
              HomeComponent.gameId = data.gameId;
              sessionStorage.setItem("gameId", data.gameId + "");
          })
      );

      SubscriptionsService.subscriptions.push(
          this.chatService.listenMessage().subscribe((data: any) => {
              this.messages.push(data);
              sessionStorage.setItem("messages", JSON.stringify(this.messages));
          })
      );

      SubscriptionsService.subscriptions.push(
          this.socket.listenMoves().subscribe((data: any) => {
              this.canPlay = data.canPlay;
              this.boards[this.player] = data.boards[this.player];
              this.boards[BattleshipGameComponent.opponent] = data.boards[BattleshipGameComponent.opponent];
              sessionStorage.setItem("canPlay", this.canPlay + "");
              sessionStorage.setItem("boards", JSON.stringify(this.boards));
          })
      );

      SubscriptionsService.subscriptions.push(
          this.socket.listenQuit().subscribe((data: any) => {
              this.toaster.warning("Your opponent quit the Game", "Opponent quit!");
              this.route.navigate(["/home/game"]);
          })
      );

      return this;
  }

  sendBoard() {
      this.createBoards(HomeComponent.username);
      this.socket.sendBoard({
          board: this.boards[HomeComponent.username],
          username: HomeComponent.username,
          gameId: HomeComponent.gameId
      });

      this.ready = true;
      sessionStorage.setItem("ready", this.ready + "");
  }

  sendMyBoard() {
      this.socket.sendBoard({
          board: this.boards[HomeComponent.username],
          username: HomeComponent.username,
          gameId: HomeComponent.gameId
      });

      this.ready = true;
      sessionStorage.setItem("ready", this.ready + "");
  }

  isManual() {
      this.manual = true;
      sessionStorage.setItem("manual", this.manual + "");
  }

  fireTorpedo(e: any): BattleshipGameComponent | undefined {
      const id = e.target.id.split(";");
      const boardId = id[0];
      const row = Number.parseInt(id[1]);
      const col = Number.parseInt(id[2]);
      const tile = this.boards[boardId].tiles[row][col];

      if (!this.checkValidHit(boardId, tile)) {
          return;
      }

      if (tile.value == "X") {
          this.toaster.success("You got this.", "HURRAAA! YOU SANK A SHIP!");
          this.boards[boardId].tiles[row][col].status = "win";
          this.boards[this.player].player.score++;
      } else {
          this.toaster.info("Keep trying.", "OOPS! YOU MISSED THIS TIME");
          this.boards[boardId].tiles[row][col].status = "fail";
      }

      this.canPlay = false;
      sessionStorage.setItem("canPlay", this.canPlay + "");
      this.boards[boardId].tiles[row][col].used = true;
      sessionStorage.setItem("boards", JSON.stringify(this.boards));
      this.socket.emitMoves(new Move({
          canPlay: true,
          boards: this.boards,
          gameId: HomeComponent.gameId,
          opponent: BattleshipGameComponent.opponent
      }));

      return this;
  }

  getBoardService() {
      return this.boardService;
  }

  putShip(e: any, ship: any) {
      const id = e.target.id.split(";");
      const row = Number.parseInt(id[0]);
      const col = Number.parseInt(id[1]);

      if (!this.boards[HomeComponent.username].tiles[row][col].canPut) {
          this.toaster.error("You can't put here your ship.", "You can't put");
          return;
      }

      if (this.vertically) {
          let i = 0;
          while (i < ship) {
              this.boards[HomeComponent.username].tiles[row + i][col].value = "X";
              i++;
          }
      } else {
          let i = 0;
          while (i < ship) {
              this.boards[HomeComponent.username].tiles[row][col + i].value = "X";
              i++;
          }
      }

      this.boards[HomeComponent.username].ships.pop();

      if (!this.vertically) {
          for (let i = 0; i < 10; i++) {
              for (let j = 0; j < 10; j++) {
                  if (this.boardService.canSetShip(this.boards[HomeComponent.username].ships[this.boards[HomeComponent.username].ships.length - 1], this.boards[HomeComponent.username].tiles, i, j) == 1 || this.boardService.canSetShip(this.boards[HomeComponent.username].ships[this.boards[HomeComponent.username].ships.length - 1], this.boards[HomeComponent.username].tiles, i, j) == 2) {
                      this.boards[HomeComponent.username].tiles[i][j].canPut = true;
                  } else {
                      this.boards[HomeComponent.username].tiles[i][j].canPut = false;
                  }
              }
          }
      } else {
          for (let i = 0; i < 10; i++) {
              for (let j = 0; j < 10; j++) {
                  if (this.boardService.canSetShip(this.boards[HomeComponent.username].ships[this.boards[HomeComponent.username].ships.length - 1], this.boards[HomeComponent.username].tiles, i, j) == 0 || this.boardService.canSetShip(this.boards[HomeComponent.username].ships[this.boards[HomeComponent.username].ships.length - 1], this.boards[HomeComponent.username].tiles, i, j) == 2) {
                      this.boards[HomeComponent.username].tiles[i][j].canPut = true;
                  } else {
                      this.boards[HomeComponent.username].tiles[i][j].canPut = false;
                  }
              }
          }
      }

      return this;
  }

  mouseenter(r: any, c: any, ship: any) {
      if (this.vertically) {
          let i = 0;
          while (i < ship) {
              this.boards[HomeComponent.username].tiles[r + i][c].value = "X";
              i++;
          }
      } else {
          let i = 0;
          while (i < ship) {
              this.boards[HomeComponent.username].tiles[r][c + i].value = "X";
              i++;
          }
      }
  }

  mouseleave(r: any, c: any, ship: any) {
      if (this.vertically) {
          let i = 0;
          while (i < ship) {
              this.boards[HomeComponent.username].tiles[r + i][c].value = "";
              i++;
          }
      } else {
          let i = 0;
          while (i < ship) {
              this.boards[HomeComponent.username].tiles[r][c + i].value = "";
              i++;
          }
      }
  }

  canContinue() {
      for (let i = 0; i < 10; i++) {
          for (let j = 0; j < 10; j++) {
              if (this.boards[HomeComponent.username].tiles[i][j].canPut) {
                  return true;
              }
          }
      }

      return false;
  }

  checkValidHit(boardId: string, tile: any): boolean {
      if (boardId == this.player) {
          this.toaster.error("Don't commit suicide.", "You can't hit your own board.");
          return false;
      }

      if (this.winner) {
          this.toaster.error("Game is over");
          return false;
      }

      if (!this.canPlay) {
          this.toaster.error("A bit too eager.", "It's not your turn to play.");
          return false;
      }

      if (tile.used == true) {
          this.toaster.error("Don't waste your torpedos.", "You already shot here.");
          return false;
      }
      return true;
  }

  createBoards(player: string): BattleshipGameComponent {
      this.boardService.createBoard(BOARD_SIZE, player);
      return this;
  }

  async ngOnInit(): Promise<void> {
      if (!this.connected) {
          this.boardService.createBoardManually(10, HomeComponent.username);
      }

      SubscriptionsService.subscriptions.push(
          this.socket.getBoard().subscribe((data: any) => {
              // TODO again, we should abstract this away
              this.boards[data.username] = data.board;
              sessionStorage.setItem("boards", JSON.stringify(this.boards));
              BattleshipGameComponent.opponent = data.username;
              sessionStorage.setItem("opponent", data.username);
              this.canPlay = data.canPlay;
              sessionStorage.setItem("canPlay", data.canPlay);
              this.started = true;
              sessionStorage.setItem("started", this.started + "");
          })
      );

      this.initConnection();

      if (!this.connected) {
          if (BattleshipGameComponent.isFriendly) {
              if (BattleshipGameComponent.isInvited) {
                  await new Promise(f => setTimeout(f, 1000));
                  this.socket.friendlyMatch({player1: HomeComponent.username, player2: BattleshipGameComponent.opponent});
              } else {
                  this.socket.friendlyMatch({player1: HomeComponent.username, player2: BattleshipGameComponent.opponent});
              }
          } else {
              this.socket.connection({username: HomeComponent.username});
          }
          this.connected = true;
          sessionStorage.setItem("connected", this.connected + "");
      }
  }

  getKeys(): string[] {
      return Object.keys(this.boards);
  }

  quitGame() {
      this.socket.disconnect({username: HomeComponent.username, gameId: HomeComponent.gameId});
      this.route.navigate(["/home/game"]);
  }

  @HostListener("unloaded")
  ngOnDestroy() {
      this.canPlay = true;
      this.player = HomeComponent.username;
      BattleshipGameComponent.opponent = "";
      this.players = 1;
      this.connected = false;
      this.messages = [];
      this.started = false;
      this.ready = false;
      this.manual = false;
      HomeComponent.gameId = "";
      SubscriptionsService.dispose();
      BattleshipGameComponent.isFriendly = false;
      BattleshipGameComponent.isInvited = false;
      this.boardService.ngOnDestroy();

      ["canPlay", "connected", "boards", "players", "opponent", "isFriendly", "ready", "started", "manual"]
          .map((value)=>sessionStorage.removeItem(value));
  }

  sendMessage() {
      this.chatService.sendMessage(this.msgForm.get("msg")?.value, this.player, BattleshipGameComponent.opponent, HomeComponent.gameId);

      this.messages.push({
          from: HomeComponent.username,
          to: BattleshipGameComponent.opponent,
          message: this.msgForm.get("msg")?.value
      });

      sessionStorage.setItem("messages", JSON.stringify(this.messages));
      this.msgForm.reset();
  }

  counter(i: number) {
      return new Array(i);
  }

  rotate() {
      this.vertically = !this.vertically;

      for (let i = 0; i < 10; i++) {
          for (let j = 0; j < 10; j++) {
              this.boards[HomeComponent.username].tiles[i][j].canPut =
                  this.boardService.canSetShip(
                      this.boards[HomeComponent.username].ships[this.boards[HomeComponent.username].ships.length - 1],
                      this.boards[HomeComponent.username].tiles, i, j) == (this.vertically ? 0 : 1) ||
                  this.boardService.canSetShip(
                      this.boards[HomeComponent.username].ships[this.boards[HomeComponent.username].ships.length - 1],
                      this.boards[HomeComponent.username].tiles, i, j) == 2;
          }
      }
  }
}
