import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AdhesionModalComponent } from './adhesion-modal/adhesion-modal';
import { NgToastModule } from 'ng-angular-popup';
import { ToastComponent } from './toast/toast'; 

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, NgToastModule,ToastComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('ATIA-PUBLIC');
}
