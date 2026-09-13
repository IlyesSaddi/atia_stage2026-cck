import { Component, ViewChild, ElementRef, AfterViewChecked, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatbotService } from '../services/chatbot';

interface Message {
  id: number;
  role: 'user' | 'bot';
  content: string;
}

@Component({
  selector: 'app-chatbot',
   standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chatbot.html',
  styleUrls: ['./chatbot.css']
})
export class Chatbot implements AfterViewChecked {

  @ViewChild('scrollContainer') private scrollContainer!: ElementRef;

  chatOpen = false;
  userInput = '';
  isLoading = false;
  private msgIdCounter = 0;

  messages: Message[] = [
    {
      id: this.msgIdCounter++,
      role: 'bot',
      content: "Bonjour ! 👋 Comment puis-je vous aider aujourd'hui ?"
    }
  ];

  constructor(
    private chatbotService: ChatbotService,
    private cdr: ChangeDetectorRef
  ) {}

  ngAfterViewChecked(): void {
    this.scrollToBottom();
  }

sendMessage(): void {
  console.log('hi');
  const text = this.userInput.trim();
  if (!text || this.isLoading) return;


  this.messages = [
    ...this.messages,
    { id: this.msgIdCounter++, role: 'user', content: text }
  ];

  this.userInput = '';
  this.isLoading = true;

  this.cdr.detectChanges();

  this.chatbotService.sendMessage(text).subscribe({
    next: (res) => {
      this.messages = [
        ...this.messages,
        { id: this.msgIdCounter++, role: 'bot', content: res.response }
      ];
      this.isLoading = false;
      this.cdr.detectChanges();
    },
    error: () => {
      this.messages = [
        ...this.messages,
        {
          id: this.msgIdCounter++,
          role: 'bot',
          content: 'Erreur, réessayez.'
        }
      ];
      this.isLoading = false;
      this.cdr.detectChanges();
    }
  });
}

  private scrollToBottom(): void {
    try {
      this.scrollContainer.nativeElement.scrollTop =
        this.scrollContainer.nativeElement.scrollHeight;
    } catch {}
  }
}