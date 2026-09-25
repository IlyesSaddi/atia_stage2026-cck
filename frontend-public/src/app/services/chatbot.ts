import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface ChatResponse {
  response: string;
}

@Injectable({
  providedIn: 'root'
})
export class ChatbotService {

  // Ancien: /api/chatbot/chat  →  Nouveau: /api/chatbot.php (POST direct, sans action)
  private apiUrl = `${environment.apiBaseUrl}/api/chatbot.php`;

  constructor(private http: HttpClient) {}

  sendMessage(message: string): Observable<ChatResponse> {
    // Ancien: POST /api/chatbot/chat
    // Nouveau: POST /api/chatbot.php
    return this.http.post<ChatResponse>(this.apiUrl, { message });
  }
}
