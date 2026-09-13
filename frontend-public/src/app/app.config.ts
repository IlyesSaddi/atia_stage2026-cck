import { ApplicationConfig, ErrorHandler, LOCALE_ID, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withInMemoryScrolling } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { registerLocaleData } from '@angular/common';       
import localeFr from '@angular/common/locales/fr';          
import { routes } from './app.routes';
import { provideNgToast } from 'ng-angular-popup';

registerLocaleData(localeFr);                               
class GlobalErrorHandler implements ErrorHandler {
  handleError(error: any): void {
    if (error?.message?.includes('ResizeObserver')) return;
    console.error(error);
  }
}
export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    { provide: ErrorHandler, useClass: GlobalErrorHandler },
    provideRouter(
      routes,
      withInMemoryScrolling({
        scrollPositionRestoration: 'enabled',
        anchorScrolling: 'enabled',
      }),
    ),
    provideHttpClient(),
    provideNgToast(),
    { provide: LOCALE_ID, useValue: 'fr' },
  ],
};