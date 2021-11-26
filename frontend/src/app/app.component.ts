import { Component, OnInit, OnDestroy } from '@angular/core';

import { ChatService } from './chat.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'c4';

  constructor(private chatService: ChatService) { }

  ngOnInit() {
    this.chatService.sendMessage('porcodio')
  }

  ngOnDestroy() {
  }
}
